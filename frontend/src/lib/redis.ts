import { Redis } from "@upstash/redis"

/**
 * Upstash Redis over its REST API: the shared cache for market data that has
 * to outlive one process — quotes, company profiles and market status
 * (services/stock/quote-cache). Nothing in it is a source of truth. Every
 * caller must work with Redis unreachable, which is what redisTry enforces:
 * a failure is a cache miss, never an error.
 *
 * Built lazily for the same reason getDb() is a function: `next build`
 * imports route modules without the runtime env, and a top-level client
 * would throw on the missing URL. One instance is shared because auto-
 * pipelining batches per client — the 2N GETs a dashboard render issues in
 * one tick go out as a single HTTP request only if they all hit the same
 * client.
 */

let client: Redis | null = null

// Per attempt. A cache read must never wait longer than the Finnhub call it
// is trying to avoid.
const REQUEST_TIMEOUT_MS = 2_000

export function getRedis(): Redis {
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      // Must stay the function form. Given a bare AbortSignal, the SDK does
      // not rethrow an abort: it synthesizes a 200 response from the signal's
      // reason (the `signal?.aborted` branch of its retry loop) and hands
      // that to the caller as if Redis had answered. The function form
      // rethrows, and gives every request its own fresh signal.
      signal: () => AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // The default is 5 retries with exponential backoff, ~11s of stalling
      // per lookup during an outage. One retry covers a dropped socket;
      // anything worse is a miss.
      retry: { retries: 1 },
    })
  }
  return client
}

// After a failure, skip Redis for this long so an outage costs one timeout
// per window instead of one per cache lookup. Process-local, like the
// in-flight maps it sits next to.
const BREAKER_MS = 15_000
let skipUntil = 0

/**
 * Runs one Redis operation and turns any failure — timeout, network, Upstash
 * error, missing credentials — into `undefined`, so the caller treats it as
 * a miss and goes to the source. `null` stays reserved for "key not found".
 *
 * Logs once per breaker window: commands issued in the same pipeline fail
 * together, and a dead cache should not print one stack trace per symbol.
 */
export async function redisTry<T>(
  label: string,
  op: (redis: Redis) => Promise<T>,
): Promise<T | undefined> {
  if (Date.now() < skipUntil) return undefined
  try {
    return await op(getRedis())
  } catch (err) {
    if (Date.now() >= skipUntil) {
      console.error(
        `[redis] ${label} failed; bypassing cache for ${BREAKER_MS / 1000}s`,
        err,
      )
    }
    skipUntil = Date.now() + BREAKER_MS
    return undefined
  }
}
