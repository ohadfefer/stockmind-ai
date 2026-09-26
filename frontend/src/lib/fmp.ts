const FMP_BASE_URL = "https://financialmodelingprep.com/stable"

// Without a bound, a connection FMP accepts but never answers waits out
// Node's 5-minute header timeout — and the index bar's refresh is shared by
// every render in the process, so one stuck call would stall them all.
const FMP_TIMEOUT_MS = 5_000

export async function fmpFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${FMP_BASE_URL}${endpoint}`)
  url.searchParams.set("apikey", process.env.FMP_API_KEY!)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FMP_TIMEOUT_MS),
  })
  if (!res.ok) {
    throw new Error(`FMP API error: ${res.status}`)
  }
  return res.json()
}
