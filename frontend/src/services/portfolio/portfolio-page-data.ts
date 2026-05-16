import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getAccountDetails } from "@/services/account-service"
import {
  getPortfolioSummary,
  type PortfolioSummary,
} from "@/services/portfolio/portfolio-service"
import { getAlerts, type StockAlert } from "@/services/alerts/alerts-service"
import {
  getPortfolioReview,
  type PortfolioReview,
} from "@/services/ai/portfolio-review-service"
import {
  getSubscriptionForAuth0Id,
  type UserSubscriptionPlan,
} from "@/services/stripe/subscription-service"

const DEFAULT_SUMMARY: PortfolioSummary = {
  runningBalance: 0,
  portfolioValue: 0,
  totalPL: 0,
  totalPLPercent: 0,
  todayPL: 0,
  todayPLPercent: 0,
  holdings: [],
}

const EMPTY_REVIEW: PortfolioReview = {
  short: "",
  full: "",
  model: "",
  createdAt: new Date(),
  usage: null,
}

interface PortfolioContext {
  userId: number
  accountId: number
  runningBalance: number
  plan: UserSubscriptionPlan
}

async function resolvePortfolioContext(): Promise<PortfolioContext | null> {
  const session = await auth0.getSession()
  if (!session) return null

  const [subscription, userId] = await Promise.all([
    getSubscriptionForAuth0Id(session.user.sub),
    getUserIdByAuth0Id(session.user.sub),
  ])
  if (!userId) return null

  const account = await getAccountDetails(userId)
  if (!account) return null

  return {
    userId,
    accountId: account.id,
    runningBalance: account.running_balance,
    plan: subscription?.plan ?? "free",
  }
}

export interface PortfolioPageData {
  summaryPromise: Promise<PortfolioSummary>
  alertsPromise: Promise<StockAlert[]>
  reviewPromise: Promise<PortfolioReview>
}

// Logs with context (so the server retains the real error) then rethrows so
// the promise still rejects. We deliberately do NOT swallow into defaults: a
// transient DB/Finnhub failure must surface as an error state, not as a
// legitimate-looking $0 / empty portfolio. The only "empty" path is a genuine
// null context (no session/account), handled inline below.
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

/**
 * Kicks off portfolio data fetching without blocking the page render.
 * Returns one promise per page section so each can stream in under its own
 * Suspense boundary. The auth/account chain is resolved once and shared.
 *
 * Genuine "no account" (null context) resolves to a safe empty default.
 * Real failures reject so the section's error boundary renders a retryable
 * error state. A summary failure also rejects the dependent review promise,
 * so the AI copy can never claim "portfolio empty" off degraded data.
 */
export function loadPortfolioPageData(): PortfolioPageData {
  const ctxPromise = resolvePortfolioContext().catch(
    logAndRethrow("portfolio context resolve failed"),
  )

  const summaryPromise = ctxPromise.then((ctx) =>
    ctx
      ? getPortfolioSummary(ctx.accountId, ctx.runningBalance).catch(
          logAndRethrow("portfolio summary failed"),
        )
      : DEFAULT_SUMMARY,
  )

  const alertsPromise = ctxPromise.then((ctx) =>
    ctx
      ? getAlerts(ctx.accountId).catch(logAndRethrow("alerts fetch failed"))
      : ([] as StockAlert[]),
  )

  const reviewPromise = Promise.all([ctxPromise, summaryPromise]).then(
    ([ctx, summary]) =>
      ctx
        ? getPortfolioReview(
            ctx.userId,
            ctx.accountId,
            ctx.plan,
            summary,
          ).catch(logAndRethrow("portfolio review failed"))
        : EMPTY_REVIEW,
  )

  return { summaryPromise, alertsPromise, reviewPromise }
}
