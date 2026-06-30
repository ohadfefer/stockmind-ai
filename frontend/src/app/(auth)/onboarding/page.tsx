"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { submitOnboarding } from "@/actions/onboarding"
import type {
  ExperienceLevel,
  Motivation,
  InvestorStyle,
  EngagementCadence,
} from "@/services/user-profile-service"
import { WelcomeStep } from "./_components/welcome-step"
import { NameStep } from "./_components/name-step"
import { SingleChoiceStep } from "./_components/single-choice-step"
import { InterestsStep } from "./_components/interests-step"
import { SummaryStep } from "./_components/summary-step"
import {
  EXPERIENCE_OPTIONS,
  MOTIVATION_OPTIONS,
  STYLE_OPTIONS,
  CADENCE_OPTIONS,
} from "./_components/wizard-options"

type Step =
  | "welcome"
  | "name"
  | "experience"
  | "motivation"
  | "interests"
  | "style"
  | "cadence"
  | "summary"

const TOTAL_QUESTION_STEPS = 5

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("welcome")
  const [fullName, setFullName] = useState("")
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null)
  const [motivation, setMotivation] = useState<Motivation | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [investorStyle, setInvestorStyle] = useState<InvestorStyle | null>(null)
  const [engagementCadence, setEngagementCadence] = useState<EngagementCadence | null>(null)
  const [nameError, setNameError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleNameContinue() {
    if (!fullName.trim()) {
      setNameError("Please enter your full name")
      return
    }
    setNameError("")
    setStep("experience")
  }

  async function handleSubmit() {
    if (
      !experienceLevel ||
      !motivation ||
      !investorStyle ||
      !engagementCadence ||
      !fullName.trim()
    ) {
      setSubmitError("Please complete all steps before submitting.")
      return
    }
    setLoading(true)
    setSubmitError("")
    try {
      await submitOnboarding({
        fullName: fullName.trim(),
        experienceLevel,
        motivation,
        interests,
        investorStyle,
        engagementCadence,
      })
      router.push("/dashboard")
    } catch {
      setSubmitError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl px-4 py-8">
      {step === "welcome" && <WelcomeStep onContinue={() => setStep("name")} />}

      {step === "name" && (
        <NameStep
          fullName={fullName}
          onChange={setFullName}
          onBack={() => setStep("welcome")}
          onContinue={handleNameContinue}
          error={nameError}
        />
      )}

      {step === "experience" && (
        <SingleChoiceStep
          step={1}
          totalSteps={TOTAL_QUESTION_STEPS}
          title="How experienced are you with investing?"
          subtitle="I'll match my voice to yours."
          options={EXPERIENCE_OPTIONS}
          value={experienceLevel}
          onChange={setExperienceLevel}
          onBack={() => setStep("name")}
          onContinue={() => setStep("motivation")}
        />
      )}

      {step === "motivation" && (
        <SingleChoiceStep
          step={2}
          totalSteps={TOTAL_QUESTION_STEPS}
          title="What motivates you to invest?"
          subtitle="This helps me tailor insights, alerts and recommendations to your goals and investing style."
          options={MOTIVATION_OPTIONS}
          value={motivation}
          onChange={setMotivation}
          onBack={() => setStep("experience")}
          onContinue={() => setStep("interests")}
        />
      )}

      {step === "interests" && (
        <InterestsStep
          step={3}
          totalSteps={TOTAL_QUESTION_STEPS}
          selected={interests}
          onChange={setInterests}
          onBack={() => setStep("motivation")}
          onContinue={() => setStep("style")}
        />
      )}

      {step === "style" && (
        <SingleChoiceStep
          step={4}
          totalSteps={TOTAL_QUESTION_STEPS}
          title="What kind of investor are you?"
          subtitle="This helps me tailor insights, alerts and recommendations to match your investing style."
          options={STYLE_OPTIONS}
          value={investorStyle}
          onChange={setInvestorStyle}
          onBack={() => setStep("interests")}
          onContinue={() => setStep("cadence")}
        />
      )}

      {step === "cadence" && (
        <SingleChoiceStep
          step={5}
          totalSteps={TOTAL_QUESTION_STEPS}
          title="How often do you like to stay in touch with your investments?"
          subtitle="Everyone has a different rhythm - from daily check-ins to only hearing from me when something important happens."
          options={CADENCE_OPTIONS}
          value={engagementCadence}
          onChange={setEngagementCadence}
          onBack={() => setStep("style")}
          onContinue={() => setStep("summary")}
          ctaLabel="Submit & Create Profile"
        />
      )}

      {step === "summary" && experienceLevel && motivation && investorStyle && (
        <SummaryStep
          fullName={fullName}
          experienceLevel={experienceLevel}
          motivation={motivation}
          interests={interests}
          investorStyle={investorStyle}
          onBack={() => setStep("cadence")}
          onConfirm={handleSubmit}
          onEdit={() => setStep("experience")}
          loading={loading}
          error={submitError}
        />
      )}
    </div>
  )
}
