import { NextResponse } from "next/server"
import { withUser } from "@/lib/http/with-auth"
import { getDefaultAccountId } from "@/services/account/account-service"
import { getTransferCooldown } from "@/services/transfer-service"

/**
 * Stays a sub-resource of the collection rather than moving under {id}: the
 * cooldown is a property of the account's transfer history, not of any one
 * transfer. Next matches literal segments before dynamic ones, so this keeps
 * winning over [id] and "cooldown" never reaches that handler.
 *
 * withUser + getDefaultAccountId, not withAccount — this is a read fired on
 * mount of the account panel, and getOrCreateDefaultAccount writes. An account
 * that doesn't exist has made no transfers, so its cooldown is the zero state.
 */
export const GET = withUser(async (_request, { userId }) => {
  const accountId = await getDefaultAccountId(userId)
  if (accountId === null) {
    return NextResponse.json({ lastInitiatedAt: null, nextAllowedAt: null, remainingMs: 0 })
  }

  return NextResponse.json(await getTransferCooldown(accountId))
})
