"use client"

import { Sparkles } from "lucide-react"
import { WizardHeader } from "./wizard-header"
import {
  EXPERIENCE_OPTIONS,
  MOTIVATION_OPTIONS,
  STYLE_OPTIONS,
  INTEREST_OPTIONS,
} from "./wizard-options"
import type {
  ExperienceLevel,
  Motivation,
  InvestorStyle,
} from "@/services/user-profile-service"

interface SummaryStepProps {
  fullName: string
  experienceLevel: ExperienceLevel
  motivation: Motivation
  interests: string[]
  investorStyle: InvestorStyle
  onBack: () => void
  onConfirm: () => void
  onEdit: () => void
  loading: boolean
  error?: string
}

function findLabel<T extends string>(
  list: { value: T; title?: string; label?: string }[],
  value: T,
) {
  const match = list.find((o) => o.value === value)
  return match?.title ?? match?.label ?? value
}

export function SummaryStep({
  fullName,
  experienceLevel,
  motivation,
  interests,
  investorStyle,
  onBack,
  onConfirm,
  onEdit,
  loading,
  error,
}: SummaryStepProps) {
  const experienceLabel = findLabel(EXPERIENCE_OPTIONS, experienceLevel)
  const motivationLabel = findLabel(MOTIVATION_OPTIONS, motivation)
  const styleLabel = findLabel(STYLE_OPTIONS, investorStyle)
  const interestLabels = interests
    .map((i) => INTEREST_OPTIONS.find((o) => o.value === i)?.label ?? i)
    .slice(0, 3)
    .join(", ")

  const firstName = fullName.trim().split(/\s+/)[0]

  return (
    <div className="space-y-6">
      <WizardHeader onBack={onBack} rightLabel="Summary" />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Thanks, {firstName}!</h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s a quick summary of what I&apos;ve learned about you so far:
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card">
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" />
            About You
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            I can see you&apos;re{" "}
            <span className="font-semibold text-primary">{experienceLabel}</span> and focused on{" "}
            <span className="font-semibold text-primary">{motivationLabel}</span>. You prefer a{" "}
            <span className="font-semibold text-primary">{styleLabel}</span> approach to investing
            {interestLabels && (
              <>
                , with interests in{" "}
                <span className="font-semibold text-primary">{interestLabels}</span>
              </>
            )}
            .
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Going forward, I&apos;ll personalize to you using these preferences and other items I learn
        along the way. Don&apos;t worry, you can always adjust later!
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Yes, that looks good!"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={loading}
          className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          I&apos;d like to make some changes
        </button>
      </div>
    </div>
  )
}
