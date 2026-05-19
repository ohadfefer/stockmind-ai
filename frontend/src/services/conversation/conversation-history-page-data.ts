import { resolveAccountContext } from "@/services/account-context"
import {
  listConversationsForAccount,
  type ConversationListItem,
} from "@/services/ai/conversation-service"

export interface ConversationHistoryPageData {
  conversationsPromise: Promise<ConversationListItem[]>
}

// Logs with context (so the server retains the real error) then rethrows so
// the promise still rejects and the section error boundary renders a
// retryable state. We deliberately do NOT swallow into an empty list: a
// transient DB failure must surface as an error, not as a legitimate-looking
// "no conversations yet". The only empty path is a genuine logged-out state
// (null context), handled inline below.
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

/**
 * Kicks off the conversation-history fetch without blocking the page render
 * so the chrome paints immediately and the list streams in under its own
 * Suspense boundary. Auth/account resolution goes through the shared
 * resolveAccountContext() — a null context (logged out) is a genuine empty
 * list, while a real DB failure rejects so the error boundary can retry.
 */
export function loadConversationHistoryPageData(): ConversationHistoryPageData {
  const conversationsPromise = resolveAccountContext()
    .then((ctx) =>
      ctx ? listConversationsForAccount(ctx.accountId, 50) : [],
    )
    .catch(logAndRethrow("conversation history failed"))

  return { conversationsPromise }
}
