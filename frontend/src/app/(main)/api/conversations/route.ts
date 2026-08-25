import { withUser } from "@/lib/http/with-auth"
import { invalid } from "@/lib/http/problem"
import { readJsonBody } from "@/lib/http/read-json-body"
import { aiBudgetExceeded } from "@/lib/http/ai-budget"
import { getAccountDetails } from "@/services/account/account-service"
import { createConversation } from "@/services/ai/conversation-service"
import {
  MAX_MESSAGE_LENGTH,
  normalizeMessageContent,
  streamConversationTurn,
} from "@/services/ai/conversation-turn-service"

/**
 * Start a conversation by sending its first message.
 *
 * The documented oddity: this is a 201 whose body is a *stream* rather than a
 * representation of the created resource. The tidier alternative — plain
 * `201 { id }`, then a POST to .../{id}/messages to actually say something —
 * puts a blocking round trip in front of the first token of every new chat,
 * which is the one place in the app where time-to-first-token is the whole
 * experience. The id still reaches the client: X-Conversation-Id carries it,
 * because the body is occupied, and Location names the URL that takes the
 * PATCH and DELETE for the thread.
 *
 * Creation stays lazy — a bare /conversation visit writes nothing, so the
 * history list never fills with empty threads. That is why there is no
 * "create an empty conversation" call here at all.
 */
export const POST = withUser(async (request, { userId, session }) => {
  const body = await readJsonBody<{ content?: unknown }>(request)

  const content = normalizeMessageContent(body?.content)
  if (!content) {
    return invalid(
      `content must be a non-empty string of at most ${MAX_MESSAGE_LENGTH} characters`,
    )
  }

  // Before createConversation, so an over-budget send doesn't leave an empty
  // thread behind — the same reason the row is created lazily in the first
  // place.
  const overBudget = await aiBudgetExceeded(userId, session.user.sub)
  if (overBudget) return overBudget

  // getAccountDetails rather than the withAccount wrapper: the turn needs the
  // cash balance for the portfolio snapshot as well as the id, and this
  // resolves both in one call. It provisions internally, exactly as
  // withAccount would.
  const account = await getAccountDetails(userId)
  const { id: conversationId } = await createConversation(account.id)

  const result = await streamConversationTurn({
    userId,
    accountId: account.id,
    runningBalance: account.running_balance,
    conversationId,
    content,
    abortSignal: request.signal,
  })

  return result.toTextStreamResponse({
    status: 201,
    headers: {
      Location: `/api/conversations/${conversationId}`,
      "X-Conversation-Id": String(conversationId),
    },
  })
})
