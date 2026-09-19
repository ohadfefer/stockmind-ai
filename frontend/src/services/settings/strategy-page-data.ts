import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { findUserIdByAuth0Id } from "@/services/user-service"
import { getUserProfile, type UserProfile } from "@/services/user-profile-service"

export interface StrategyPageData {
  profilePromise: Promise<UserProfile>
}

// Logs with context then rethrows so the promise still rejects and the
// section error boundary renders a retryable state.
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

async function loadProfile(auth0Id: string): Promise<UserProfile> {
  const userId = await findUserIdByAuth0Id(auth0Id)
  const profile = userId === null ? null : await getUserProfile(userId)
  // Rejects rather than resolving null: the (main) layout already sends
  // anyone without a finished onboarding back to /onboarding, so by the time
  // this runs a missing row is a data problem for the error boundary to show,
  // not an empty state to design a page around.
  if (!profile) throw new Error(`no user_profiles row for user ${userId}`)
  return profile
}

/**
 * Resolves the strategy page's only blocking concern — the auth redirect —
 * then hands back the profile as a streamable promise so the settings shell
 * paints before Neon answers. Same shape as loadPaymentsPageData.
 */
export async function loadStrategyPageData(): Promise<StrategyPageData> {
  const session = await auth0.getSession()
  if (!session) redirect("/auth/login")

  const profilePromise = loadProfile(session.user.sub).catch(
    logAndRethrow("strategy profile failed"),
  )

  return { profilePromise }
}
