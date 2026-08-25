import { withUser } from "@/lib/http/with-auth"
import { invalid, notFound } from "@/lib/http/problem"
import { readJsonBody } from "@/lib/http/read-json-body"
import { aiBudgetExceeded } from "@/lib/http/ai-budget"
import { getAccountDetails } from "@/services/account/account-service"
import { getConversationOwner } from "@/services/ai/conversation-service"
import {
  MAX_MESSAGE_LENGTH,
  normalizeMessageContent,
  streamConversationTurn,
} from "@/services/ai/conversation-turn-service"

type Params = { id: string }

/**
 * Every turn after the first. The thread already exists, so this is a plain
 * 200 streaming the reply — no Location, and no X-Conversation-Id either: the
 * id is the path the caller chose, and echoing it back would be a header
 * nothing reads.
 *
 * Reads the same order as POST /api/conversations — validate, budget, resolve
 * — so the two files can be read against each other.
 */
export const POST = withUser<Params>(
  async (request, { userId, session }, { params }) => {
    const conversationId = Number((await params).id)
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return notFound("Conversation")
    }

    const body = await readJsonBody<{ content?: unknown }>(request)

    const content = normalizeMessageContent(body?.content)
    if (!content) {
      return invalid(
        `content must be a non-empty string of at most ${MAX_MESSAGE_LENGTH} characters`,
      )
    }

    const overBudget = await aiBudgetExceeded(userId, session.user.sub)
    if (overBudget) return overBudget

    // getAccountDetails rather than the withAccount wrapper: the turn needs
    // the cash balance for the portfolio snapshot as well as the id, and this
    // resolves both in one call.
    const account = await getAccountDetails(userId)

    // Verify the thread belongs to this account — without that check, anyone
    // could write into anyone else's thread by guessing an integer. Collapse
    // missing-vs-not-yours into one 404 so the endpoint isn't an existence
    // oracle.
    const owner = await getConversationOwner(conversationId)
    if (!owner || owner.accountId !== account.id) return notFound("Conversation")

    const result = await streamConversationTurn({
      userId,
      accountId: account.id,
      runningBalance: account.running_balance,
      conversationId,
      content,
      abortSignal: request.signal,
    })

    return result.toTextStreamResponse()
  },
)
