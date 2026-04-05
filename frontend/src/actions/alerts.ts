import type { StockAlert } from "@/services/alerts/alerts-service"

export async function fetchAlerts(): Promise<StockAlert[]> {
  const res = await fetch("/api/alerts")
  if (!res.ok) throw new Error("Failed to fetch alerts")
  const data = await res.json()
  return data.alerts
}

export async function createAlert(
  symbol: string,
  condition: string,
  targetValue: number,
) {
  const res = await fetch("/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, condition, targetValue }),
  })
  if (!res.ok) throw new Error("Failed to create alert")
  return res.json()
}

export async function deleteAlertAction(alertId: number): Promise<void> {
  const res = await fetch("/api/alerts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId }),
  })
  if (!res.ok) throw new Error("Failed to delete alert")
}
