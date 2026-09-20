"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateFullName } from "@/actions/user"
import { ApiError } from "@/actions/http"
import type { UserDetails } from "@/services/user-service"

// Mirrors the server rule in parseFullName, so the button disables before a
// round-trip that would only come back 400.
const MAX_NAME_LENGTH = 50

// Field labels track the strategy section's question titles, one step above
// the input text, so the two panes read at the same scale.
const LABEL_CLASS = "text-sm md:text-base"

function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      *
    </span>
  )
}

/**
 * A field the user can look at but not change — phone and date of birth have
 * no column behind them yet, and email belongs to Auth0. Rendered as a real
 * disabled input rather than plain text so the row keeps the grid's rhythm.
 */
function ReadOnlyField({
  id,
  label,
  value,
}: {
  id: string
  label: string
  value?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={`${LABEL_CLASS} text-muted-foreground`}>
        {label}
      </Label>
      <Input id={id} value={value ?? ""} placeholder="Not provided" disabled readOnly />
    </div>
  )
}

export function DetailsForm({ initialDetails }: { initialDetails: UserDetails }) {
  const router = useRouter()
  // The PATCH returns the whole updated row, so a save replaces this outright
  // and the baseline the dirty check compares against moves with it.
  const [details, setDetails] = useState(initialDetails)
  const [draftName, setDraftName] = useState(initialDetails.fullName)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const trimmed = draftName.trim()
  const canSave =
    !isPending &&
    trimmed.length > 0 &&
    trimmed.length <= MAX_NAME_LENGTH &&
    trimmed !== details.fullName

  function handleNameChange(value: string) {
    setDraftName(value)
    setSaved(false)
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSave) return

    setIsPending(true)
    setError(null)
    try {
      const updated = await updateFullName(trimmed)
      setDetails(updated)
      setDraftName(updated.fullName)
      setSaved(true)
      // The sidebar and header greet the user by name from the server layout,
      // so they keep the old one until the tree re-renders.
      router.refresh()
    } catch (err) {
      // problem+json detail is written to be shown; anything else is either a
      // network failure or a shape we don't recognise, so it gets generic copy.
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't save your changes. Please try again.",
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold text-foreground md:text-lg">Details</h2>
        {saved && !isPending && (
          <p role="status" className="text-[10px] text-muted-foreground md:text-xs">
            Saved
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="full-name" className={LABEL_CLASS}>
            Full Name <RequiredMark />
          </Label>
          <Input
            id="full-name"
            name="fullName"
            value={draftName}
            onChange={(e) => handleNameChange(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            required
            aria-describedby={error ? "full-name-error" : undefined}
            aria-invalid={error ? true : undefined}
            disabled={isPending}
          />
        </div>

        <ReadOnlyField id="email" label="Personal email" value={details.email} />
        <ReadOnlyField id="phone" label="Phone" />
        <ReadOnlyField id="date-of-birth" label="Date of Birth" />
      </div>

      {error && (
        <p id="full-name-error" role="alert" className="text-xs text-destructive md:text-sm">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSave}>
          {isPending && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  )
}
