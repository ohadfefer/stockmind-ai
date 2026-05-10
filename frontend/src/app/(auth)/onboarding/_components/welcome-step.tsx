"use client"

interface WelcomeStepProps {
  onContinue: () => void
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to <span className="text-primary">StockMind AI</span> – your AI Platform for investing.
        </h1>
        <p className="text-sm text-muted-foreground">
          To get started, I&apos;ll ask a few quick questions that help personalize around your investing
          experience and interests. <span className="font-semibold text-foreground">2 minutes or less.</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Get Started
      </button>
    </div>
  )
}
