import { NextResponse } from "next/server"
import { withUser } from "@/lib/http/with-auth"
import { notFound } from "@/lib/http/problem"
import { getDefaultAccountId } from "@/services/account/account-service"
import { getTransfer } from "@/services/transfer-service"

type Params = { id: string }

/**
 * The status monitor the 202 on POST /api/transfers points at. The account
 * panel polls it until status leaves "pending", which is why it exists —
 * before this the UI waited a hard-coded 11s and refreshed on faith.
 *
 * withUser + getDefaultAccountId rather than withAccount: withAccount resolves
 * through getOrCreateDefaultAccount, which *writes*, and a read has no business
 * provisioning an account. Same call the missed-alerts collection makes.
 *
 * A non-integer segment 404s rather than 400s — it names a resource that
 * cannot exist, which is the same answer another account's transfer id gets,
 * since getTransfer scopes by account_id.
 */
export const GET = withUser<Params>(async (_request, { userId }, { params }) => {
  const transferId = Number((await params).id)
  if (!Number.isInteger(transferId) || transferId <= 0) return notFound("Transfer")

  const accountId = await getDefaultAccountId(userId)
  if (accountId === null) return notFound("Transfer")

  const transfer = await getTransfer(transferId, accountId)
  if (!transfer) return notFound("Transfer")

  return NextResponse.json(transfer)
})
