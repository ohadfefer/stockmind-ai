import type {
  ExperienceLevel,
  Motivation,
  Interest,
  InvestorStyle,
  EngagementCadence,
  UserProfileFields,
} from "@/services/user-profile-service"

/**
 * Display copy for the investing profile, shared by the onboarding wizard and
 * the strategy settings page. The values are typed against the service's
 * lists, so an option that the server would reject fails to compile here.
 */

export const PROFILE_QUESTIONS = {
  experienceLevel: {
    title: "How experienced are you with investing?",
    subtitle: "I'll match my voice to yours.",
  },
  motivation: {
    title: "What motivates you to invest?",
    subtitle:
      "This helps me tailor insights, alerts and recommendations to your goals and investing style.",
  },
  interests: {
    title: "What sparks your interest?",
    subtitle: "Choose the topics you're curious about — we'll learn from this in conversation.",
  },
  investorStyle: {
    title: "What kind of investor are you?",
    subtitle:
      "This helps me tailor insights, alerts and recommendations to match your investing style.",
  },
  engagementCadence: {
    title: "How often do you like to stay in touch with your investments?",
    subtitle:
      "Everyone has a different rhythm - from daily check-ins to only hearing from me when something important happens.",
  },
} as const

export const EXPERIENCE_OPTIONS: {
  value: ExperienceLevel
  title: string
  description: string
  stars: number
}[] = [
  { value: "beginner", title: "Beginner", description: "Plain-language explanations, please.", stars: 1 },
  { value: "novice", title: "Novice", description: "I understand the basics, but could use some help.", stars: 2 },
  { value: "experienced", title: "Experienced", description: "I'm comfortable with markets; give me sharper, faster insights.", stars: 3 },
  { value: "expert", title: "Expert", description: "I want to go deeper - more data, faster decisions.", stars: 4 },
]

export const MOTIVATION_OPTIONS: { value: Motivation; title: string; description: string }[] = [
  { value: "wealth_builder", title: "Wealth Builder", description: "I want my money to grow steadily over time." },
  { value: "income_seeker", title: "Income Seeker", description: "I want my investments to generate cash flow." },
  { value: "growth_opportunist", title: "Growth Opportunist", description: "I like spotting new trends and taking calculated risks." },
  { value: "conscious_investor", title: "Conscious Investor", description: "I care where my money goes and its impact on the world." },
  { value: "stability_maximizer", title: "Stability Maximizer", description: "I value safety and want to protect what I've built." },
]

export const INTEREST_OPTIONS: { value: Interest; label: string; image: string }[] = [
  { value: "ai_tech", label: "AI & Technology", image: "/onboarding/interests/ai_tech.jpg" },
  { value: "emerging_markets", label: "Emerging Markets", image: "/onboarding/interests/emerging_markets.jpg" },
  { value: "clean_energy", label: "Clean Energy", image: "/onboarding/interests/clean_energy.jpg" },
  { value: "consumer_retail", label: "Consumer & Retail", image: "/onboarding/interests/consumer_retail.jpg" },
  { value: "real_estate", label: "Real Estate", image: "/onboarding/interests/real_estate.jpg" },
  { value: "financial_services", label: "Financial Services", image: "/onboarding/interests/financial_services.jpg" },
  { value: "biotech", label: "Biotech", image: "/onboarding/interests/biotech.jpg" },
  { value: "crypto", label: "Crypto", image: "/onboarding/interests/crypto.jpg" },
  { value: "commodities", label: "Commodities", image: "/onboarding/interests/commodities.jpg" },
  { value: "defense_aerospace", label: "Defense & Aerospace", image: "/onboarding/interests/defense_aerospace.jpg" },
  { value: "infrastructure", label: "Infrastructure", image: "/onboarding/interests/infrastructure.jpg" },
  { value: "bonds_fixed_income", label: "Bonds & Fixed Income", image: "/onboarding/interests/bonds_fixed_income.jpg" },
  { value: "high_yield", label: "High-Yield", image: "/onboarding/interests/high_yield.jpg" },
  { value: "dividends", label: "Dividends", image: "/onboarding/interests/dividends.jpg" },
]

export const STYLE_OPTIONS: { value: InvestorStyle; title: string; description: string }[] = [
  { value: "passive", title: "Passive", description: "Set and forget. Long-term, few trades, usually following the market." },
  { value: "hybrid", title: "Hybrid", description: "Mostly long-term, but I like to explore new ideas and occasionally trade." },
  { value: "active", title: "Active", description: "I trade frequently and react to market shifts. I'm a watchdog." },
]

export const CADENCE_OPTIONS: {
  value: EngagementCadence
  title: string
  description: string
  badge?: string
}[] = [
  { value: "daily", title: "Daily", description: "I like to stay on top of what's happening every day." },
  { value: "weekly", title: "Weekly", description: "A weekly check-in helps me stay informed without overdoing it.", badge: "Recommended" },
  { value: "major_events", title: "Only with major events", description: "I want to only know when something important happens." },
]

export type SingleChoiceField = Exclude<keyof UserProfileFields, "interests">

export interface ChoiceOption {
  value: string
  title: string
  description: string
  stars?: number
  badge?: string
}

/** The pick-one questions keyed by the profile field they answer. */
export const CHOICE_OPTIONS: Record<SingleChoiceField, ChoiceOption[]> = {
  experienceLevel: EXPERIENCE_OPTIONS,
  motivation: MOTIVATION_OPTIONS,
  investorStyle: STYLE_OPTIONS,
  engagementCadence: CADENCE_OPTIONS,
}
