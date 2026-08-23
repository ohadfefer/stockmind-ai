import { withAccount } from "@/lib/http/with-auth"
import { noContent, notFound } from "@/lib/http/problem"
import { deleteAlert } from "@/services/alerts/alerts-service"

type Params = { id: string }

/**
 * DELETE only. There is no GET here because nothing reads a single alert over
 * HTTP — the list is rendered from `getAlerts` server-side in
 * `portfolio-page-data.ts`. The 201 from POST still points its Location at this
 * URL: the resource does live here, it just isn't fetchable, which is all
 * Location promises.
 *
 * The static siblings — /check, /check-earnings, /test-notification — still
 * resolve to their own handlers: Next matches literal segments before dynamic
 * ones, so this only ever sees an id-shaped segment.
 *
 * A segment that isn't a positive integer is a 404 rather than a 400: it names
 * a resource that cannot exist, which is the same answer someone else's alert
 * id gets. deleteAlert scopes by account_id, so a valid id belonging to another
 * account returns zero rows and collapses into the same 404 — no probe can
 * tell "not yours" from "not there".
 */
export const DELETE = withAccount<Params>(
  async (_request, { accountId }, { params }) => {
    const alertId = Number((await params).id)
    if (!Number.isInteger(alertId) || alertId <= 0) return notFound("Alert")

    const deleted = await deleteAlert(accountId, alertId)
    if (!deleted) return notFound("Alert")

    return noContent()
  },
)
