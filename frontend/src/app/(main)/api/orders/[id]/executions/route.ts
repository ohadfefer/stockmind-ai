import { NextResponse } from "next/server"
import { withAccount } from "@/lib/http/with-auth"
import { badGateway, conflict, notFound } from "@/lib/http/problem"
import { withTransaction } from "@/lib/db"
import { createExecution } from "@/services/execution-service"
import {
  claimPendingOrder,
  getPendingOrder,
  type OrderTerms,
} from "@/services/order-service"
import { recordTradeSettlement } from "@/services/cash-ledger-service"
import { invalidatePositions, updatePosition } from "@/services/position/position-service"
import { finnhubFetch } from "@/lib/finnhub"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

type Params = { id: string }

/**
 * Raised inside the transaction when the claim finds nothing pending. It has to
 * throw rather than return: a return would commit whatever the callback had
 * already done. Carries no SQLSTATE, so withTransaction's retry rule
 * ("no code means not a serialization abort") passes it straight out.
 */
class OrderNotPending extends Error {}

/**
 * Settling an order creates an execution, so it is a POST to the order's
 * executions collection rather than a verb in the path (/api/orders/execute).
 *
 * The order id now comes from the URL and the body is ignored entirely. That
 * is not a cosmetic change: the old endpoint accepted symbol, side and
 * quantity in the body and never read them, which left three fields on the
 * wire that looked authoritative and were not.
 *
 * No Location header. The created resource is an execution, and executions
 * have no URL of their own — nothing fetches one. Pointing Location at the
 * parent order would name a different resource than the one created, so a 201
 * identified by the target URI is the honest answer (RFC 9110 §15.3.2).
 */
export const POST = withAccount<Params>(
  async (request, { userId, accountId }, { params }) => {
    const orderId = Number((await params).id)
    if (!Number.isInteger(orderId) || orderId <= 0) return notFound("Order")

    // Scoped to this account, so another user's orderId reads as "not pending"
    // rather than leaking whether it exists.
    const pending = await getPendingOrder(orderId, accountId)
    if (!pending) {
      return conflict("order_not_pending", "The order is not pending.")
    }

    // Outside the transaction, deliberately. A held transaction occupies a
    // PgBouncer server slot until it commits, so nothing that waits on a third
    // party belongs inside one — an unreachable Finnhub would otherwise pin a
    // connection for as long as the fetch takes.
    const quote = (await finnhubFetch("/quote", { symbol: pending.symbol })) as { c: number }
    if (!quote || !quote.c) {
      return badGateway("Unable to fetch a current price for the order's symbol.")
    }

    const commission = 2.0
    const fees = 0.5

    // The four writes that make up a settlement, as one unit. Previously four
    // separate transactions, which meant an error partway through could leave
    // an order filled with no execution, an execution with no cash entry, or
    // cash moved with the position untouched — each of them a state the app's
    // own invariants say cannot exist.
    //
    // The callback may be replayed from the top on a serialization abort, so it
    // holds nothing but SQL: the quote is already fetched above, and the cache
    // invalidation and audit write happen below, after the commit.
    let settled: { executionId: number; terms: OrderTerms }
    try {
      settled = await withTransaction(async (tx) => {
        // The real gate. The read above can go stale, so if a concurrent
        // request claimed the order in between, this matches nothing.
        const order = await claimPendingOrder(tx, orderId, accountId, quote.c)
        if (!order) throw new OrderNotPending()

        const id = await createExecution(tx, {
          orderId,
          accountId,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          price: quote.c,
          commission,
          fees,
        })

        await recordTradeSettlement(tx, {
          accountId,
          executionId: id,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          price: quote.c,
          commission,
          fees,
        })

        await updatePosition(tx, {
          accountId,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          price: quote.c,
          commission,
          fees,
        })

        // The terms come back out for the audit entry below, which must record
        // what the order actually said rather than the pre-claim read.
        return { executionId: id, terms: order }
      })
    } catch (err) {
      if (err instanceof OrderNotPending) {
        return conflict("order_not_pending", "The order is not pending.")
      }
      throw err
    }

    // After the commit, both of them, and in this order.
    //
    // The cache invalidation has to follow the commit or it drops rows that are
    // about to be replaced by ones no reader can see yet. The audit write has
    // to stay outside the transaction for a different reason: logAudit swallows
    // its own errors, and a swallowed error inside an open transaction leaves
    // it aborted, so the COMMIT would silently roll back a trade this endpoint
    // had already answered 201 for.
    invalidatePositions(accountId)

    await logAudit({
      userId,
      accountId,
      action: "order_executed",
      details: {
        orderId,
        executionId: settled.executionId,
        symbol: settled.terms.symbol,
        side: settled.terms.side,
        quantity: settled.terms.quantity,
        fillPrice: quote.c,
      },
      ipAddress: getClientIp(request),
    })

    return NextResponse.json({ id: settled.executionId }, { status: 201 })
  },
)
