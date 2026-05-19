import { loadConversationPageData } from "@/services/conversation/conversation-page-data"
import { ConversationContent } from "@/components/conversation/conversation-content"

interface ConversationPageProps {
  searchParams: Promise<{ id?: string; prompt?: string }>
}

export default async function ConversationPage({
  searchParams,
}: ConversationPageProps) {
  const { id, prompt } = await searchParams
  const { conversationId, initialPrompt, messagesPromise } =
    await loadConversationPageData(id, prompt)

  return (
    <ConversationContent
      conversationId={conversationId}
      initialPrompt={initialPrompt}
      messagesPromise={messagesPromise}
    />
  )
}

