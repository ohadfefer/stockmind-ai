export interface FinnhubNewsItem {
    category: string
    datetime: number
    headline: string
    id: number
    image: string
    related: string
    source: string
    summary: string
    url: string
}

export async function companyNews(symbol: string): Promise<FinnhubNewsItem[]> {
    const res = await fetch(`/api/news/company?symbol=${encodeURIComponent(symbol)}`)
    if (!res.ok) throw new Error("Failed to fetch company news")
    return res.json()
}

export async function marketNews(minId?: number, category?: string): Promise<FinnhubNewsItem[]> {
    const params = new URLSearchParams()
    if (minId !== undefined) params.set("minId", String(minId))
    if (category) params.set("category", category)
    const res = await fetch(`/api/news/market?${params.toString()}`)
    if (!res.ok) throw new Error("Failed to fetch market news")
    return res.json()
}
