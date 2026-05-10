export interface OnboardingSubmission {
  fullName: string
  experienceLevel: "beginner" | "novice" | "experienced" | "expert"
  motivation:
    | "wealth_builder"
    | "income_seeker"
    | "growth_opportunist"
    | "conscious_investor"
    | "stability_maximizer"
  interests: string[]
  investorStyle: "passive" | "hybrid" | "active"
  engagementCadence: "daily" | "weekly" | "major_events"
}

export async function submitOnboarding(data: OnboardingSubmission): Promise<void> {
  const res = await fetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to save onboarding")
}
