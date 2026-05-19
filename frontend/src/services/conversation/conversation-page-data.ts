import { redirect } from "next/navigation"
import { resolveAccountContext } from "@/services/account-context"
import {
  getConversationOwner,
  getMessages,
  type ConversationMessage,
} from "@/services/ai/conversation-service"

export interface ConversationPageData {
  conversationId: number | null
  initialPrompt: string | null
  messagesPromise: Promise<ConversationMessage[]>
}

// Only honor ?prompt=… when it looks like a ticker symbol. The auto-send
// fires without explicit user confirmation, so a crafted link could
// otherwise inject arbitrary instructions into the victim's chat.
const TICKER_RE = /^[A-Z][A-Z0-9.-]{0,9}$/

// Logs with context then rethrows so the promise still rejects and the
// section error boundary renders a retryable state — we never swallow a
// transient DB failure into a misleading "empty conversation".
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

/**
 * Resolves the conversation page's blocking concerns — the auth/account
 * chain and the ownership guard — then hands back the message history as a
 * streamable promise so the chat shell can paint before the thread loads.
 *
 * Unlike the dashboard loader this is async: the ownership check gates a
 * redirect (a security boundary that must run during the server render, not
 * inside a streamed promise), so it cannot be deferred. The per-thread
 * message query — the actually heavy part — is what streams.
 */
export async function loadConversationPageData(
  idParam: string | undefined,
  promptParam: string | undefined,
): Promise<ConversationPageData> {
  const requested = parseConversationId(idParam)
  let conversationId: number | null = null

  if (requested != null) {
    const ctx = await resolveAccountContext()
    // No session/account is a genuinely logged-out state; fall through to an
    // empty chat with no id rather than redirecting (the proxy already gates
    // unauthenticated access). Only redirect when an authenticated user asks
    // for a thread that isn't theirs.
    if (ctx) {
      const owner = await getConversationOwner(requested)
      if (!owner || owner.accountId !== ctx.accountId) {
        // Don't leak: collapse missing/unauthorized to "no id".
        redirect("/conversation")
      }
      conversationId = requested
    }
  }

  // Bare /conversation visit (or unauthorized collapsed above): no id, so the
  // messages route creates the conversation row lazily on the first send and
  // empty visits never write to the DB. Promise.resolve([]) resolves
  // synchronously, so use() never suspends on the new-chat path.
  const messagesPromise =
    conversationId != null
      ? getMessages(conversationId).catch(
          logAndRethrow("conversation messages failed"),
        )
      : Promise.resolve<ConversationMessage[]>([])

  const rawPrompt = promptParam?.trim().toUpperCase() ?? ""
  const initialPrompt =
    conversationId == null && TICKER_RE.test(rawPrompt) ? rawPrompt : null

  return { conversationId, initialPrompt, messagesPromise }
}

function parseConversationId(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}
