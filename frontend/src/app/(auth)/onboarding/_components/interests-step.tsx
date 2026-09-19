"use client"

import { InterestGrid } from "@/components/profile/interest-grid"
import { PROFILE_QUESTIONS } from "@/components/profile/profile-options"
import { WizardHeader } from "./wizard-header"

interface InterestsStepProps {
  step: number
  totalSteps: number
  selected: string[]
  onChange: (next: string[]) => void
  onBack: () => void
  onContinue: () => void
}

export function InterestsStep({
  step,
  totalSteps,
  selected,
  onChange,
  onBack,
  onContinue,
}: InterestsStepProps) {
  return (
    <div className="space-y-6">
      <WizardHeader step={step} totalSteps={totalSteps} onBack={onBack} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          {PROFILE_QUESTIONS.interests.title}
        </h1>
        <p className="text-sm text-muted-foreground">{PROFILE_QUESTIONS.interests.subtitle}</p>
      </div>

      <InterestGrid selected={selected} onChange={onChange} />

      <button
        type="button"
        onClick={onContinue}
        disabled={selected.length === 0}
        className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  )
}
