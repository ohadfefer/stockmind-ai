import type { StockAlert } from "@/services/alerts/alerts-service"
import type { MissedAlert } from "@/services/alerts/missed-alerts-service"
import type { UpcomingEarnings } from "@/services/earnings-service"

export async function fetchAlerts(): Promise<StockAlert[]> {
  const res = await fetch("/api/alerts")
  if (!res.ok) throw new Error("Failed to fetch alerts")
  const data = await res.json()
  return data.alerts
}

export async function createAlert(
  symbol: string,
  condition: string,
  targetValue: number | null,
) {
  const res = await fetch("/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, condition, targetValue }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? "Failed to create alert")
  }
  return res.json()
}

export async function fetchUpcomingEarnings(symbol: string): Promise<UpcomingEarnings | null> {
  const res = await fetch(`/api/alerts/upcoming-earnings?symbol=${encodeURIComponent(symbol)}`)
  if (!res.ok) throw new Error("Failed to fetch upcoming earnings")
  const data = await res.json()
  return data.upcoming
}

export async function deleteAlertAction(alertId: number): Promise<void> {
  const res = await fetch("/api/alerts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId }),
  })
  if (!res.ok) throw new Error("Failed to delete alert")
}

export async function fetchMissedAlerts(): Promise<MissedAlert[]> {
  const res = await fetch("/api/alerts/missed")
  if (!res.ok) throw new Error("Failed to fetch missed alerts")
  const data = await res.json()
  return data.alerts
}

export async function dismissMissedAlerts(): Promise<void> {
  const res = await fetch("/api/alerts/missed", { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to dismiss missed alerts")
}
