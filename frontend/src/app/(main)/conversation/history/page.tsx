import { loadConversationHistoryPageData } from "@/services/conversation/conversation-history-page-data"
import { ConversationHistoryContent } from "@/components/conversation/conversation-history-content"

export default function ConversationHistoryPage() {
  const { conversationsPromise } = loadConversationHistoryPageData()

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 py-6">
      <ConversationHistoryContent conversationsPromise={conversationsPromise} />
    </div>
  )
}
