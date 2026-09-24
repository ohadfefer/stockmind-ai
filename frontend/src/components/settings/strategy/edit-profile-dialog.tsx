"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { ChoiceCard } from "@/components/profile/choice-card"
import { InterestGrid } from "@/components/profile/interest-grid"
import { CHOICE_OPTIONS, PROFILE_QUESTIONS } from "@/components/profile/profile-options"
import { updateProfile } from "@/actions/profile"
import { ApiError } from "@/actions/http"
import type { UserProfile, UserProfileFields, UserProfilePatch } from "@/services/user-profile-service"

export type ProfileField = keyof UserProfileFields

// Wider than UserProfileFields[ProfileField] because the option cards hand
// back plain strings; the server re-validates against the real lists.
type Draft = string | string[]

interface EditProfileDialogProps {
  field: ProfileField
  profile: UserProfile
  onSaved: (profile: UserProfile) => void
}

function isSameAnswer(a: Draft, b: Draft): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v) => b.includes(v))
  }
  return a === b
}

/**
 * One question's edit dialog, trigger included — the pencil button on the
 * row. Each row owns its own instance, so the draft is seeded from the live
 * profile every time it opens rather than shared across questions.
 */
export function EditProfileDialog({ field, profile, onSaved }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(profile[field])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const question = PROFILE_QUESTIONS[field]

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Seeded on open, not on close: a save that succeeded has already moved
      // the profile on, and a cancelled edit must not survive to the next one.
      setDraft(profile[field])
      setError(null)
    }
  }

  // The interests grid can be emptied, and onboarding never allows that
  // through either — keep the two in step.
  const canSave =
    !isPending &&
    !isSameAnswer(draft, profile[field]) &&
    !(Array.isArray(draft) && draft.length === 0)

  async function handleSave() {
    setIsPending(true)
    setError(null)
    try {
      const updated = await updateProfile({ [field]: draft } as UserProfilePatch)
      onSaved(updated)
      setOpen(false)
      // onSaved already updated this page. The refresh expires its saved
      // snapshot (staleTimes), which would bring the old answer back on a
      // return visit.
      router.refresh()
    } catch (err) {
      // problem+json detail is written to be shown; anything else is either a
      // network failure or a shape we don't recognise, so it gets generic copy.
      setError(
        err instanceof ApiError ? err.message : "Couldn't save your changes. Please try again.",
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          // 32px on mobile to sit right with the smaller row type, but the
          // ::after keeps the tap target at 44px — WCAG 2.5.8 passes at 32,
          // thumbs don't. Rows are py-5 apart, so the bleed can't overlap a
          // neighbouring target.
          className="relative size-8 shrink-0 rounded-full after:absolute after:-inset-1.5 after:content-[''] md:size-9 md:after:inset-0"
          aria-label={`Edit: ${question.title}`}
        >
          <Pencil className="size-3.5 md:size-4" />
        </Button>
      </DialogTrigger>
      {/* flex-col + max-h so a long option list (the 14 interest tiles)
          scrolls inside the dialog while the header and footer stay put. */}
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{question.title}</DialogTitle>
          <DialogDescription>{question.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {field === "interests" ? (
            <InterestGrid selected={draft as string[]} onChange={setDraft} />
          ) : (
            <div className="space-y-3">
              {CHOICE_OPTIONS[field].map((opt) => (
                <ChoiceCard
                  key={opt.value}
                  title={opt.title}
                  description={opt.description}
                  stars={opt.stars}
                  badge={opt.badge}
                  selected={draft === opt.value}
                  onSelect={() => setDraft(opt.value)}
                />
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="border-t border-border pt-4 sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!canSave}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
