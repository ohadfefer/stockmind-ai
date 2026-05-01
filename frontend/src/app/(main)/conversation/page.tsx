import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account-service"
import {
  getConversationOwner,
  getLatestActiveConversation,
  getMessages,
  type ConversationMessage,
} from "@/services/ai/conversation-service"
import { ChatPanel } from "@/components/conversation/chat-panel"

interface ConversationPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function ConversationPage({
  searchParams,
}: ConversationPageProps) {
  const { id: idParam } = await searchParams

  let initialMessages: ConversationMessage[] = []
  let conversationId: number | null = null

  const session = await auth0.getSession()
  if (session) {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (userId) {
      const accountId = await getDefaultAccountId(userId)
      if (accountId) {
        const requested = parseConversationId(idParam)
        if (requested != null) {
          const owner = await getConversationOwner(requested)
          if (!owner || owner.accountId !== accountId) {
            // Don't leak: collapse missing/unauthorized to "no id".
            redirect("/conversation")
          }
          conversationId = requested
          initialMessages = await getMessages(requested)
        } else {
          const conv = await getLatestActiveConversation(accountId)
          if (conv) {
            conversationId = conv.id
            initialMessages = await getMessages(conv.id)
          }
        }
      }
    }
  }

  return (
    <ChatPanel
      conversationId={conversationId}
      initialMessages={initialMessages}
    />
  )
}

function parseConversationId(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}
