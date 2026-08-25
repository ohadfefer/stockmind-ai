import { streamText, type ModelMessage } from "ai"
import { xai } from "@ai-sdk/xai"
import { getPortfolioSummary } from "@/services/portfolio/portfolio-service"
import {
  appendUserMessage,
  loadModelMessages,
  persistAssistantMessage,
} from "@/services/ai/conversation-service"
import { buildXaiUsage } from "@/services/ai/xai-cost"
import { toLoggableModelError } from "@/services/ai/model-error"
import { maybeAutoTitleConversation } from "@/services/ai/conversation-title-service"

/**
 * One assistant turn — everything the two routes that can produce one share.
 *
 * POST /api/conversations starts a thread and streams its first turn; POST
 * /api/conversations/{id}/messages streams every turn after. They differ only
 * in where the conversation id comes from and what status the response
 * carries, so the model config, the system prompt and the usage accounting
 * live here instead of being copied into both handlers — the system prompt
 * most of all, where two copies would drift and the assistant would answer
 * differently on turn one than on turn two.
 */

const MODEL_ID = "grok-4-1-fast-reasoning"
const HISTORY_LIMIT = 10
const MAX_OUTPUT_TOKENS = 600

/** Caps one turn's prompt cost. Both routes validate against it. */
export const MAX_MESSAGE_LENGTH = 4000

const SYSTEM_PROMPT = [
  "You are StockMind AI, a research assistant focused exclusively on stocks, ETFs, indices, and personal investing.",
  "",
  "TOPIC SCOPE",
  "You ONLY discuss: public-company fundamentals, market data, earnings, valuation, investing strategies, portfolio construction, risk concepts, and finance education.",
  "If the user asks anything off-topic (programming, recipes, travel, weather, general life advice, news unrelated to markets, sports, etc.), refuse in ONE short sentence and steer them back to investing. Example: \"I can only help with investing topics — want to talk about stocks instead?\"",
  "",
  "TONE",
  "Concise. Plain language. Light markdown is fine (bold, bullet lists). No emoji.",
  "",
  "RULES",
  "- Never claim to be a licensed financial advisor.",
  "- Don't give personalized buy/sell recommendations. Trade-offs and educational framing are fine.",
  "- Always include units on numbers (%, $, M shares).",
  "- If the next system message contains the user's portfolio snapshot, use it when answering questions about \"my portfolio\".",
].join("\n")

/**
 * Trims a submitted message and reports whether it is sendable at all.
 *
 * Empty and over-length collapse into one null because the routes answer both
 * with the same 400 naming the rule — the client never branches on which one
 * it broke, and one message that states the constraint beats two that don't.
 */
export function normalizeMessageContent(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return null
  return trimmed
}

export interface ConversationTurnParams {
  userId: number
  accountId: number
  runningBalance: number
  conversationId: number
  content: string
  /** The request's signal, so a client disconnect stops the upstream call. */
  abortSignal: AbortSignal
}

/**
 * Persists the user message, then starts the assistant stream.
 *
 * Returns the streamText result rather than a Response so the caller owns the
 * status line: the create route answers 201 with a Location, the messages
 * route answers a plain 200.
 */
export async function streamConversationTurn(params: ConversationTurnParams) {
  const { userId, accountId, runningBalance, conversationId, content } = params

  // Persist user message before streaming so it survives a disconnect.
  await appendUserMessage(conversationId, content)

  // Fetch portfolio snapshot in parallel with loading message history.
  const [history, portfolioSnapshot] = await Promise.all([
    loadModelMessages(conversationId, HISTORY_LIMIT),
    buildPortfolioSnapshotMessage(accountId, runningBalance),
  ])

  const messages: ModelMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(portfolioSnapshot ? [portfolioSnapshot] : []),
    ...history,
  ]

  return streamText({
    model: xai(MODEL_ID),
    messages,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    // Abort the upstream xAI request if the client disconnects, so we
    // don't keep paying for tokens nobody is reading.
    abortSignal: params.abortSignal,
    onError: ({ error }) => {
      // Never the raw error — see toLoggableModelError for what it would carry.
      console.error(
        `conversation streamText error [conversation ${conversationId}]:`,
        toLoggableModelError(error),
      )
    },
    onFinish: async ({ text, usage, providerMetadata, response }) => {
      // A provider failure closes the stream with no text at all: the SDK
      // converts it into an `error` part and `textStream` drops those, so the
      // turn ends clean and empty rather than faulting. Persisting that would
      // write an empty assistant row — a blank bubble on every future load of
      // the thread — and would auto-title the conversation off a turn that
      // never happened. The client reports the failure off the same signal.
      if (!text.trim()) return

      const normalized = buildXaiUsage({
        usage,
        responseBody: response.body,
        providerMetadata,
      })
      try {
        await persistAssistantMessage({
          userId,
          conversationId,
          content: text,
          model: MODEL_ID,
          usage: normalized,
        })
      } catch (err) {
        console.error("conversation onFinish persistence failed:", err)
      }
      // Best-effort: title only flips from default on the first turn. Errors
      // are swallowed inside the helper so they can't break the stream.
      await maybeAutoTitleConversation({
        userId,
        conversationId,
        firstUserMessage: content,
      })
    },
  })
}

async function buildPortfolioSnapshotMessage(
  accountId: number,
  runningBalance: number,
): Promise<ModelMessage | null> {
  try {
    const summary = await getPortfolioSummary(accountId, runningBalance)
    if (summary.holdings.length === 0) return null
    const lines = summary.holdings
      .map(
        (h) =>
          `- ${h.ticker} | ${h.sector} | ${h.shares} sh | $${h.totalValue.toFixed(2)} | wt ${h.portfolioWeight.toFixed(1)}% | P&L ${h.plPercent.toFixed(1)}%`,
      )
      .join("\n")
    return {
      role: "system",
      content: [
        "USER'S PORTFOLIO SNAPSHOT",
        `Cash: $${summary.runningBalance.toFixed(2)} | Value: $${summary.portfolioValue.toFixed(2)} | Total P&L: $${summary.totalPL.toFixed(2)} (${summary.totalPLPercent.toFixed(1)}%) | Today: $${summary.todayPL.toFixed(2)} (${summary.todayPLPercent.toFixed(1)}%)`,
        "Holdings (ticker | sector | shares | value | weight | P&L%):",
        lines,
      ].join("\n"),
    }
  } catch (err) {
    console.error("conversation: portfolio snapshot failed:", err)
    return null
  }
}
