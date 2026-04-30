// Shared cost-extraction helpers for xAI calls (generateText + streamText).
//
// xAI returns `usage.cost_in_usd_ticks` in the raw response body, where
// 1 tick = 1/1e10 USD. This is the authoritative, per-request billed cost.
// See: https://docs.x.ai/developers/rate-limits#checking-token-consumption
//
// In the AI SDK v6, that field shows up in two places depending on the call:
//   - generateText: `response.body.usage.cost_in_usd_ticks`
//   - streamText:   `providerMetadata.xai.cost_in_usd_ticks` (and sometimes
//                    also on the raw response body once it's resolved)
// We try both and fall back to per-Mtok pricing if neither is available.

// xAI pricing for grok-4-1-fast (reasoning/non-reasoning), USD per 1M tokens.
// Source: https://docs.x.ai/docs/models
export const XAI_PRICE_PER_MTOK = {
  input: 0.2,
  cachedInput: 0.05,
  output: 0.5,
} as const

export interface AiSdkUsage {
  inputTokens: number | undefined
  outputTokens: number | undefined
  totalTokens: number | undefined
  inputTokenDetails?: { cacheReadTokens?: number | undefined }
  cachedInputTokens?: number | undefined
}

export interface NormalizedUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedInputTokens: number
  costUsd: number
}

export function extractXaiCostUsd(source: unknown): number | null {
  if (typeof source !== "object" || source === null) return null
  const usage = (source as { usage?: unknown }).usage
  if (typeof usage !== "object" || usage === null) return null
  const ticks = (usage as { cost_in_usd_ticks?: unknown }).cost_in_usd_ticks
  return typeof ticks === "number" ? ticks / 1e10 : null
}

function extractXaiCostFromProviderMetadata(meta: unknown): number | null {
  if (typeof meta !== "object" || meta === null) return null
  const xai = (meta as { xai?: unknown }).xai
  if (typeof xai !== "object" || xai === null) return null
  const direct = (xai as { cost_in_usd_ticks?: unknown }).cost_in_usd_ticks
  if (typeof direct === "number") return direct / 1e10
  // Some SDK versions nest provider usage under `xai.usage`.
  return extractXaiCostUsd(xai)
}

export function buildXaiUsage(args: {
  usage: AiSdkUsage
  responseBody?: unknown
  providerMetadata?: unknown
}): NormalizedUsage | null {
  const promptTokens = args.usage.inputTokens
  const completionTokens = args.usage.outputTokens
  if (promptTokens == null || completionTokens == null) return null

  const cachedInputTokens =
    args.usage.cachedInputTokens ??
    args.usage.inputTokenDetails?.cacheReadTokens ??
    0

  const xaiCostUsd =
    extractXaiCostFromProviderMetadata(args.providerMetadata) ??
    extractXaiCostUsd(args.responseBody)

  if (xaiCostUsd == null) warnFallbackOnce()

  const costUsd =
    xaiCostUsd ??
    computeFallbackCostUsd(promptTokens, completionTokens, cachedInputTokens)

  return {
    promptTokens,
    completionTokens,
    totalTokens: args.usage.totalTokens ?? promptTokens + completionTokens,
    cachedInputTokens,
    costUsd: Number(costUsd.toFixed(8)),
  }
}

// Sticky-once: log a single warning per process if xAI ever stops returning
// `cost_in_usd_ticks`. Avoids flooding logs at request rate while still
// surfacing the regression on the next deploy/restart.
let warnedFallback = false
function warnFallbackOnce(): void {
  if (warnedFallback) return
  warnedFallback = true
  console.warn(
    "xai-cost: cost_in_usd_ticks missing; using fallback pricing (further occurrences suppressed)",
  )
}

function computeFallbackCostUsd(
  promptTokens: number,
  completionTokens: number,
  cachedInput: number,
): number {
  const nonCachedInput = Math.max(promptTokens - cachedInput, 0)
  return (
    (nonCachedInput * XAI_PRICE_PER_MTOK.input +
      cachedInput * XAI_PRICE_PER_MTOK.cachedInput +
      completionTokens * XAI_PRICE_PER_MTOK.output) /
    1_000_000
  )
}
