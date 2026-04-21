import { createHash } from "node:crypto"
import { Output, generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import { getDb } from "@/lib/db"
import type { PortfolioSummary } from "@/services/portfolio-service"

export interface PortfolioReviewUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
}

export interface PortfolioReview {
  short: string
  full: string
  model: string
  createdAt: Date
  usage: PortfolioReviewUsage | null
}

const STALE_AFTER_MS = 48 * 60 * 60 * 1000
const MODEL_ID = "grok-4-1-fast-reasoning"

// xAI pricing for grok-4-1-fast (reasoning/non-reasoning), USD per 1M tokens.
// Source: https://docs.x.ai/docs/models
const PRICE_PER_MTOK = {
  input: 0.2,
  cachedInput: 0.05,
  output: 0.5,
} as const

const EMPTY_REVIEW: PortfolioReview = {
  short: "Your portfolio is empty. Buy your first stock to unlock AI insights.",
  full: "Your portfolio is empty. Buy your first stock to unlock AI insights.",
  model: "n/a",
  createdAt: new Date(),
  usage: null,
}

export async function getPortfolioReview(
  accountId: number,
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

  if (cached && !isStale(cached.createdAt)) {
    return cached
  }

  try {
    const fresh = await generateReview(summary)
    writeReview(accountId, portfolioHash, fresh).catch((err) => {
      console.error("portfolio_reviews write failed:", err)
    })
    return fresh
  } catch (err) {
    console.error("portfolio review generation failed:", err)
    return cached ?? EMPTY_REVIEW
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

async function writeReview(
  accountId: number,
  portfolioHash: string,
  review: PortfolioReview,
): Promise<void> {
  const sql = getDb()
  const u = review.usage
  await sql`
    INSERT INTO portfolio_reviews (
      account_id, portfolio_hash, short_review, full_review, model,
      prompt_tokens, completion_tokens, total_tokens, cost_usd
    )
    VALUES (
      ${accountId}, ${portfolioHash}, ${review.short}, ${review.full}, ${review.model},
      ${u?.promptTokens ?? null}, ${u?.completionTokens ?? null},
      ${u?.totalTokens ?? null}, ${u?.costUsd ?? null}
    )
  `
}

const reviewSchema = z.object({
  short: z
    .string()
    .describe("A concise 2-3 sentence insight about the portfolio's composition or risk. No markdown."),
  full: z
    .string()
    .describe("A detailed multi-paragraph analysis covering allocation, sector exposure, risk profile, and rebalance suggestions. Plain text with line breaks; no markdown."),
})

async function generateReview(summary: PortfolioSummary): Promise<PortfolioReview> {
  const prompt = buildPrompt(summary)

  const { output, usage, response } = await generateText({
    model: xai(MODEL_ID),
    output: Output.object({ schema: reviewSchema }),
    prompt,
  })

  return {
    short: output.short,
    full: output.full,
    model: MODEL_ID,
    createdAt: new Date(),
    usage: buildUsage(usage, response.body),
  }
}

// xAI returns `usage.cost_in_usd_ticks` in the raw response body, where
// 1 tick = 1/1e10 USD. This is the authoritative, per-request billed cost.
// See: https://docs.x.ai/developers/rate-limits#checking-token-consumption
function extractXaiCostUsd(body: unknown): number | null {
  if (typeof body !== "object" || body === null) return null
  const usage = (body as { usage?: unknown }).usage
  if (typeof usage !== "object" || usage === null) return null
  const ticks = (usage as { cost_in_usd_ticks?: unknown }).cost_in_usd_ticks
  return typeof ticks === "number" ? ticks / 1e10 : null
}

function buildUsage(
  usage: {
    inputTokens: number | undefined
    outputTokens: number | undefined
    totalTokens: number | undefined
    inputTokenDetails?: { cacheReadTokens?: number | undefined }
  },
  responseBody: unknown,
): PortfolioReviewUsage | null {
  const promptTokens = usage.inputTokens
  const completionTokens = usage.outputTokens
  if (promptTokens == null || completionTokens == null) return null

  const xaiCostUsd = extractXaiCostUsd(responseBody)
  if (xaiCostUsd == null) {
    console.warn("portfolio_reviews: xAI cost_in_usd_ticks missing; using fallback pricing")
  }
  const costUsd = xaiCostUsd ?? computeFallbackCostUsd(promptTokens, completionTokens, usage.inputTokenDetails?.cacheReadTokens ?? 0)

  return {
    promptTokens,
    completionTokens,
    totalTokens: usage.totalTokens ?? promptTokens + completionTokens,
    costUsd: Number(costUsd.toFixed(8)),
  }
}

function computeFallbackCostUsd(promptTokens: number, completionTokens: number, cachedInput: number): number {
  const nonCachedInput = Math.max(promptTokens - cachedInput, 0)
  return (
    (nonCachedInput * PRICE_PER_MTOK.input +
      cachedInput * PRICE_PER_MTOK.cachedInput +
      completionTokens * PRICE_PER_MTOK.output) /
    1_000_000
  )
}

function buildPrompt(summary: PortfolioSummary): string {
  const holdingsLines = summary.holdings
    .map(
      (h) =>
        `- ${h.ticker} (${h.company}, ${h.sector}): ${h.shares} shares, avg cost $${h.avgBuy.toFixed(2)}, current $${h.currentPrice.toFixed(2)}, value $${h.totalValue.toFixed(2)}, P&L ${h.plPercent.toFixed(1)}%, weight ${h.portfolioWeight.toFixed(1)}%`,
    )
    .join("\n")

  return [
    "You are an investment analyst reviewing a user's brokerage portfolio.",
    "",
    `Cash balance: $${summary.runningBalance.toFixed(2)}`,
    `Portfolio value: $${summary.portfolioValue.toFixed(2)}`,
    `Total P&L: $${summary.totalPL.toFixed(2)} (${summary.totalPLPercent.toFixed(1)}%)`,
    `Today's P&L: $${summary.todayPL.toFixed(2)} (${summary.todayPLPercent.toFixed(1)}%)`,
    "",
    "Holdings:",
    holdingsLines,
    "",
    "Return both a concise insight (2-3 sentences) and a detailed analysis. Be specific about sector concentration and diversification. Do not give personalized financial advice; frame observations as educational.",
  ].join("\n")
}
