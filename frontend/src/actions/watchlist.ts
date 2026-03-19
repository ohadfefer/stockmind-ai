export async function addStock(symbol: string): Promise<{ following: boolean }> {
  const res = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  })
  if (!res.ok) throw new Error("Failed to add stock")
  return res.json()
}

export async function deleteStock(symbol: string, watchlistId?: number): Promise<void> {
  const res = await fetch("/api/watchlist", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, watchlistId }),
  })
  if (!res.ok) throw new Error("Failed to delete stock")
}

export type WatchlistEntry = {
  id: number
  name: string
  hasSymbol: boolean
}

export async function fetchWatchlists(symbol: string): Promise<WatchlistEntry[]> {
  const res = await fetch(`/api/watchlist/lists?symbol=${encodeURIComponent(symbol)}`)
  if (!res.ok) throw new Error("Failed to fetch watchlists")
  const data = await res.json()
  return data.watchlists
}

export async function createWatchlist(name: string): Promise<{ id: number; name: string }> {
  const res = await fetch("/api/watchlist/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error("Failed to create watchlist")
  return res.json()
}

export async function toggleWatchlistItem(
  watchlistId: number,
  symbol: string,
  add: boolean
): Promise<void> {
  const res = await fetch("/api/watchlist/lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ watchlistId, symbol, add }),
  })
  if (!res.ok) throw new Error("Failed to toggle watchlist item")
}
