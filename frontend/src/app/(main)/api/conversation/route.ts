import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account-service"
import {
  conversationHasMessages,
  createConversation,
  getLatestActiveConversation,
} from "@/services/ai/conversation-service"

// Force a fresh thread. The previous conversation stays in the DB but
// the next chat starts empty (latest-by-updated_at picks the new row).
// If the latest existing thread is already empty, reuse it instead of
// creating yet another row — avoids piling up empties on rapid clicks.
export async function POST() {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  const accountId = await getDefaultAccountId(userId)
  if (!accountId) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  const latest = await getLatestActiveConversation(accountId)
  if (latest && !(await conversationHasMessages(latest.id))) {
    return NextResponse.json({ conversationId: latest.id })
  }

  const { id } = await createConversation(accountId)
  return NextResponse.json({ conversationId: id })
}
