/**
 * Reseeds the shared demo account. Run manually whenever you want a fresh demo
 * (there is no cron — this is the reset):
 *
 *   npm run seed:demo
 *
 * Idempotent: wipes the demo account's data and re-seeds the portfolio, trades,
 * watchlists, alerts, AI chats, and a year of daily performance. All Stripe
 * state (subscriptions / plan / customer id) is left untouched.
 */
import { resetDemoAccount } from "../src/services/demo/demo-seed-service"

async function main() {
  const res = await resetDemoAccount()
  console.log(
    `✓ Demo account reseeded — user ${res.userId}, account ${res.accountId}`,
  )
}

main().catch((err) => {
  console.error("x Demo seed failed:", err)
  process.exit(1)
})
