import { NextResponse } from "next/server"
import { withAccount } from "@/lib/http/with-auth"
import { invalid, problem } from "@/lib/http/problem"
import {
  createTransfer,
  getTransferCooldown,
  resolveTransfer,
  TRANSFER_DIRECTIONS,
  TRANSFER_METHODS,
  type TransferDirection,
  type TransferMethod,
} from "@/services/transfer-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

/**
 * 202, not 201: the transfer exists the moment this returns, but it is
 * `pending` and the money has not moved. resolveTransfer runs ~10s later and
 * writes the ledger entry. Location points at the transfer so the client can
 * poll it to the terminal state instead of guessing at a fixed delay, which is
 * exactly the status monitor RFC 9110 §15.3.3 asks a 202 to provide.
 */
export const POST = withAccount(async (request, { userId, accountId }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return invalid("Body must be a JSON object")

  const { direction, amount, method, description } = body

  // direction and method land in columns with CHECK constraints (migration
  // 008). Unvalidated, a bad value reaches Postgres as a constraint violation,
  // which the withAccount guard turns into an opaque 500 rather than naming
  // the field the caller got wrong.
  if (!TRANSFER_DIRECTIONS.includes(direction as TransferDirection)) {
    return invalid(`direction must be one of: ${TRANSFER_DIRECTIONS.join(", ")}`)
  }

  if (!TRANSFER_METHODS.includes(method as TransferMethod)) {
    return invalid(`method must be one of: ${TRANSFER_METHODS.join(", ")}`)
  }

  // Number.isFinite, not `> 0` alone: Number("abc") is NaN, and every
  // comparison against NaN is false, so a non-numeric amount slipped past the
  // old `Number(amount) <= 0` check straight into a NUMERIC column. Same bug
  // targetValue had on /api/alerts before step 2.
  const parsedAmount = Number(amount)
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return invalid("amount must be a positive number")
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    return invalid("description must be a string")
  }

  // No cooldown pre-check: createTransfer applies the window inside its INSERT,
  // so the gate and the write are one statement. Reading it here first and
  // acting on the result was a check-then-act across a round trip — two
  // concurrent posts both saw a clear cooldown and both got a transfer.
  const transferId = await createTransfer({
    accountId,
    direction: direction as TransferDirection,
    amount: parsedAmount,
    method: method as TransferMethod,
    description: description || undefined,
  })

  if (transferId === null) {
    // Only reachable when the INSERT's gate rejected the row, so this read is
    // purely to describe the state — it cannot let a transfer through however
    // stale it is. nextAllowedAt and remainingMs ride along as RFC 9457
    // extension members rather than a bespoke body, so the shape stays
    // problem+json and TransferCooldownError still reads both off
    // ApiError.extra.
    const cooldown = await getTransferCooldown(accountId)
    return problem(
      429,
      "transfer_cooldown_active",
      "Transfer cooldown active",
      "Only one transfer is allowed every 72 hours.",
      { nextAllowedAt: cooldown.nextAllowedAt, remainingMs: cooldown.remainingMs },
    )
  }

  const ipAddress = getClientIp(request)
  const initiatedAction = direction === "deposit" ? "deposit_initiated" : "withdrawal_initiated"
  const completedAction = direction === "deposit" ? "deposit_completed" : "withdrawal_completed"
  const auditDetails = {
    transferId,
    amount: parsedAmount,
    method,
    description: description || null,
  }

  await logAudit({
    userId,
    accountId,
    action: initiatedAction,
    details: auditDetails,
    ipAddress,
  })

  // Resolve after 10 seconds (simulate processing)
  setTimeout(async () => {
    try {
      await resolveTransfer(transferId)
      await logAudit({
        userId,
        accountId,
        action: completedAction,
        details: auditDetails,
        ipAddress,
      })
    } catch (err) {
      console.error("Failed to resolve transfer", transferId, err)
    }
  }, 10_000)

  return NextResponse.json(
    { id: transferId, status: "pending" },
    { status: 202, headers: { Location: `/api/transfers/${transferId}` } },
  )
})
