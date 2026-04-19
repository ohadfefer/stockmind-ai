import { createHash } from "node:crypto"
import { generateObject } from "ai"
import { xai } from "@ai-sdk/xai"
import { z } from "zod"
import { getDb } from "@/lib/db"
import type { PortfolioSummary } from "@/services/portfolio-service"

export interface PortfolioReview {
  short: string
  full: string
  model: string
  createdAt: Date
}

const STALE_AFTER_MS = 48 * 60 * 60 * 1000
const MODEL_ID = "grok-4-1-fast-reasoning"

const EMPTY_REVIEW: PortfolioReview = {
  short: "Your portfolio is empty. Buy your first stock to unlock AI insights.",
  full: "Your portfolio is empty. Buy your first stock to unlock AI insights.",
  model: "n/a",
  createdAt: new Date(),
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
    SELECT short_review, full_review, model, created_at
    FROM portfolio_reviews
    WHERE account_id = ${accountId} AND portfolio_hash = ${portfolioHash}
    ORDER BY created_at DESC
    LIMIT 1
  `
  if (rows.length === 0) return null
  const row = rows[0]
  return {
    short: row.short_review,
    full: row.full_review,
    model: row.model,
    createdAt: new Date(row.created_at),
  }
}

async function writeReview(
  accountId: number,
  portfolioHash: string,
  review: PortfolioReview,
): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO portfolio_reviews (account_id, portfolio_hash, short_review, full_review, model)
    VALUES (${accountId}, ${portfolioHash}, ${review.short}, ${review.full}, ${review.model})
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

  const { object } = await generateObject({
    model: xai(MODEL_ID),
    schema: reviewSchema,
    prompt,
  })

  return {
    short: object.short,
    full: object.full,
    model: MODEL_ID,
    createdAt: new Date(),
  }
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
