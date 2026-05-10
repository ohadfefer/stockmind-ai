"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { INTEREST_OPTIONS } from "./wizard-options"
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
  function toggle(value: string) {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    )
  }

  return (
    <div className="space-y-6">
      <WizardHeader step={step} totalSteps={totalSteps} onBack={onBack} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">What sparks your interest?</h1>
        <p className="text-sm text-muted-foreground">
          Choose the topics you&apos;re curious about — we&apos;ll learn from this in conversation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {INTEREST_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "relative aspect-[4/3] rounded-xl border p-3 text-left transition-all",
                "flex flex-col justify-end",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              {isSelected && (
                <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
              <span className="text-sm font-semibold text-foreground">{opt.label}</span>
            </button>
          )
        })}
      </div>

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
