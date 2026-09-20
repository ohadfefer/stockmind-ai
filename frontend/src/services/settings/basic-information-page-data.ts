import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { getUserDetailsByAuth0Id, type UserDetails } from "@/services/user-service"

export interface BasicInformationPageData {
  detailsPromise: Promise<UserDetails>
}

// Logs with context then rethrows so the promise still rejects and the
// section error boundary renders a retryable state.
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

async function loadDetails(auth0Id: string): Promise<UserDetails> {
  const details = await getUserDetailsByAuth0Id(auth0Id)
  // Rejects rather than resolving null: the (main) layout already sends anyone
  // without a finished onboarding back to /onboarding, so by the time this runs
  // a missing row is a data problem for the error boundary to show.
  if (!details) throw new Error(`no users row for auth0 id ${auth0Id}`)
  return details
}

/**
 * Resolves the page's only blocking concern — the auth redirect — then hands
 * back the details as a streamable promise so the settings shell paints before
 * Neon answers. Same shape as loadStrategyPageData.
 */
export async function loadBasicInformationPageData(): Promise<BasicInformationPageData> {
  const session = await auth0.getSession()
  if (!session) redirect("/auth/login")

  const detailsPromise = loadDetails(session.user.sub).catch(
    logAndRethrow("basic information details failed"),
  )

  return { detailsPromise }
}
