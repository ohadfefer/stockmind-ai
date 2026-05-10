"use client"

import { ChevronLeft } from "lucide-react"

interface WizardHeaderProps {
  step?: number
  totalSteps?: number
  onBack?: () => void
  rightLabel?: string
}

export function WizardHeader({ step, totalSteps, onBack, rightLabel }: WizardHeaderProps) {
  const showSteps = typeof step === "number" && typeof totalSteps === "number"
  return (
    <div className="flex items-center justify-between text-sm">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
      ) : (
        <span />
      )}

      {showSteps ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>
            Step {step} of {totalSteps}
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full ${
                  i < step ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      ) : rightLabel ? (
        <span className="text-muted-foreground">{rightLabel}</span>
      ) : (
        <span />
      )}
    </div>
  )
}
