import type { NextResponse } from "next/server"
import { problem } from "@/lib/http/problem"
import {
  assertCanStartTurn,
  BudgetExceededError,
} from "@/services/ai/budget-service"
import { getSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"

/**
 * The per-user AI spend gate, expressed as a problem+json early return.
 *
 * Lives beside with-auth.ts because it does the same job — resolve a piece of
 * account state, and hand the handler back a response when the caller isn't
 * allowed to proceed. Shared rather than inlined because both routes that can
 * start a turn must emit an *identical* 402: the chat panel switches on `code`
 * and reads `spent`/`budget` off the extension members, so two hand-written
 * copies would be one wire contract maintained in two places.
 *
 * Returns null when the caller is under budget.
 */
export async function aiBudgetExceeded(
  userId: number,
  auth0Id: string,
): Promise<NextResponse | null> {
  const subscription = await getSubscriptionForAuth0Id(auth0Id)

  try {
    await assertCanStartTurn(userId, subscription?.plan ?? "free")
    return null
  } catch (err) {
    // Anything else is a real failure and belongs in the wrapper's 500.
    if (!(err instanceof BudgetExceededError)) throw err

    // 402 Payment Required is literal here: the block clears by upgrading.
    // spent and budget ride along as RFC 9457 extension members so the budget
    // card can show the numbers without a bespoke error body.
    return problem(
      402,
      "ai_budget_exceeded",
      "AI budget exceeded",
      "You've used your AI allowance. Upgrade to Pro for a larger budget.",
      { spent: err.spent, budget: err.budget },
    )
  }
}
