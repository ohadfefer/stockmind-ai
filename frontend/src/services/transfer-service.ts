import { getDb } from "@/lib/db"
import { appendLedgerEntry } from "@/services/cash-ledger-service"

export type TransferDirection = "deposit" | "withdrawal"
export type TransferMethod = "bank_transfer" | "wire" | "internal"
export type TransferStatus = "pending" | "completed" | "failed" | "reversed"

/** Mirror the CHECK constraints in migration 008, for route-level validation. */
export const TRANSFER_DIRECTIONS: readonly TransferDirection[] = ["deposit", "withdrawal"]
export const TRANSFER_METHODS: readonly TransferMethod[] = ["bank_transfer", "wire", "internal"]

export interface Transfer {
  id: number
  direction: TransferDirection
  amount: number
  method: TransferMethod
  status: TransferStatus
  description: string | null
  initiatedAt: string
  completedAt: string | null
}

export const TRANSFER_COOLDOWN_HOURS = 72

export interface TransferCooldown {
  lastInitiatedAt: string | null
  nextAllowedAt: string | null
  remainingMs: number
}

interface CreateTransferParams {
  accountId: number
  direction: TransferDirection
  amount: number
  method: TransferMethod
  description?: string
}

/**
 * Returns the cooldown state for the next transfer on this account.
 * Excludes failed/reversed transfers so a user isn't penalized for a system
 * failure. The check is anchored to initiated_at because the ledger entry
 * isn't written until resolveTransfer runs ~10s later.
 *
 * Descriptive only — this is what the UI and the 429 body report, not what
 * stops a second transfer. Enforcement lives inside createTransfer's INSERT,
 * because anything read here is stale by the time the caller acts on it.
 */
export async function getTransferCooldown(accountId: number): Promise<TransferCooldown> {
  const sql = getDb()
  const rows = await sql`
    SELECT initiated_at
    FROM transfers
    WHERE account_id = ${accountId}
      AND status IN ('pending', 'completed')
    ORDER BY initiated_at DESC
    LIMIT 1
  `
  if (rows.length === 0) {
    return { lastInitiatedAt: null, nextAllowedAt: null, remainingMs: 0 }
  }
  const lastInitiatedAt = (rows[0].initiated_at as Date).toISOString()
  const nextAllowed = new Date(rows[0].initiated_at as Date)
  nextAllowed.setTime(nextAllowed.getTime() + TRANSFER_COOLDOWN_HOURS * 60 * 60 * 1000)
  const remainingMs = Math.max(0, nextAllowed.getTime() - Date.now())
  return {
    lastInitiatedAt,
    nextAllowedAt: nextAllowed.toISOString(),
    remainingMs,
  }
}

/**
 * Inserts the transfer, or returns null if the account is inside its cooldown.
 *
 * The gate is part of the INSERT rather than a SELECT the caller runs first.
 * The two-statement version was a check-then-act across a network round trip:
 * two concurrent POSTs both read a clear cooldown, both passed, and both
 * inserted, so the 72h limit only ever bound a serial caller. As one statement
 * the second request sees the first's row through NOT EXISTS and writes
 * nothing.
 *
 * The predicate mirrors getTransferCooldown exactly — same status filter, same
 * window — because the two must agree on what "in cooldown" means. This one is
 * the enforcement point; that one is now only descriptive.
 *
 * The window is multiplied out rather than interpolated into an INTERVAL
 * literal: a parameter inside quotes is not a parameter. Every parameter is
 * cast explicitly because INSERT ... SELECT does not infer parameter types
 * from the target columns the way INSERT ... VALUES does — an uncast $n in a
 * SELECT list resolves to text, and text into NUMERIC is not a cast Postgres
 * will make on its own. idx_transfers_account_initiated (migration 020)
 * supports the predicate; status still needs the heap, so it is not an
 * index-only scan.
 */
export async function createTransfer(params: CreateTransferParams): Promise<number | null> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO transfers (account_id, direction, amount, method, description)
    SELECT ${params.accountId}::int, ${params.direction}::text, ${params.amount}::numeric,
           ${params.method}::text, ${params.description ?? null}::text
    WHERE NOT EXISTS (
      SELECT 1 FROM transfers
      WHERE account_id = ${params.accountId}
        AND status IN ('pending', 'completed')
        AND initiated_at > NOW() - (${TRANSFER_COOLDOWN_HOURS}::int * INTERVAL '1 hour')
    )
    RETURNING id
  `
  return (rows[0]?.id as number | undefined) ?? null
}

/**
 * One transfer, scoped to the account that owns it.
 *
 * Scoping in the WHERE clause rather than comparing account_id afterwards is
 * what collapses "not yours" into the same null as "not there", so the 404 the
 * route returns can't be used to probe which transfer ids exist.
 *
 * amount is NUMERIC, which the driver hands back as a string to preserve
 * precision. Number() here keeps the JSON shape consistent with every other
 * money field the API returns — the same split that createAlert had to fix in
 * step 2, caught before it shipped this time.
 */
export async function getTransfer(
  transferId: number,
  accountId: number,
): Promise<Transfer | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, direction, amount, method, status, description, initiated_at, completed_at
    FROM transfers
    WHERE id = ${transferId} AND account_id = ${accountId}
  `
  if (rows.length === 0) return null

  const row = rows[0]
  return {
    id: row.id as number,
    direction: row.direction as TransferDirection,
    amount: Number(row.amount),
    method: row.method as TransferMethod,
    status: row.status as TransferStatus,
    description: (row.description as string | null) ?? null,
    initiatedAt: (row.initiated_at as Date).toISOString(),
    completedAt: row.completed_at ? (row.completed_at as Date).toISOString() : null,
  }
}

export async function resolveTransfer(transferId: number): Promise<void> {
  const sql = getDb()

  // Fetch the transfer
  const rows = await sql`
    SELECT id, account_id, direction, amount, status
    FROM transfers WHERE id = ${transferId}
  `
  if (rows.length === 0) throw new Error("Transfer not found")
  const transfer = rows[0]
  if (transfer.status !== "pending") return

  const amount = Number(transfer.amount)
  const ledgerAmount = transfer.direction === "deposit" ? amount : -amount
  const entryType = transfer.direction === "deposit" ? "deposit" : "withdrawal"

  // The status check above is a read-then-act across a network round trip, so
  // two concurrent resolutions of the same transfer can both reach here.
  // appendLedgerEntry is idempotent on (account, entry_type, transfer id), so
  // the loser writes nothing rather than double-crediting the account.
  await appendLedgerEntry({
    accountId: transfer.account_id as number,
    entryType,
    amount: ledgerAmount,
    referenceId: transferId,
    description: entryType === "deposit" ? "Deposit" : "Withdrawal",
  })

  // Guarding on status makes this a compare-and-set, so completed_at is stamped
  // once by the winner instead of by whichever duplicate resolution lands last.
  await sql`
    UPDATE transfers SET status = 'completed', completed_at = NOW()
    WHERE id = ${transferId} AND status = 'pending'
  `
}
