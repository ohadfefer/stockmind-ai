"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Check, Plus, Loader2 } from "lucide-react"

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
      const method = following ? "DELETE" : "POST"
      const res = await fetch("/api/watchlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      })
      if (res.ok) {
        const data = await res.json()
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
