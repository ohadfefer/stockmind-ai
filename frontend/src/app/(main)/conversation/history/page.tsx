import { History } from "lucide-react"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account-service"
import {
  listConversationsForAccount,
  type ConversationListItem,
} from "@/services/ai/conversation-service"
import { ConversationHistoryList } from "@/components/conversation/history-list"

export default async function ConversationHistoryPage() {
  const conversations = await loadConversations()

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 py-6">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <History className="size-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">History</h1>
      </div>

      <ConversationHistoryList items={conversations} />
    </div>
  )
}

async function loadConversations(): Promise<ConversationListItem[]> {
  const session = await auth0.getSession()
  if (!session) return []
  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) return []
  const accountId = await getDefaultAccountId(userId)
  if (!accountId) return []
  return listConversationsForAccount(accountId, 50)
}
