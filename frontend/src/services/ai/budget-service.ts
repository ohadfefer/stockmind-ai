import { getDb } from "@/lib/db"
import type { UserSubscriptionPlan } from "@/services/stripe/subscription-service"

// Lifetime USD caps per user, summed across ALL AI features
// (portfolio reviews + conversation). The total xAI prepaid budget is $5,
// so $0.002/free comfortably supports ~1000 free users.
export const BUDGET_USD: Record<UserSubscriptionPlan, number> = {
  free: 0.002,
  pro: 0.1,
}

// Largest cost we'd allow a turn to start at. If the remaining budget is
// below this, reject pre-flight. Note: this is a best-effort, demo-grade
// gate — under truly concurrent requests the read-then-write window allows
// the cap to be exceeded by the number of in-flight turns. Acceptable here
// because the cap is small ($0.10 pro / $0.002 free) and the chat UI
// blocks new sends while one is streaming.
export const MIN_TURN_RESERVE_USD = 0.0008

export type AiFeature = "portfolio_review" | "conversation"

export class BudgetExceededError extends Error {
  readonly spent: number
  readonly budget: number
  constructor(spent: number, budget: number) {
    super(`AI budget exceeded: spent ${spent}, cap ${budget}`)
    this.name = "BudgetExceededError"
    this.spent = spent
    this.budget = budget
  }
}

export async function getAiSpentUsd(userId: number): Promise<number> {
  const sql = getDb()
  const rows = await sql`
    SELECT COALESCE(SUM(cost_usd), 0) AS spent
    FROM ai_usage_ledger
    WHERE user_id = ${userId}
  `
  return Number(rows[0]?.spent ?? 0)
}

export interface BudgetState {
  budget: number
  spent: number
  remaining: number
  blocked: boolean
}

export async function getBudgetState(
  userId: number,
  plan: UserSubscriptionPlan,
): Promise<BudgetState> {
  const budget = BUDGET_USD[plan]
  const spent = await getAiSpentUsd(userId)
  const remaining = Math.max(budget - spent, 0)
  return {
    budget,
    spent,
    remaining,
    blocked: remaining < MIN_TURN_RESERVE_USD,
  }
}

export async function assertCanStartTurn(
  userId: number,
  plan: UserSubscriptionPlan,
): Promise<void> {
  const state = await getBudgetState(userId, plan)
  if (state.blocked) {
    throw new BudgetExceededError(state.spent, state.budget)
  }
}

export interface RecordAiUsageParams {
  userId: number
  feature: AiFeature
  model: string
  promptTokens: number | null
  completionTokens: number | null
  cachedInputTokens: number | null
  totalTokens: number | null
  costUsd: number
  sourceTable: string | null
  sourceId: number | null
}

export async function recordAiUsage(params: RecordAiUsageParams): Promise<void> {
  const sql = getDb()
  // ON CONFLICT (source_table, source_id) DO NOTHING relies on
  // uniq_ai_usage_source — a partial unique index defined in migration 018.
  // Guards against double-billing if persistAssistantMessage is ever retried.
  await sql`
    INSERT INTO ai_usage_ledger (
      user_id, feature, model,
      prompt_tokens, completion_tokens, cached_input_tokens, total_tokens,
      cost_usd, source_table, source_id
    )
    VALUES (
      ${params.userId}, ${params.feature}, ${params.model},
      ${params.promptTokens}, ${params.completionTokens},
      ${params.cachedInputTokens}, ${params.totalTokens},
      ${params.costUsd}, ${params.sourceTable}, ${params.sourceId}
    )
    ON CONFLICT (source_table, source_id)
      WHERE source_table IS NOT NULL AND source_id IS NOT NULL
      DO NOTHING
  `
}
