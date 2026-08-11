import { getDb } from "@/lib/db"
import { appendLedgerEntry } from "@/services/cash-ledger-service"

export type TransferDirection = "deposit" | "withdrawal"
export type TransferMethod = "bank_transfer" | "wire" | "internal"

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

export async function createTransfer(params: CreateTransferParams): Promise<number> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO transfers (account_id, direction, amount, method, description)
    VALUES (${params.accountId}, ${params.direction}, ${params.amount}, ${params.method}, ${params.description ?? null})
    RETURNING id
  `
  return rows[0].id as number
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
