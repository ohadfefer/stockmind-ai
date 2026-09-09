import {
  getDb,
  isRetryableSerializationError,
  pgField,
  serializableBackoff,
  SERIALIZABLE_MAX_ATTEMPTS,
  type SqlTag,
} from "@/lib/db"

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

/** Partial unique index from migration 027. */
const REF_CONSTRAINT = "uq_cash_ledger_ref"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The one statement that may write cash_ledger. Every append in the app is this
 * text — nothing else derives a running_balance.
 *
 * Generic over the tag's return type so it serves both drivers. Handed the
 * HTTP tag from getDb() it yields an unsent NeonQueryPromise, which is what
 * sql.transaction([...]) wants; handed a withTransaction SqlTag it yields a
 * promise of rows, already in flight on the open session. The SQL is identical
 * either way, which is the point — there is only ever one version of it to
 * reason about.
 *
 * The balance is computed inside the INSERT rather than in JS. Over HTTP there
 * is no alternative: the driver is non-interactive, so BEGIN -> read -> compute
 * in JS -> write -> COMMIT is impossible, and reading the tail in one request
 * then inserting in another puts the two statements in separate transactions
 * with no lock between them — two concurrent appends read the same balance and
 * both write a wrong one. Because both INSERT new rows, neither overwrites the
 * other: that is write skew via phantom, not a lost update, which is why
 * REPEATABLE READ would not catch it either. Inside withTransaction the JS
 * round trip is now possible, and still not worth taking — it would add a
 * network hop and re-introduce a value that can go stale between read and
 * write.
 *
 * Collapsing to one statement is necessary but not sufficient. A sequence never
 * ties, but sequence order is not commit order, and at READ COMMITTED the
 * subquery's snapshot can still miss a concurrent uncommitted insert.
 * Serializable is what removes the interleaving: each transaction reads the
 * predicate range the other writes into, SSI records the rw-dependency edges,
 * and one side aborts with 40001. SSI aborts on the dangerous structure, which
 * is necessary but not sufficient for a real cycle — so it has false positives
 * and a retry around it is mandatory, not defensive. Both callers supply one.
 *
 * amount is cast identically in both places it appears so the value stored in
 * `amount` and the value added to `running_balance` round the same way;
 * otherwise the ledger invariant fails by a cent.
 *
 * The tail is fetched via `id = (SELECT MAX(id) ...)` rather than the more
 * obvious `ORDER BY id DESC LIMIT 1`. They are equivalent — id is the PK — but
 * the planner will not match the ORDER BY form to
 * idx_cash_ledger_account_id_desc when there are few distinct accounts: it
 * estimates the account filter as unselective and walks the PK backward
 * instead. Measured on a 60k-row branch with a dormant account, that plan
 * touched 754 buffers and discarded 40k rows where this one touches 7. Buffer
 * count is the lesser problem — a PK walk puts the SSI predicate lock across
 * every other account's recent rows, so appends on unrelated accounts start
 * aborting each other with 40001, which is the exact failure the index was
 * added to prevent. Do not "simplify" this back to ORDER BY ... LIMIT 1
 * without re-checking EXPLAIN.
 */
function ledgerInsert<R>(
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => R,
  params: AppendLedgerEntryParams,
): R {
  return sql`
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
}

/**
 * Appends one ledger row in a transaction of its own, over HTTP.
 *
 * For callers with nothing to commit alongside it — resolveTransfer is the only
 * one — where a single serializable statement is the whole unit of work. A
 * caller that has other writes to land atomically with the append must not use
 * this: it commits on its own, so a failure afterwards leaves the cash moved
 * and the rest of the operation undone. Those callers go through
 * withTransaction and recordTradeSettlement instead.
 */
export async function appendLedgerEntry(params: AppendLedgerEntryParams): Promise<void> {
  for (let attempt = 1; attempt <= SERIALIZABLE_MAX_ATTEMPTS; attempt++) {
    try {
      const sql = getDb()
      // Rebuilt each attempt — a settled NeonQueryPromise cannot be re-run.
      // Same text, same params: there is no stale JS value to recompute, which
      // is the whole point of deriving the balance server-side.
      const statement = ledgerInsert(sql, params)
      await sql.transaction([statement], { isolationLevel: "Serializable" })
      return
    } catch (err) {
      // The row is already there: an earlier attempt committed and we lost the
      // response. That is success, not failure. Branch on the constraint name,
      // never on 23505 alone — a different unique violation is a real error.
      //
      // Safe to swallow only because this transaction is already over. The same
      // catch inside an open transaction would poison it: Postgres rejects
      // every command after an error until ROLLBACK, so carrying on would turn
      // the eventual COMMIT into a silent rollback.
      if (pgField(err, "code") === "23505") {
        if (pgField(err, "constraint") === REF_CONSTRAINT) return
        throw err
      }

      if (
        !isRetryableSerializationError(err) ||
        attempt === SERIALIZABLE_MAX_ATTEMPTS
      ) {
        if (isRetryableSerializationError(err)) {
          console.error(
            `[cash-ledger] serialization abort persisted through ` +
              `${SERIALIZABLE_MAX_ATTEMPTS} attempts; giving up`,
          )
        }
        throw err
      }

      // Same reasoning as withTransaction: a silent retry loop makes contention
      // impossible to distinguish from a healthy write.
      console.warn(
        `[cash-ledger] ${pgField(err, "code")} abort, retrying attempt ` +
          `${attempt + 1}/${SERIALIZABLE_MAX_ATTEMPTS}`,
      )
      await sleep(serializableBackoff(attempt))
    }
  }

  // Unreachable — the final attempt either returns or rethrows. Here so the
  // loop can never fall through and report success having written nothing,
  // which would book a trade with no ledger row.
  throw new Error(`appendLedgerEntry: exhausted ${SERIALIZABLE_MAX_ATTEMPTS} attempts`)
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

/**
 * Books the cash side of one execution, inside the caller's transaction.
 *
 * Takes the tag rather than opening its own transaction because the settlement
 * has to commit with the execution row it references and the position it moves
 * — see the executions route. It therefore carries neither of the two things
 * appendLedgerEntry has:
 *
 *   - No retry. An SSI abort rolls back the caller's whole transaction, so
 *     there is nothing left to re-send one statement into; withTransaction
 *     replays the entire callback instead.
 *   - No uq_cash_ledger_ref swallow. That branch exists for a committed write
 *     whose response was lost, and this write cannot be in that position: a
 *     rolled-back attempt takes its executionId with it, so every replay
 *     inserts against a fresh reference_id. If this ever does raise 23505 it is
 *     a real bug and must surface. (The index still earns its keep for
 *     transfers, where reference_id is a stable transfer id.)
 */
export async function recordTradeSettlement(
  sql: SqlTag,
  params: RecordTradeSettlementParams,
) {
  const tradeValue = params.quantity * params.price
  const totalCosts = params.commission + params.fees

  // Buy: cash leaves the account. Sell: cash enters the account.
  const amount =
    params.side === "buy"
      ? -(tradeValue + totalCosts)
      : tradeValue - totalCosts

  const description = `${params.side.toUpperCase()} ${params.quantity} ${params.symbol} @ $${params.price} (comm $${params.commission}, fees $${params.fees})`

  await ledgerInsert(sql, {
    accountId: params.accountId,
    entryType: "trade_settlement",
    amount,
    referenceId: params.executionId,
    description,
  })
}
