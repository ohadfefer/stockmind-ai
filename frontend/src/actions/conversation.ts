import { ApiError, apiRequest, apiSend, json } from "@/actions/http"

/**
 * The 402 carries spent and budget as problem+json extension members, which
 * reach the caller as untyped values on ApiError.extra. This class does that
 * cast once, here, so the chat panel gets typed numbers instead of asserting
 * on a Record<string, unknown> at the point of use — the same shape
 * TransferCooldownError gives the 429 on /api/transfers.
 */
export class AiBudgetExceededError extends Error {
  readonly spent: number
  readonly budget: number
  constructor(spent: number, budget: number) {
    super("AI budget exceeded")
    this.name = "AiBudgetExceededError"
    this.spent = spent
    this.budget = budget
  }
}

export interface ConversationTurn {
  /** The thread the turn landed in — freshly created by startConversation. */
  conversationId: number
  /** Assistant tokens as they arrive. */
  stream: ReadableStream<Uint8Array>
}

/**
 * First message of a new chat: creates the thread and streams the reply in one
 * request. The id comes back on X-Conversation-Id because the body is the
 * stream — see the route for why the create streams at all.
 */
export async function startConversation(
  content: string,
): Promise<ConversationTurn> {
  const res = await postTurn("/api/conversations", content)

  const conversationId = Number(res.headers.get("X-Conversation-Id"))
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    throw new ApiError(
      res.status,
      "malformed_response",
      "Malformed response",
      "The server did not identify the conversation it created.",
    )
  }

  return { conversationId, stream: requireBody(res, "/api/conversations") }
}

/** Every turn after the first, in a thread the caller already has an id for. */
export async function sendConversationMessage(
  conversationId: number,
  content: string,
): Promise<ConversationTurn> {
  const path = `/api/conversations/${conversationId}/messages`
  const res = await postTurn(path, content)
  return { conversationId, stream: requireBody(res, path) }
}

export function renameConversation(
  conversationId: number,
  title: string,
): Promise<void> {
  return apiSend(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    ...json({ title }),
  })
}

export function setConversationPinned(
  conversationId: number,
  pinned: boolean,
): Promise<void> {
  return apiSend(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    ...json({ pinned }),
  })
}

export function deleteConversation(conversationId: number): Promise<void> {
  return apiSend(`/api/conversations/${conversationId}`, { method: "DELETE" })
}

/** Shared POST for both turn endpoints, with the budget error mapped once. */
async function postTurn(path: string, content: string): Promise<Response> {
  try {
    return await apiRequest(path, { method: "POST", ...json({ content }) })
  } catch (err) {
    if (err instanceof ApiError && err.code === "ai_budget_exceeded") {
      const { spent, budget } = err.extra
      throw new AiBudgetExceededError(Number(spent ?? 0), Number(budget ?? 0))
    }
    throw err
  }
}

/**
 * A 2xx with no body would otherwise surface as a TypeError on .getReader().
 * Only reachable if the stream fails to open at all, but the caller renders
 * ApiError.message, so it needs to be one.
 */
function requireBody(res: Response, path: string): ReadableStream<Uint8Array> {
  if (!res.body) {
    throw new ApiError(
      res.status,
      "empty_stream",
      "Empty response",
      `${path} returned no message stream.`,
    )
  }
  return res.body
}
