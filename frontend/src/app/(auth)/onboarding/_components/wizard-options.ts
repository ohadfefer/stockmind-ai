import type {
  ExperienceLevel,
  Motivation,
  InvestorStyle,
  EngagementCadence,
} from "@/services/user-profile-service"

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

export const INTEREST_OPTIONS: { value: string; label: string }[] = [
  { value: "ai_tech", label: "AI & Technology" },
  { value: "emerging_markets", label: "Emerging Markets" },
  { value: "clean_energy", label: "Clean Energy" },
  { value: "consumer_retail", label: "Consumer & Retail" },
  { value: "real_estate", label: "Real Estate" },
  { value: "financial_services", label: "Financial Services" },
  { value: "biotech", label: "Biotech" },
  { value: "crypto", label: "Crypto" },
  { value: "commodities", label: "Commodities" },
  { value: "defense_aerospace", label: "Defense & Aerospace" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "bonds_fixed_income", label: "Bonds & Fixed Income" },
  { value: "high_yield", label: "High-Yield" },
  { value: "dividends", label: "Dividends" },
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
