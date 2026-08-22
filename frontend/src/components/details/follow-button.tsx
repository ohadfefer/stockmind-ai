"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { addWatchlistItem, DEFAULT_WATCHLIST } from "@/actions/watchlist"
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
        try {
          // PUT on the member URL answers 201 or 204 with no body, so the new
          // state is what we asked for rather than something the server echoes.
          await addWatchlistItem(DEFAULT_WATCHLIST, symbol)
          setFollowing(true)
        } catch {
          // Contain the rejection so it can't escape the transition as an
          // uncaught error. `following` stays false, so the button keeps
          // offering Follow rather than claiming a write that never landed.
          // The failure is still not surfaced to the user — see TODO below.
          // TODO: surface this (toast) once we agree on the failure copy.
        }
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
      className="h-7 gap-1 text-xs"
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
