import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account-service"
import {
  deleteConversationForAccount,
  renameConversationForAccount,
  setConversationPinForAccount,
} from "@/services/ai/conversation-service"

interface MutateBody {
  conversationId?: unknown
  title?: unknown
  pinned?: unknown
}

const MAX_TITLE_LENGTH = 200

async function resolveAccountId(): Promise<
  { accountId: number } | NextResponse
> {
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
  return { accountId }
}

function parseConversationId(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null
}

// One PATCH dispatch with two mutually-exclusive bodies — `{ title }` for
// rename, `{ pinned }` for pin/unpin — because both are cheap metadata
// updates on the same row and a dedicated /pin sub-route would be overkill.
export async function PATCH(req: Request) {
  const acct = await resolveAccountId()
  if (acct instanceof NextResponse) return acct

  const body = (await req.json().catch(() => ({}))) as MutateBody
  const conversationId = parseConversationId(body.conversationId)
  if (!conversationId) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 })
  }

  if (typeof body.pinned === "boolean") {
    const ok = await setConversationPinForAccount(
      conversationId,
      acct.accountId,
      body.pinned,
    )
    if (!ok) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 })
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: "Title too long" }, { status: 400 })
  }

  const ok = await renameConversationForAccount(
    conversationId,
    acct.accountId,
    title,
  )
  if (!ok) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const acct = await resolveAccountId()
  if (acct instanceof NextResponse) return acct

  const body = (await req.json().catch(() => ({}))) as MutateBody
  const conversationId = parseConversationId(body.conversationId)
  if (!conversationId) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 })
  }

  const ok = await deleteConversationForAccount(conversationId, acct.accountId)
  if (!ok) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
