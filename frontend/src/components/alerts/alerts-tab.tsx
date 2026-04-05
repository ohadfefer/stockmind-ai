"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDelete } from "@/components/ui/confirm-delete"
import { deleteAlertAction } from "@/actions/alerts"
import type { StockAlert, AlertCondition, AlertStatus } from "@/services/alerts/alerts-service"

const conditionLabels: Record<AlertCondition, string> = {
  price_above: "Price Above",
  price_below: "Price Below",
  earnings: "Earnings",
  ai_signal: "AI Signal",
}

const conditionColors: Record<AlertCondition, string> = {
  price_above: "bg-[#10B981]/15 text-[#10B981]",
  price_below: "bg-[#EF4444]/15 text-[#EF4444]",
  ai_signal: "bg-primary/15 text-primary",
  earnings: "bg-[#F59E0B]/15 text-[#F59E0B]",
}

const statusColors: Record<AlertStatus, string> = {
  active: "bg-[#10B981]/15 text-[#10B981]",
  triggered: "bg-primary/15 text-primary",
  cancelled: "bg-muted text-muted-foreground",
}

function StatusBadge({ status }: { status: AlertStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[status]}`}>
      {status}
    </span>
  )
}

function AlertTypeBadge({ condition }: { condition: AlertCondition }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${conditionColors[condition]}`}>
      {conditionLabels[condition]}
    </span>
  )
}

function formatCondition(alert: StockAlert): string {
  if (alert.condition === "price_above" && alert.target_value != null) {
    return `Price > $${alert.target_value.toFixed(2)}`
  }
  if (alert.condition === "price_below" && alert.target_value != null) {
    return `Price < $${alert.target_value.toFixed(2)}`
  }
  return conditionLabels[alert.condition]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface AlertsTabProps {
  alerts: StockAlert[]
}

export function AlertsTab({ alerts }: AlertsTabProps) {
  const router = useRouter()
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set())
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  async function handleDelete(alertId: number) {
    setRemovedIds((prev) => new Set(prev).add(alertId))
    try {
      await deleteAlertAction(alertId)
      router.refresh()
    } catch {
      setRemovedIds((prev) => {
        const next = new Set(prev)
        next.delete(alertId)
        return next
      })
    }
  }

  const visibleAlerts = alerts.filter((a) => !removedIds.has(a.id))

  if (visibleAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <p className="text-lg font-semibold text-foreground">
          No alerts set
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create alerts from a stock&apos;s detail page to track price changes.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ticker
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Condition
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Created
            </TableHead>
            <TableHead className="text-right pr-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="sr-only">Delete</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleAlerts.map((alert) => (
            <TableRow
              key={alert.id}
              className="group border-border transition-colors hover:bg-secondary/40"
            >
              <TableCell className="pl-5">
                <span className="font-mono text-sm font-bold text-foreground">
                  {alert.symbol}
                </span>
              </TableCell>
              <TableCell>
                <AlertTypeBadge condition={alert.condition} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatCondition(alert)}
              </TableCell>
              <TableCell>
                <StatusBadge status={alert.status} />
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {formatDate(alert.created_at)}
              </TableCell>
              <TableCell className="pr-5">
                <ConfirmDelete
                  onDelete={() => handleDelete(alert.id)}
                  confirming={confirmingId === alert.id}
                  onConfirmingChange={(v) => setConfirmingId(v ? alert.id : null)}
                  className="opacity-0 group-hover:opacity-100"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
