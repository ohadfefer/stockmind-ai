import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account-service"
import {
  getConversationOwner,
  getMessages,
  type ConversationMessage,
} from "@/services/ai/conversation-service"
import { getSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"
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
  let isPro = false

  const requested = parseConversationId(idParam)

  const session = await auth0.getSession()
  if (session) {
    const [subscription, userId] = await Promise.all([
      getSubscriptionForAuth0Id(session.user.sub),
      getUserIdByAuth0Id(session.user.sub),
    ])
    isPro = subscription?.plan === "pro"

    // Strip ?id= for non-pro callers up front so an unvalidated id never
    // reaches the renderer (or any future code that consumes idParam outside
    // the pro-gated branch). Free users only ever see a clean URL.
    if (!isPro && requested != null) {
      redirect("/conversation")
    }

    if (isPro && userId) {
      const accountId = await getDefaultAccountId(userId)
      if (accountId && requested != null) {
        const owner = await getConversationOwner(requested)
        if (!owner || owner.accountId !== accountId) {
          // Don't leak: collapse missing/unauthorized to "no id".
          redirect("/conversation")
        }
        conversationId = requested
        initialMessages = await getMessages(requested)
      }
      // Bare /conversation visit: render an empty chat with no id. The
      // messages route creates the conversation row lazily on the first
      // send so empty visits never write to the DB.
    }
  }

  return (
    <ChatPanel
      conversationId={conversationId}
      initialMessages={initialMessages}
      isPro={isPro}
    />
  )
}

function parseConversationId(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}
