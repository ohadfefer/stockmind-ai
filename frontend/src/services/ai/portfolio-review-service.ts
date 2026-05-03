import { createHash } from "node:crypto"
import { Output, generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import { getDb } from "@/lib/db"
import type { PortfolioSummary } from "@/services/portfolio-service"
import { buildXaiUsage, type NormalizedUsage } from "@/services/ai/xai-cost"
import {
  assertCanStartTurn,
  BudgetExceededError,
  recordAiUsage,
} from "@/services/ai/budget-service"
import type { UserSubscriptionPlan } from "@/services/stripe/subscription-service"

export interface PortfolioReviewUsage {
  promptTokens: number
  completionTokens: number
  cachedInputTokens: number
  totalTokens: number
  costUsd: number
}

export interface PortfolioReview {
  short: string
  full: string
  model: string
  createdAt: Date
  usage: PortfolioReviewUsage | null
  // Set when the user has spent their lifetime AI budget and we declined to
  // generate a fresh review. Surfaces an upgrade prompt in the Analyze tab.
  budgetExceeded?: boolean
}

const STALE_AFTER_MS = 168 * 60 * 60 * 1000
const MODEL_ID = "grok-4-1-fast-reasoning"

const EMPTY_REVIEW: PortfolioReview = {
  short: "Your portfolio is empty. Buy your first stock to unlock AI insights.",
  full: "Your portfolio is empty. Buy your first stock to unlock AI insights.",
  model: "n/a",
  createdAt: new Date(),
  usage: null,
}

// Dedupes concurrent generations for the same (accountId, portfolioHash).
// The map is module-scoped, so an in-flight generation outlives the request
// that started it: navigating between pages reuses the same promise instead
// of kicking off another xAI call and writing a duplicate row.
const inflightReviews = new Map<string, Promise<PortfolioReview>>()

export async function getPortfolioReview(
  userId: number,
  accountId: number,
  plan: UserSubscriptionPlan,
  summary: PortfolioSummary,
): Promise<PortfolioReview> {
  if (summary.holdings.length === 0) return EMPTY_REVIEW

  const portfolioHash = computePortfolioHash(summary)

  let cached: PortfolioReview | null = null
  try {
    cached = await readLatestReview(accountId, portfolioHash)
  } catch (err) {
    console.error("portfolio_reviews read failed:", err)
  }

  let budgetExceeded = false
  try {
    await assertCanStartTurn(userId, plan)
  } catch (err) {
    if (err instanceof BudgetExceededError) budgetExceeded = true
    else throw err
  }

  // Over budget: every user still gets a short for the AiInsightCard teaser,
  // but the full review is blanked so the locked content never rides in the
  // RSC payload. The Analyze tab swaps in an upgrade gate on budgetExceeded.
  // Reuse a cached short if we have one; otherwise spend a cheap short-only
  // call so the teaser has copy on first visit.
  if (budgetExceeded) {
    if (cached?.short) {
      return { ...cached, full: "", model: "n/a", budgetExceeded: true }
    }
    const shortKey = `short:${accountId}:${portfolioHash}`
    const existingShort = inflightReviews.get(shortKey)
    if (existingShort) return existingShort
    const shortTask = runShortOnlyReview(userId, accountId, portfolioHash, summary)
    inflightReviews.set(shortKey, shortTask)
    shortTask.finally(() => inflightReviews.delete(shortKey))
    return shortTask
  }

  // Under-budget path. Treat a cached row missing .full (a prior short-only
  // entry written while over budget) as needing a fresh combined generation.
  if (cached && !isStale(cached.createdAt) && cached.full) {
    return cached
  }

  const key = `full:${accountId}:${portfolioHash}`
  const existing = inflightReviews.get(key)
  if (existing) return existing

  const task = runFreshReview(userId, accountId, portfolioHash, summary, cached)
  inflightReviews.set(key, task)
  task.finally(() => inflightReviews.delete(key))
  return task
}

async function runShortOnlyReview(
  userId: number,
  accountId: number,
  portfolioHash: string,
  summary: PortfolioSummary,
): Promise<PortfolioReview> {
  try {
    const fresh = await generateShortReview(summary)
    try {
      await persistReviewAndUsage(userId, accountId, portfolioHash, fresh)
    } catch (err) {
      console.error("portfolio_reviews short-only write failed:", err)
    }
    return { ...fresh, model: "n/a", budgetExceeded: true }
  } catch (err) {
    console.error("portfolio short-only generation failed:", err)
    return {
      short: "",
      full: "",
      model: "n/a",
      createdAt: new Date(),
      usage: null,
      budgetExceeded: true,
    }
  }
}

async function runFreshReview(
  userId: number,
  accountId: number,
  portfolioHash: string,
  summary: PortfolioSummary,
  cachedFallback: PortfolioReview | null,
): Promise<PortfolioReview> {
  try {
    const fresh = await generateReview(summary)
    try {
      await persistReviewAndUsage(userId, accountId, portfolioHash, fresh)
    } catch (err) {
      console.error("portfolio_reviews write failed:", err)
    }
    return fresh
  } catch (err) {
    console.error("portfolio review generation failed:", err)
    return cachedFallback ?? EMPTY_REVIEW
  }
}

function computePortfolioHash(summary: PortfolioSummary): string {
  const holdings = summary.holdings
    .map((h) => `${h.ticker}:${h.shares.toFixed(4)}`)
    .sort()
    .join("|")
  const payload = `${summary.runningBalance.toFixed(2)}|${holdings}`
  return createHash("sha256").update(payload).digest("hex")
}

function isStale(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > STALE_AFTER_MS
}

async function readLatestReview(
  accountId: number,
  portfolioHash: string,
): Promise<PortfolioReview | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT short_review, full_review, model, created_at,
           prompt_tokens, completion_tokens, total_tokens, cost_usd
    FROM portfolio_reviews
    WHERE account_id = ${accountId} AND portfolio_hash = ${portfolioHash}
    ORDER BY created_at DESC
    LIMIT 1
  `
  if (rows.length === 0) return null
  const row = rows[0]
  const usage: PortfolioReviewUsage | null =
    row.total_tokens != null
      ? {
        promptTokens: row.prompt_tokens ?? 0,
        completionTokens: row.completion_tokens ?? 0,
        cachedInputTokens: 0,
        totalTokens: row.total_tokens,
        costUsd: row.cost_usd != null ? Number(row.cost_usd) : 0,
      }
      : null
  return {
    short: row.short_review,
    full: row.full_review,
    model: row.model,
    createdAt: new Date(row.created_at),
    usage,
  }
}

async function persistReviewAndUsage(
  userId: number,
  accountId: number,
  portfolioHash: string,
  review: PortfolioReview,
): Promise<void> {
  const sql = getDb()
  const u = review.usage
  const inserted = await sql`
    INSERT INTO portfolio_reviews (
      account_id, portfolio_hash, short_review, full_review, model,
      prompt_tokens, completion_tokens, total_tokens, cost_usd
    )
    VALUES (
      ${accountId}, ${portfolioHash}, ${review.short}, ${review.full}, ${review.model},
      ${u?.promptTokens ?? null}, ${u?.completionTokens ?? null},
      ${u?.totalTokens ?? null}, ${u?.costUsd ?? null}
    )
    RETURNING id
  `
  const reviewId = inserted[0]?.id as number | undefined
  if (u && reviewId) {
    await recordAiUsage({
      userId,
      feature: "portfolio_review",
      model: review.model,
      promptTokens: u.promptTokens,
      completionTokens: u.completionTokens,
      cachedInputTokens: u.cachedInputTokens,
      totalTokens: u.totalTokens,
      costUsd: u.costUsd,
      sourceTable: "portfolio_reviews",
      sourceId: reviewId,
    })
  }
}

const reviewSchema = z.object({
  short: z
    .string()
    .describe("A concise 2-3 sentence insight about the portfolio's composition or risk. Plain text, no markdown."),
  full: z
    .string()
    .describe("A detailed analysis in GitHub-flavored markdown. Use `##` for section headings, `###` for sub-headings, `**bold**` for emphasis, and `-` for bullet lists."),
})

