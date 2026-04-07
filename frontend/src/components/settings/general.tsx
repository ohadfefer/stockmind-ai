"use client"

import { BellRing } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useNotifications } from "@/hooks/use-notifications"

export function GeneralSettings() {
  const { status, subscribe, unsubscribe } = useNotifications()
  const isEnabled = status === "subscribed"
  const isDenied = status === "denied"

  async function handleToggle() {
    if (isEnabled) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold text-foreground">General</h2>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellRing className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Push Notifications
              </p>
              <p className="text-xs text-muted-foreground">
                {isDenied
                  ? "Blocked by browser — enable in browser settings"
                  : "Receive alerts when stock targets are hit"}
              </p>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isDenied || status === "loading"}
          />
        </div>
      </div>
    </div>
  )
}
