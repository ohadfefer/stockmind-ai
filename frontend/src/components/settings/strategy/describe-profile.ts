import type {
  EngagementCadence,
  ExperienceLevel,
  InvestorStyle,
  Motivation,
  UserProfileFields,
} from "@/services/user-profile-service"
import { INTEREST_OPTIONS } from "@/components/profile/profile-options"

/**
 * Turns the five answers into the "My Summary" paragraph. Templated rather
 * than model-written: it has to re-render the instant an answer is saved, and
 * a Grok call per edit would cost budget for a sentence the options already
 * imply.
 */

const EXPERIENCE: Record<ExperienceLevel, string> = {
  beginner: "You're just getting started with investing and prefer plain-language explanations",
  novice: "You know the basics of investing and appreciate a little guidance",
  experienced: "You're comfortable in the markets and want sharper, faster insights",
  expert: "You're an expert investor who wants more data and faster decisions",
}

const MOTIVATION: Record<Motivation, string> = {
  wealth_builder: "you want your money to grow steadily over time",
  income_seeker: "you want your investments to generate cash flow",
  growth_opportunist: "you like spotting new trends and taking calculated risks",
  conscious_investor: "you care where your money goes and the impact it has",
  stability_maximizer: "you value safety and want to protect what you've built",
}

const STYLE: Record<InvestorStyle, string> = {
  passive: "You take a passive, set-and-forget approach with few trades and a long horizon",
  hybrid: "Your hybrid approach is mostly long-term, with room for new ideas and the occasional trade",
  active: "You're an active investor who trades often and reacts to market shifts",
}

const CADENCE: Record<EngagementCadence, string> = {
  daily: "and you like to stay on top of what's happening every day",
  weekly: "and a weekly check-in keeps you informed without overdoing it",
  major_events: "and you'd rather only hear from me when something important happens",
}

const MAX_NAMED_INTERESTS = 3

function listInterests(interests: string[]): string {
  const labels = interests.map(
    (value) => INTEREST_OPTIONS.find((o) => o.value === value)?.label ?? value,
  )
  const named = labels.slice(0, MAX_NAMED_INTERESTS)
  const rest = labels.length - named.length
  if (rest > 0) return `${named.join(", ")} and ${rest} more`
  if (named.length <= 1) return named.join("")
  return `${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}`
}

export function describeProfile(profile: UserProfileFields): string {
  const sentences = [`${EXPERIENCE[profile.experienceLevel]}, and ${MOTIVATION[profile.motivation]}.`]
  if (profile.interests.length > 0) {
    sentences.push(`Right now you're most curious about ${listInterests(profile.interests)}.`)
  }
  sentences.push(`${STYLE[profile.investorStyle]}, ${CADENCE[profile.engagementCadence]}.`)
  return sentences.join(" ")
}
