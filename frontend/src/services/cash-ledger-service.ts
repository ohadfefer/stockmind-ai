import { getDb } from "@/lib/db"

/** Entry types permitted by the cash_ledger CHECK constraint (migration 003). */
export type LedgerEntryType =
  | "deposit"
  | "withdrawal"
  | "trade_settlement"
  | "dividend"
  | "fee"
  | "interest"
  | "adjustment"

interface AppendLedgerEntryParams {
  accountId: number
  entryType: LedgerEntryType
  amount: number
  referenceId: number | null
  description: string
}

// Measured against a Neon branch: 50 concurrent appends to one account settle
// clean with ~39 needing a retry, while 100 exhausted a 5-attempt budget for 2
// of them. Real contention here is a user double-clicking Buy — 2 or 3 — so 5
// was already ample, but the budget widens almost for free once the backoff is
// capped, and exhaustion surfaces to the caller as a failed trade.
const MAX_ATTEMPTS = 8
const BASE_BACKOFF_MS = 10
// Uncapped exponential reaches ~1.3s on the 8th attempt for no benefit: these
// aborts clear in milliseconds, so waiting longer only adds tail latency.
const MAX_BACKOFF_MS = 100

// 40001 = serialization_failure (SSI abort), 40P01 = deadlock_detected. Both
// mean the transaction left no trace and the same statement can be re-sent.
// Anything else is a real error — retrying a constraint or syntax failure five
// times is pure latency.
const RETRYABLE_SQLSTATES = new Set(["40001", "40P01"])

/** Partial unique index from migration 027. */
const REF_CONSTRAINT = "uq_cash_ledger_ref"

type PgErrorFields = { code?: unknown; constraint?: unknown; sourceError?: unknown }

/**
 * NeonDbError exposes `code` and `constraint` at the top level, but a wrapped
 * driver error can carry them one level down on `sourceError`. Check both.
 */
function pgField(err: unknown, field: "code" | "constraint"): string | undefined {
  if (typeof err !== "object" || err === null) return undefined
  const top = (err as PgErrorFields)[field]
  if (typeof top === "string") return top
  const source = (err as PgErrorFields).sourceError
  if (typeof source === "object" && source !== null) {
    const nested = (source as PgErrorFields)[field]
    if (typeof nested === "string") return nested
  }
  return undefined
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Appends one row to the append-only cash_ledger, deriving running_balance from
 * the account's current tail. The single writer for that invariant — every
 * caller goes through here.
 *
 * The balance is computed inside the INSERT rather than in JS because the Neon
 * HTTP driver is non-interactive: there is no held session, so
 * BEGIN -> read -> compute in JS -> write -> COMMIT is impossible. Reading the
 * tail in one request and inserting in another puts the two statements in
 * separate transactions with no lock between them, so two concurrent appends
 * both read the same balance and both write a wrong one. Because both INSERT
 * new rows, neither overwrites the other — this is write skew via phantom, not
 * a lost update, which is why REPEATABLE READ would not catch it either.
 *
 * Collapsing to one statement is necessary but not sufficient. A sequence never
 * ties, but sequence order is not commit order, and at READ COMMITTED the
 * subquery's snapshot can still miss a concurrent uncommitted insert.
 * Serializable is what removes the interleaving: each transaction reads the
 * predicate range the other writes into, SSI records the rw-dependency edges,
 * and one side aborts with 40001. SSI aborts on the dangerous structure, which
 * is necessary but not sufficient for a real cycle — so it has false positives
 * and the retry below is mandatory, not defensive.
 */
export async function appendLedgerEntry(params: AppendLedgerEntryParams): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const sql = getDb()
      // Rebuilt each attempt — a settled NeonQueryPromise cannot be re-run.
      // Same text, same params: there is no stale JS value to recompute, which
      // is the whole point of deriving the balance server-side.
      //
      // amount is cast identically in both places it appears so the value
      // stored in `amount` and the value added to `running_balance` round the
      // same way; otherwise the ledger invariant fails by a cent.
      //
      // The tail is fetched via `id = (SELECT MAX(id) ...)` rather than the
      // more obvious `ORDER BY id DESC LIMIT 1`. They are equivalent — id is
      // the PK — but the planner will not match the ORDER BY form to
      // idx_cash_ledger_account_id_desc when there are few distinct accounts:
      // it estimates the account filter as unselective and walks the PK
      // backward instead. Measured on a 60k-row branch with a dormant account,
      // that plan touched 754 buffers and discarded 40k rows where this one
      // touches 7. Buffer count is the lesser problem — a PK walk puts the SSI
      // predicate lock across every other account's recent rows, so appends on
      // unrelated accounts start aborting each other with 40001, which is the
      // exact failure the index was added to prevent. Do not "simplify" this
      // back to ORDER BY ... LIMIT 1 without re-checking EXPLAIN.
      const statement = sql`
        INSERT INTO cash_ledger (
          account_id, entry_type, amount, running_balance, reference_id, description
        )
        SELECT
          ${params.accountId}::int,
          ${params.entryType}::text,
          ${params.amount}::numeric(16,2),
          COALESCE(
            (SELECT running_balance FROM cash_ledger
             WHERE account_id = ${params.accountId}::int
               AND id = (SELECT MAX(id) FROM cash_ledger
                         WHERE account_id = ${params.accountId}::int)),
            0
          ) + ${params.amount}::numeric(16,2),
          ${params.referenceId}::int,
          ${params.description}::text
      `
      await sql.transaction([statement], { isolationLevel: "Serializable" })
      return
    } catch (err) {
      const sqlState = pgField(err, "code")

      // The row is already there: an earlier attempt committed and we lost the
      // response. That is success, not failure. Branch on the constraint name,
      // never on 23505 alone — a different unique violation is a real error.
      if (sqlState === "23505") {
        if (pgField(err, "constraint") === REF_CONSTRAINT) return
        throw err
      }

      if (!sqlState || !RETRYABLE_SQLSTATES.has(sqlState) || attempt === MAX_ATTEMPTS) {
        throw err
      }

      // Jittered: two contenders retrying on the same schedule collide again.
      const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS)
      await sleep(Math.round(backoff * (0.5 + Math.random())))
    }
  }

  // Unreachable — the final attempt either returns or rethrows. Here so the
  // loop can never fall through and report success having written nothing,
  // which would book a trade with no ledger row.
  throw new Error(`appendLedgerEntry: exhausted ${MAX_ATTEMPTS} attempts`)
}

interface RecordTradeSettlementParams {
  accountId: number
  executionId: number
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  commission: number
  fees: number
}

export async function recordTradeSettlement(params: RecordTradeSettlementParams) {
  const tradeValue = params.quantity * params.price
  const totalCosts = params.commission + params.fees

  // Buy: cash leaves the account. Sell: cash enters the account.
  const amount =
    params.side === "buy"
      ? -(tradeValue + totalCosts)
      : tradeValue - totalCosts

  const description = `${params.side.toUpperCase()} ${params.quantity} ${params.symbol} @ $${params.price} (comm $${params.commission}, fees $${params.fees})`

  await appendLedgerEntry({
    accountId: params.accountId,
    entryType: "trade_settlement",
    amount,
    referenceId: params.executionId,
    description,
  })
}
