import { withAccount } from "@/lib/http/with-auth"
import { invalid, noContent, notFound } from "@/lib/http/problem"
import { readJsonBody } from "@/lib/http/read-json-body"
import {
  deleteConversationForAccount,
  updateConversationForAccount,
} from "@/services/ai/conversation-service"

type Params = { id: string }

const MAX_TITLE_LENGTH = 200

/**
 * Both handlers scope by account_id in the statement itself, so a valid id
 * belonging to someone else returns zero rows and collapses into the same 404
 * a missing id gets — no probe can tell "not yours" from "not there". A
 * segment that isn't a positive integer takes the same 404: it names a
 * resource that cannot exist.
 */

/**
 * One PATCH carrying two independent optional fields — `title` to rename,
 * `pinned` to pin or unpin — which is what PATCH is for. It is not a flag that
 * switches the operation: send either, or both, and each is applied. The
 * service does it in a single UPDATE so a request carrying both can't
 * half-apply.
 *
 * 204 rather than the updated row: the only caller refreshes the RSC tree
 * afterwards and reads nothing from the response.
 */
export const PATCH = withAccount<Params>(
  async (request, { accountId }, { params }) => {
    const conversationId = Number((await params).id)
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return notFound("Conversation")
    }

    const body = await readJsonBody<{ title?: unknown; pinned?: unknown }>(
      request,
    )

    let title: string | undefined
    if (body?.title !== undefined) {
      if (typeof body.title !== "string") return invalid("title must be a string")
      title = body.title.trim()
      if (!title) return invalid("title must not be empty")
      if (title.length > MAX_TITLE_LENGTH) {
        return invalid(`title must be at most ${MAX_TITLE_LENGTH} characters`)
      }
    }

    let pinned: boolean | undefined
    if (body?.pinned !== undefined) {
      if (typeof body.pinned !== "boolean") {
        return invalid("pinned must be a boolean")
      }
      pinned = body.pinned
    }

    // An empty patch would otherwise report success for a request that asked
    // for nothing, which reads as "applied" to a client that got it wrong.
    if (title === undefined && pinned === undefined) {
      return invalid("Provide at least one of: title, pinned")
    }

    const updated = await updateConversationForAccount(conversationId, accountId, {
      title,
      pinned,
    })
    if (!updated) return notFound("Conversation")

    return noContent()
  },
)

/** Cascades to the thread's messages; the AI usage ledger is unaffected. */
export const DELETE = withAccount<Params>(
  async (_request, { accountId }, { params }) => {
    const conversationId = Number((await params).id)
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return notFound("Conversation")
    }

    const deleted = await deleteConversationForAccount(conversationId, accountId)
    if (!deleted) return notFound("Conversation")

    return noContent()
  },
)
