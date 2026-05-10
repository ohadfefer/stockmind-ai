import { getDb } from "@/lib/db"

export type ExperienceLevel = "beginner" | "novice" | "experienced" | "expert"
export type Motivation =
  | "wealth_builder"
  | "income_seeker"
  | "growth_opportunist"
  | "conscious_investor"
  | "stability_maximizer"
export type InvestorStyle = "passive" | "hybrid" | "active"
export type EngagementCadence = "daily" | "weekly" | "major_events"

export interface UserProfileInput {
  userId: number
  experienceLevel: ExperienceLevel
  motivation: Motivation
  interests: string[]
  investorStyle: InvestorStyle
  engagementCadence: EngagementCadence
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

export async function markUserOnboarded(userId: number): Promise<void> {
  const sql = getDb()
  await sql`UPDATE users SET onboarded_at = NOW() WHERE id = ${userId}`
}
