export async function addStock(symbol: string): Promise<{ following: boolean }> {
  const res = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  })
  if (!res.ok) throw new Error("Failed to add stock")
  return res.json()
}

export async function deleteStock(symbol: string): Promise<void> {
  const res = await fetch("/api/watchlist", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  })
  if (!res.ok) throw new Error("Failed to delete stock")
}
