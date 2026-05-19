import { History } from "lucide-react"
import { loadConversationHistoryPageData } from "@/services/conversation/conversation-history-page-data"
import { ConversationHistoryContent } from "@/components/conversation/conversation-history-content"

export default function ConversationHistoryPage() {
  const { conversationsPromise } = loadConversationHistoryPageData()

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 py-6">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <History className="size-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">History</h1>
      </div>

      <ConversationHistoryContent conversationsPromise={conversationsPromise} />
    </div>
  )
}