async function generateShortReview(summary: PortfolioSummary): Promise<PortfolioReview> {
  const prompt = buildShortPrompt(summary)
  const { text, usage, response } = await generateText({
    model: xai(MODEL_ID),
    prompt,
    // Short is naturally 1-2 sentences; cap as a safety net so a runaway
    // completion can't push an over-budget user massively further over.
    maxOutputTokens: 200,
  })
  const normalized: NormalizedUsage | null = buildXaiUsage({
    usage,
    responseBody: response.body,
  })
  // Refuse to persist a degenerate completion — the empty string would land in
  // portfolio_reviews.short_review, then on the next visit cached?.short is
  // falsy and we'd bill xAI again for the same empty result. Throwing here
  // bubbles to runShortOnlyReview's catch, which returns the sentinel; the
  // user sees the AiInsightCard fallback copy and retries don't get pinned.
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error("portfolio short generation returned empty text")
  }
  return {
    short: trimmed,
    full: "",
    model: MODEL_ID,
    createdAt: new Date(),
    usage: normalized,
  }
}

function buildShortPrompt(summary: PortfolioSummary): string {
  const holdingsLines = summary.holdings
    .map(
      (h) =>
        `${h.ticker}|${h.sector}|wt${h.portfolioWeight.toFixed(1)}%|PL${h.plPercent.toFixed(1)}%`,
    )
    .join("\n")

  return [
    "You are a concise investment analyst.",
    "Output 1-2 sentences of plain text (no markdown, no preamble) naming the portfolio's biggest strength and biggest risk.",
    "",
    "PORTFOLIO SNAPSHOT",
    `Cash: $${summary.runningBalance.toFixed(2)} | Value: $${summary.portfolioValue.toFixed(2)} | Total P&L: $${summary.totalPL.toFixed(2)} (${summary.totalPLPercent.toFixed(1)}%)`,
    "",
    "HOLDINGS (ticker|sector|weight%|P&L%)",
    holdingsLines,
  ].join("\n")
}

