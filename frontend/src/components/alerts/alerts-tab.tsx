"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { alerts } from "@/lib/mock-data"

function StatusBadge({ status }: { status: "Active" | "Triggered" }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#10B981]/15 px-2.5 py-0.5 text-xs font-semibold text-[#10B981]">
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
      Triggered
    </span>
  )
}

function AlertTypeBadge({
  type,
}: {
  type: "Price Above" | "Price Below" | "AI Signal" | "Earnings"
}) {
  const colorMap: Record<string, string> = {
    "Price Above": "bg-[#10B981]/15 text-[#10B981]",
    "Price Below": "bg-[#EF4444]/15 text-[#EF4444]",
    "AI Signal": "bg-primary/15 text-primary",
    Earnings: "bg-[#F59E0B]/15 text-[#F59E0B]",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorMap[type]}`}
    >
      {type}
    </span>
  )
}

export function AlertsTab() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ticker
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Alert Type
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Condition
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
          {alerts.map((alert) => (
            <TableRow
              key={alert.id}
              className="border-border transition-colors hover:bg-secondary/40"
            >
              <TableCell className="pl-5">
                <span className="font-mono text-sm font-bold text-foreground">
                  {alert.ticker}
                </span>
              </TableCell>
              <TableCell>
                <AlertTypeBadge type={alert.alertType} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {alert.condition}
              </TableCell>
              <TableCell>
                <StatusBadge status={alert.status} />
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {alert.created}
              </TableCell>
              <TableCell className="text-right pr-5">
                <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#EF4444]/10 hover:text-[#EF4444]">
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete alert</span>
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
