"use client"

import { ChoiceCard } from "./choice-card"
import { WizardHeader } from "./wizard-header"

interface Option<T extends string> {
  value: T
  title: string
  description: string
  stars?: number
  badge?: string
}

interface SingleChoiceStepProps<T extends string> {
  step: number
  totalSteps: number
  title: string
  subtitle: string
  options: Option<T>[]
  value: T | null
  onChange: (value: T) => void
  onBack: () => void
  onContinue: () => void
  ctaLabel?: string
}

export function SingleChoiceStep<T extends string>({
  step,
  totalSteps,
  title,
  subtitle,
  options,
  value,
  onChange,
  onBack,
  onContinue,
  ctaLabel = "Continue",
}: SingleChoiceStepProps<T>) {
  return (
    <div className="space-y-6">
      <WizardHeader step={step} totalSteps={totalSteps} onBack={onBack} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <ChoiceCard
            key={opt.value}
            title={opt.title}
            description={opt.description}
            stars={opt.stars}
            badge={opt.badge}
            selected={value === opt.value}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!value}
        className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
      >
        {ctaLabel}
      </button>
    </div>
  )
}
