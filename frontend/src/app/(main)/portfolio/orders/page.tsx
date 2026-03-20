import { ClipboardList } from "lucide-react"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account-service"
import { getOrdersByAccountId, type Order } from "@/services/order-service"
import { ExecuteOrderButton } from "@/components/portfolio/execute-order-button"
import { CancelOrderButton } from "@/components/portfolio/cancel-order-button"

export default async function OrdersPage() {
  const session = await auth0.getSession()
  let orders: Order[] = []

  if (session) {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (userId) {
      const accountId = await getOrCreateDefaultAccount(userId)
      orders = await getOrdersByAccountId(accountId)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your trade orders
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <ClipboardList className="mb-3 size-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">No Orders Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your trade orders will appear here
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-center text-muted-foreground">
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Side</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Time in Force</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Avg Fill Price</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border text-center last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">
                    {order.symbol}
                  </td>
                  <td className="px-4 py-3">
                    <span className={order.side === "buy" ? "text-green-500" : "text-red-500"}>
                      {order.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.order_type}
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground">
                    {Number(order.quantity)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground uppercase">
                    {order.time_in_force}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground">
                    {order.average_fill_price != null
                      ? `$${Number(order.average_fill_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.submitted_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <ExecuteOrderButton
                        orderId={order.id}
                        symbol={order.symbol}
                        side={order.side as "buy" | "sell"}
                        quantity={Number(order.quantity)}
                      />
                      <CancelOrderButton orderId={order.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
