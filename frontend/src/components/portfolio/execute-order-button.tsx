"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Loader2 } from "lucide-react"
import { executeOrder } from "@/actions/orders"

interface ExecuteOrderButtonProps {
  orderId: number
  symbol: string
  side: "buy" | "sell"
  quantity: number
}

export function ExecuteOrderButton({ orderId, symbol, side, quantity }: ExecuteOrderButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleExecute() {
    setLoading(true)
    try {
      await executeOrder({ orderId, symbol, side, quantity })
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExecute}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
      Execute
    </button>
  )
}
