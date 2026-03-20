"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { cancelOrder } from "@/actions/orders"

export function CancelOrderButton({ orderId }: { orderId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    setLoading(true)
    try {
      await cancelOrder(orderId)
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
      Cancel
    </button>
  )
}
