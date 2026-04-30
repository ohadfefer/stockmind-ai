import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account-service"
import {
  getLatestActiveConversation,
  getMessages,
  type ConversationMessage,
} from "@/services/ai/conversation-service"
import { ChatPanel } from "@/components/conversation/chat-panel"

export default async function ConversationPage() {
  let initialMessages: ConversationMessage[] = []

  const session = await auth0.getSession()
  if (session) {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (userId) {
      const accountId = await getDefaultAccountId(userId)
      if (accountId) {
        const conv = await getLatestActiveConversation(accountId)
        if (conv) {
          initialMessages = await getMessages(conv.id)
        }
      }
    }
  }

  return <ChatPanel initialMessages={initialMessages} />
}
