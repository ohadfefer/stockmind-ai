import { NextResponse } from "next/server"
import { withUser } from "@/lib/http/with-auth"
import { invalid, notFound } from "@/lib/http/problem"
import { readJsonBody } from "@/lib/http/read-json-body"
import { parseProfileFields, updateUserProfile } from "@/services/user-profile-service"

/**
 * The caller's own investing profile. A singleton per user, so no id in the
 * path; the session says whose it is.
 *
 * withUser, not withAccount: the profile hangs off the users row and has
 * nothing to do with the brokerage account, so editing it must not provision
 * one as a side effect.
 *
 * PATCH rather than PUT because the settings page edits one answer at a
 * time — every field is optional and only the ones present change. There is
 * no GET: the settings page renders the profile server-side.
 */
export const PATCH = withUser(async (request, { userId }) => {
  const patch = parseProfileFields(await readJsonBody(request))
  if (typeof patch === "string") return invalid(patch)
  if (Object.keys(patch).length === 0) return invalid("No profile fields to update")

  const profile = await updateUserProfile(userId, patch)
  if (!profile) return notFound("Profile")

  return NextResponse.json(profile)
})
