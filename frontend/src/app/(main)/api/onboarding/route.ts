import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { insertUser } from "@/services/user-service"
import { createDefaultAccount, getDefaultAccountId } from "@/services/account/account-service"
import { logAudit } from "@/services/audit-log-service"
import {
  upsertUserProfile,
  markUserOnboarded,
  type ExperienceLevel,
  type Motivation,
  type InvestorStyle,
  type EngagementCadence,
} from "@/services/user-profile-service"
import { getClientIp } from "@/lib/request-ip"

const EXPERIENCE_OPTIONS: ExperienceLevel[] = ["beginner", "novice", "experienced", "expert"]
const MOTIVATION_OPTIONS: Motivation[] = [
  "wealth_builder",
  "income_seeker",
  "growth_opportunist",
  "conscious_investor",
  "stability_maximizer",
]
const STYLE_OPTIONS: InvestorStyle[] = ["passive", "hybrid", "active"]
const CADENCE_OPTIONS: EngagementCadence[] = ["daily", "weekly", "major_events"]

const ALLOWED_INTERESTS = new Set([
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
])

interface OnboardingPayload {
  fullName: string
  experienceLevel: ExperienceLevel
  motivation: Motivation
  interests: string[]
  investorStyle: InvestorStyle
  engagementCadence: EngagementCadence
}

function validate(body: unknown): OnboardingPayload | string {
  if (!body || typeof body !== "object") return "Invalid request body"
  const b = body as Record<string, unknown>

  if (typeof b.fullName !== "string" || !b.fullName.trim()) return "Full name is required"
  const fullName = b.fullName.trim()
  if (fullName.length > 50) return "Full name must be 50 characters or fewer"

  if (typeof b.experienceLevel !== "string" || !EXPERIENCE_OPTIONS.includes(b.experienceLevel as ExperienceLevel))
    return "Invalid experience level"
  if (typeof b.motivation !== "string" || !MOTIVATION_OPTIONS.includes(b.motivation as Motivation))
    return "Invalid motivation"
  if (typeof b.investorStyle !== "string" || !STYLE_OPTIONS.includes(b.investorStyle as InvestorStyle))
    return "Invalid investor style"
  if (typeof b.engagementCadence !== "string" || !CADENCE_OPTIONS.includes(b.engagementCadence as EngagementCadence))
    return "Invalid engagement cadence"

  if (!Array.isArray(b.interests)) return "Interests must be an array"
  const interests = b.interests.filter(
    (v): v is string => typeof v === "string" && ALLOWED_INTERESTS.has(v),
  )

  return {
    fullName,
    experienceLevel: b.experienceLevel as ExperienceLevel,
    motivation: b.motivation as Motivation,
    interests,
    investorStyle: b.investorStyle as InvestorStyle,
    engagementCadence: b.engagementCadence as EngagementCadence,
  }
}

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { sub: auth0Id, email, picture } = session.user
  if (!email) {
    return NextResponse.json({ error: "Session missing email" }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = validate(body)
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 })
  }

  try {
    const { userId, wasCreated } = await insertUser({
      auth0Id,
      email,
      fullName: parsed.fullName,
      imageUrl: picture ?? null,
    })

    let accountId: number | null = null
    if (wasCreated) {
      try {
        accountId = await createDefaultAccount(userId)
      } catch (err) {
        console.error("Failed to create default account for user", userId, err)
      }
    } else {
      accountId = await getDefaultAccountId(userId)
    }

    await upsertUserProfile({
      userId,
      experienceLevel: parsed.experienceLevel,
      motivation: parsed.motivation,
      interests: parsed.interests,
      investorStyle: parsed.investorStyle,
      engagementCadence: parsed.engagementCadence,
    })

    await markUserOnboarded(userId)

    if (wasCreated) {
      await logAudit({
        userId,
        accountId,
        action: "signup",
        details: { fullName: parsed.fullName },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json({ status: "saved" })
  } catch (error) {
    console.error("Failed to save onboarding:", error)
    return NextResponse.json({ error: "Failed to save onboarding" }, { status: 500 })
  }
}
