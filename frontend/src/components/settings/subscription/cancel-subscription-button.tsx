"use client"

import { useState } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { longDateFormatter } from "./formatters"

interface CancelSubscriptionButtonProps {
  currentPeriodEnd: Date | null
  onConfirm: () => void | Promise<void>
  disabled?: boolean
}

export function CancelSubscriptionButton({
  currentPeriodEnd,
  onConfirm,
  disabled,
}: CancelSubscriptionButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const accessUntil = currentPeriodEnd ? longDateFormatter.format(currentPeriodEnd) : null

  // Keep the dialog open while onConfirm is pending so a slow API call has a
  // visible spinner and a thrown error has somewhere to surface. Closing
  // happens only on success — on failure we leave the dialog open and let
  // the parent's status banner render the error.
  async function handleConfirm() {
    try {
      setIsPending(true)
      await onConfirm()
      setOpen(false)
    } catch (err) {
      console.error("cancel subscription: confirm handler failed", err)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={disabled}>
          Cancel
        </Button>
      </DialogTrigger>
      {/* Dialog (vs AlertDialog) closes on outside click and on the
          built-in X button rendered by DialogContent. */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel your StockMind Pro subscription?</DialogTitle>
          <DialogDescription>
            {accessUntil
              ? `You will be able to use this subscription until ${accessUntil}. After that, your account will switch to the Free plan.`
              : "You will keep access until the end of your current billing period. After that, your account will switch to the Free plan."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Keep subscription
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Canceling…" : "Cancel subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