async function generateReview(summary: PortfolioSummary): Promise<PortfolioReview> {
  const prompt = buildPrompt(summary)

  const { output, usage, response } = await generateText({
    model: xai(MODEL_ID),
    output: Output.object({ schema: reviewSchema }),
    prompt,
  })

  const normalized: NormalizedUsage | null = buildXaiUsage({
    usage,
    responseBody: response.body,
  })

  return {
    short: output.short,
    full: output.full,
    model: MODEL_ID,
    createdAt: new Date(),
    usage: normalized,
  }
}

function buildPrompt(summary: PortfolioSummary): string {
  const holdingsLines = summary.holdings
    .map(
      (h) =>
        `${h.ticker}|${h.sector}|${h.shares}sh|cost$${h.avgBuy.toFixed(2)}|cur$${h.currentPrice.toFixed(2)}|val$${h.totalValue.toFixed(2)}|PL${h.plPercent.toFixed(1)}%|wt${h.portfolioWeight.toFixed(1)}%`,
    )
    .join("\n")

  return [
    "You are a concise investment analyst. Return BOTH fields:",
    "- `short`: 1-2 sentences, plain text (no markdown), naming the portfolio's biggest strength and biggest risk.",
    "- `full`: GitHub-flavored markdown following the exact structure below — no extra text before or after.",
    "",
    "### INPUT — PORTFOLIO SNAPSHOT",
    `Cash: $${summary.runningBalance.toFixed(2)} | Value: $${summary.portfolioValue.toFixed(2)} | Total P&L: $${summary.totalPL.toFixed(2)} (${summary.totalPLPercent.toFixed(1)}%) | Today: $${summary.todayPL.toFixed(2)} (${summary.todayPLPercent.toFixed(1)}%)`,
    "",
    "### INPUT — HOLDINGS (ticker|sector|shares|avgCost|currentPrice|totalValue|P&L%|weight%)",
    holdingsLines,
    "",
    "### REQUIRED MARKDOWN STRUCTURE FOR `full`",
    "",
    "## Summary",
    "Write 2 sentences max: key portfolio strength and biggest risk.",
    "",
    "## Diversification Score: [X/100]",
    "- **Sector spread:** [score]/25 — [one-line reason]",
    "- **Asset class balance:** [score]/25 — [one-line reason]",
    "- **Geographic exposure:** [score]/25 — [one-line reason]",
    "- **Concentration risk:** [score]/25 — [one-line reason]",
    "",
    "## Top Observations",
    "- [Observation 1: most overweight position and its risk]",
    "- [Observation 2: best and worst performing holding]",
    "- [Observation 3: sector or theme concentration]",
    "",
    "## Recommended Actions",
    "- [Action 1]",
    "- [Action 2]",
    "- [Action 3]",
    "",
    "## Disclaimer",
    "These observations are educational and algorithmic, not personalized financial advice. You retain full control of all investment decisions.",
    "",
    "## Explore Further",
    "- How is my diversification score calculated?",
    "- What is my most problematic holding?",
    "- How can I improve my asset class balance?",
    "- What steps can reduce my concentration risk?",
  ].join("\n")
}
