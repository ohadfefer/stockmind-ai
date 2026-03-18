"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { addStock } from "@/actions/watchlist"
import { WatchlistPicker } from "@/components/details/watchlist-picker"

export function FollowButton({
  symbol,
  initialFollowing,
}: {
  symbol: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [showPicker, setShowPicker] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (following) {
      setShowPicker(true)
    } else {
      startTransition(async () => {
        const data = await addStock(symbol)
        setFollowing(data.following)
      })
    }
  }

  if (showPicker) {
    return (
      <WatchlistPicker
        symbol={symbol}
        onFollowingChange={(still) => {
          setFollowing(still)
          setShowPicker(false)
        }}
      />
    )
  }

  return (
    <Button
      variant={following ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : following ? (
        <ChevronsUpDown className="size-4" />
      ) : (
        <Plus className="size-4" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  )
}
