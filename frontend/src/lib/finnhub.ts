const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export async function finnhubFetch(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
    url.searchParams.set("token", process.env.FINNHUB_API_KEY!);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`Finnhub API error: ${res.status}`);
    }
    return res.json();
}
