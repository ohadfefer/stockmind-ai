const FMP_BASE_URL = "https://financialmodelingprep.com/stable"

export async function fmpFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${FMP_BASE_URL}${endpoint}`)
  url.searchParams.set("apikey", process.env.FMP_API_KEY!)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`FMP API error: ${res.status}`)
  }
  return res.json()
}
