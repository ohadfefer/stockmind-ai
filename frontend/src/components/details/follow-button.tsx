"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Check, Plus, Loader2 } from "lucide-react"
import { addStock, deleteStock } from "@/actions/watchlist"

export function FollowButton({
  symbol,
  initialFollowing,
}: {
  symbol: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      if (following) {
        await deleteStock(symbol)
        setFollowing(false)
      } else {
        const data = await addStock(symbol)
        setFollowing(data.following)
      }
    })
  }

  return (
    <Button
      variant={following ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : following ? (
        <Check className="size-4" />
      ) : (
        <Plus className="size-4" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  )
}
