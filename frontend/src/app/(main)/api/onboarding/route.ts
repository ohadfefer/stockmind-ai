import { withAuth } from "@/lib/http/with-auth"
import { invalid, noContent } from "@/lib/http/problem"
import { readJsonBody } from "@/lib/http/read-json-body"
import { insertUser, parseFullName } from "@/services/user-service"
import { createDefaultAccount, getDefaultAccountId } from "@/services/account/account-service"
import { logAudit } from "@/services/audit-log-service"
import {
  upsertUserProfile,
  markUserOnboarded,
  parseProfileFields,
  isCompleteProfile,
  type UserProfileFields,
} from "@/services/user-profile-service"
import { getClientIp } from "@/lib/request-ip"

interface OnboardingPayload extends UserProfileFields {
  fullName: string
}

function validate(body: unknown): OnboardingPayload | string {
  if (!body || typeof body !== "object") return "Invalid request body"
  const b = body as Record<string, unknown>

  const name = parseFullName(b.fullName)
  if ("error" in name) return name.error

  const profile = parseProfileFields(b)
  if (typeof profile === "string") return profile
  if (!isCompleteProfile(profile)) return "Every profile question must be answered"

  return { fullName: name.fullName, ...profile }
}

/**
 * withAuth, deliberately — this is the route that *creates* the users row, so
 * withUser would 403 onboarding_required and make onboarding unreachable. It
 * is the one endpoint in the app where "no user row yet" is the normal state.
 *
 * Errors thrown below reach guard, which logs them and returns problem+json
 * 500; the hand-rolled try/catch that used to do that is gone.
 */
export const POST = withAuth(async (request, { session }) => {
  const { sub: auth0Id, email, picture } = session.user
  if (!email) return invalid("Session is missing an email address")

  const parsed = validate(await readJsonBody(request))
  if (typeof parsed === "string") return invalid(parsed)

  const { userId, wasCreated } = await insertUser({
    auth0Id,
    email,
    fullName: parsed.fullName,
    imageUrl: picture ?? null,
  })

  let accountId: number | null = null
  if (wasCreated) {
    // Swallowed on purpose: a missing account is recoverable — every read path
    // provisions one lazily — and failing onboarding over it would strand the
    // user on a form they have already filled in correctly.
    try {
      accountId = await createDefaultAccount(userId)
    } catch (err) {
      console.error("[onboarding] Failed to create default account for user", userId, err)
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

  // The only caller redirects on success and reads nothing back.
  return noContent()
})
