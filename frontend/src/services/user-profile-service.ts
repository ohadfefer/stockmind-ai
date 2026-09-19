import { getDb } from "@/lib/db"

/**
 * The value lists mirror the CHECK constraints in migration 022. Both routes
 * that write a profile validate against these rather than their own copies,
 * so a new option is added here and in profile-options.ts (labels) and
 * nowhere else.
 */
export const EXPERIENCE_LEVELS = ["beginner", "novice", "experienced", "expert"] as const
export const MOTIVATIONS = [
  "wealth_builder",
  "income_seeker",
  "growth_opportunist",
  "conscious_investor",
  "stability_maximizer",
] as const
export const INVESTOR_STYLES = ["passive", "hybrid", "active"] as const
export const ENGAGEMENT_CADENCES = ["daily", "weekly", "major_events"] as const
export const INTERESTS = [
  "ai_tech",
  "emerging_markets",
  "clean_energy",
  "consumer_retail",
  "real_estate",
  "financial_services",
  "biotech",
  "crypto",
  "commodities",
  "defense_aerospace",
  "infrastructure",
  "bonds_fixed_income",
  "high_yield",
  "dividends",
] as const

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]
export type Motivation = (typeof MOTIVATIONS)[number]
export type InvestorStyle = (typeof INVESTOR_STYLES)[number]
export type EngagementCadence = (typeof ENGAGEMENT_CADENCES)[number]
export type Interest = (typeof INTERESTS)[number]

/** The five answers the onboarding wizard collects. */
export interface UserProfileFields {
  experienceLevel: ExperienceLevel
  motivation: Motivation
  interests: string[]
  investorStyle: InvestorStyle
  engagementCadence: EngagementCadence
}

/** Any subset of the answers — what a single settings edit sends. */
export type UserProfilePatch = Partial<UserProfileFields>

export interface UserProfileInput extends UserProfileFields {
  userId: number
}

export interface UserProfile extends UserProfileFields {
  /** ISO timestamp of the last write, for the "Last updated" line. */
  updatedAt: string
}

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value)
}

/**
 * Validates whichever profile fields a request body carries and returns just
 * those, or a message naming the first invalid one. Absent fields stay absent
 * rather than being defaulted: onboarding then insists on all five via
 * isCompleteProfile, the settings PATCH on at least one, and neither re-types
 * the value lists.
 *
 * Interests are filtered rather than rejected — an unknown value is dropped
 * silently, as onboarding has always done.
 */
export function parseProfileFields(body: unknown): UserProfilePatch | string {
  if (!body || typeof body !== "object") return "Invalid request body"
  const b = body as Record<string, unknown>
  const patch: UserProfilePatch = {}

  if (b.experienceLevel !== undefined) {
    if (!isOneOf(EXPERIENCE_LEVELS, b.experienceLevel)) return "Invalid experience level"
    patch.experienceLevel = b.experienceLevel
  }
  if (b.motivation !== undefined) {
    if (!isOneOf(MOTIVATIONS, b.motivation)) return "Invalid motivation"
    patch.motivation = b.motivation
  }
  if (b.investorStyle !== undefined) {
    if (!isOneOf(INVESTOR_STYLES, b.investorStyle)) return "Invalid investor style"
    patch.investorStyle = b.investorStyle
  }
  if (b.engagementCadence !== undefined) {
    if (!isOneOf(ENGAGEMENT_CADENCES, b.engagementCadence)) return "Invalid engagement cadence"
    patch.engagementCadence = b.engagementCadence
  }
  if (b.interests !== undefined) {
    if (!Array.isArray(b.interests)) return "Interests must be an array"
    patch.interests = b.interests.filter((v): v is Interest => isOneOf(INTERESTS, v))
  }

  return patch
}

export function isCompleteProfile(patch: UserProfilePatch): patch is UserProfileFields {
  return (
    patch.experienceLevel !== undefined &&
    patch.motivation !== undefined &&
    patch.interests !== undefined &&
    patch.investorStyle !== undefined &&
    patch.engagementCadence !== undefined
  )
}

function toProfile(row: Record<string, unknown>): UserProfile {
  return {
    experienceLevel: row.experience_level as ExperienceLevel,
    motivation: row.motivation as Motivation,
    interests: row.interests as string[],
    investorStyle: row.investor_style as InvestorStyle,
    engagementCadence: row.engagement_cadence as EngagementCadence,
    updatedAt: (row.updated_at as Date).toISOString(),
  }
}

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT experience_level, motivation, interests, investor_style, engagement_cadence, updated_at
    FROM user_profiles
    WHERE user_id = ${userId}
  `
  return rows[0] ? toProfile(rows[0]) : null
}

export async function upsertUserProfile(input: UserProfileInput): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO user_profiles (
      user_id, experience_level, motivation, interests, investor_style, engagement_cadence
    )
    VALUES (
      ${input.userId},
      ${input.experienceLevel},
      ${input.motivation},
      ${input.interests},
      ${input.investorStyle},
      ${input.engagementCadence}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      experience_level = EXCLUDED.experience_level,
      motivation = EXCLUDED.motivation,
      interests = EXCLUDED.interests,
      investor_style = EXCLUDED.investor_style,
      engagement_cadence = EXCLUDED.engagement_cadence,
      updated_at = NOW()
  `
}

/**
 * Applies the fields the patch carries and leaves the rest as they are.
 * COALESCE does the "leave as is": the tagged template can't build a dynamic
 * SET list, so every column is always in it, and an absent field arrives as
 * NULL, which COALESCE skips in favour of the current value. Resolves null
 * when the user has no profile row to update.
 */
export async function updateUserProfile(
  userId: number,
  patch: UserProfilePatch,
): Promise<UserProfile | null> {
  const sql = getDb()
  const rows = await sql`
    UPDATE user_profiles SET
      experience_level = COALESCE(${patch.experienceLevel ?? null}, experience_level),
      motivation = COALESCE(${patch.motivation ?? null}, motivation),
      interests = COALESCE(${patch.interests ?? null}::text[], interests),
      investor_style = COALESCE(${patch.investorStyle ?? null}, investor_style),
      engagement_cadence = COALESCE(${patch.engagementCadence ?? null}, engagement_cadence),
      updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING experience_level, motivation, interests, investor_style, engagement_cadence, updated_at
  `
  return rows[0] ? toProfile(rows[0]) : null
}

export async function markUserOnboarded(userId: number): Promise<void> {
  const sql = getDb()
  await sql`UPDATE users SET onboarded_at = NOW() WHERE id = ${userId}`
}
