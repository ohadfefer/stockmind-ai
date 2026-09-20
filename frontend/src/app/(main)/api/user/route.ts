import { NextResponse } from "next/server"
import { withUser } from "@/lib/http/with-auth"
import { invalid, notFound } from "@/lib/http/problem"
import { readJsonBody } from "@/lib/http/read-json-body"
import { parseFullName, updateUserFullName } from "@/services/user-service"

/**
 * The caller's own users row. A singleton per user, so no id in the path; the
 * session says whose it is.
 *
 * withUser, not withAccount: identity has nothing to do with the brokerage
 * account, so renaming yourself must not provision one as a side effect.
 *
 * Only fullName is writable. email comes from Auth0 and is UNIQUE here, so
 * changing it is an identity-provider operation, not a settings edit. There is
 * no GET: the settings page renders the row server-side through
 * services/settings/basic-information-page-data.ts.
 */
export const PATCH = withUser(async (request, { userId }) => {
  const body = await readJsonBody<{ fullName?: unknown }>(request)
  const name = parseFullName(body?.fullName)
  if ("error" in name) return invalid(name.error)

  const details = await updateUserFullName(userId, name.fullName)
  if (!details) return notFound("User")

  return NextResponse.json(details)
})
