import { NextResponse } from "next/server"
import { streamText, type ModelMessage } from "ai"
import { xai } from "@ai-sdk/xai"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getAccountDetails } from "@/services/account-service"
import { getPortfolioSummary } from "@/services/portfolio-service"
import { getSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"
import {
  appendUserMessage,
  getConversationOwner,
  getOrCreateActiveConversation,
  loadModelMessages,
  persistAssistantMessage,
} from "@/services/ai/conversation-service"
import {
  assertCanStartTurn,
  BudgetExceededError,
} from "@/services/ai/budget-service"
import { buildXaiUsage } from "@/services/ai/xai-cost"
import { maybeAutoTitleConversation } from "@/services/ai/conversation-title-service"

const MODEL_ID = "grok-4-1-fast-reasoning"
const HISTORY_LIMIT = 10
const MAX_OUTPUT_TOKENS = 600

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

interface PostBody {
  content?: unknown
  conversationId?: unknown
}

export async function POST(req: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as PostBody
  const content = typeof body.content === "string" ? body.content.trim() : ""
  if (!content) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 })
  }
  if (content.length > 4000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 })
  }

  const requestedConversationId =
    typeof body.conversationId === "number" &&
    Number.isInteger(body.conversationId) &&
    body.conversationId > 0
      ? body.conversationId
      : null

  const [subscription, userId] = await Promise.all([
    getSubscriptionForAuth0Id(session.user.sub),
    getUserIdByAuth0Id(session.user.sub),
  ])
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  const plan = subscription?.plan ?? "free"

  try {
    await assertCanStartTurn(userId, plan)
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json(
        {
          error: "ai_budget_exceeded",
          spent: err.spent,
          budget: err.budget,
        },
        { status: 402 },
      )
    }
    throw err
  }

  const account = await getAccountDetails(userId)
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  // Resolve target conversation. If the client passed an id, use it but only
  // after verifying it belongs to this account — without that check, anyone
  // could write into anyone else's thread by guessing an integer. Collapse
  // missing-vs-not-yours into one 404 so the endpoint isn't an existence oracle.
  let conversationId: number
  if (requestedConversationId != null) {
    const owner = await getConversationOwner(requestedConversationId)
    if (!owner || owner.accountId !== account.id) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
    conversationId = requestedConversationId
  } else {
    conversationId = (await getOrCreateActiveConversation(account.id)).id
  }

  // Persist user message before streaming so it survives a disconnect.
  await appendUserMessage(conversationId, content)

  // Fetch portfolio snapshot in parallel with loading message history.
  const [history, portfolioSnapshot] = await Promise.all([
    loadModelMessages(conversationId, HISTORY_LIMIT),
    buildPortfolioSnapshotMessage(account.id, account.running_balance),
  ])

  const messages: ModelMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(portfolioSnapshot ? [portfolioSnapshot] : []),
    ...history,
  ]

  const result = streamText({
    model: xai(MODEL_ID),
    messages,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    // Abort the upstream xAI request if the client disconnects, so we
    // don't keep paying for tokens nobody is reading.
    abortSignal: req.signal,
    onError: ({ error }) => {
      console.error("conversation streamText error:", error)
    },
    onFinish: async ({ text, usage, providerMetadata, response }) => {
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

  return result.toTextStreamResponse()
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
