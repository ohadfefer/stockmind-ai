import { apiFetch, apiSend, json } from "@/actions/http"
import type { WatchlistInfo } from "@/types/watchlist"

/** The General list, addressable without first fetching its id. */
export const DEFAULT_WATCHLIST = "default"

/** Every list on the account, each with its item count. */
export function fetchWatchlists(): Promise<WatchlistInfo[]> {
  return apiFetch<WatchlistInfo[]>("/api/watchlists")
}

/**
 * Every list, each flagged with whether it already holds the symbol. Note this
 * annotates rather than filters — the picker renders the unchecked lists too.
 */
export function fetchWatchlistsForSymbol(symbol: string): Promise<WatchlistInfo[]> {
  return apiFetch<WatchlistInfo[]>(
    `/api/watchlists?symbol=${encodeURIComponent(symbol)}`,
  )
}

export function createWatchlist(name: string): Promise<{ id: number; name: string }> {
  return apiFetch<{ id: number; name: string }>("/api/watchlists", {
    method: "POST",
    ...json({ name }),
  })
}

export function renameWatchlist(watchlistId: number, name: string): Promise<void> {
  return apiSend(`/api/watchlists/${watchlistId}`, {
    method: "PATCH",
    ...json({ name }),
  })
}

export function deleteWatchlist(watchlistId: number): Promise<void> {
  return apiSend(`/api/watchlists/${watchlistId}`, { method: "DELETE" })
}

/**
 * Membership writes address the member URL directly, so adding and removing
 * are two methods on one resource rather than one endpoint with an `add` flag.
 * `watchlistId` accepts DEFAULT_WATCHLIST for the General list.
 */
export function addWatchlistItem(
  watchlistId: number | typeof DEFAULT_WATCHLIST,
  symbol: string,
): Promise<void> {
  return apiSend(itemUrl(watchlistId, symbol), { method: "PUT" })
}

export function removeWatchlistItem(
  watchlistId: number | typeof DEFAULT_WATCHLIST,
  symbol: string,
): Promise<void> {
  return apiSend(itemUrl(watchlistId, symbol), { method: "DELETE" })
}

function itemUrl(
  watchlistId: number | typeof DEFAULT_WATCHLIST,
  symbol: string,
): string {
  return `/api/watchlists/${watchlistId}/items/${encodeURIComponent(symbol.toUpperCase())}`
}
