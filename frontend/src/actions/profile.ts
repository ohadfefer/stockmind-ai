import { apiFetch, json } from "@/actions/http"
import type { UserProfile, UserProfilePatch } from "@/services/user-profile-service"

/** Changes only the fields present in `patch`; resolves to the whole updated profile. */
export function updateProfile(patch: UserProfilePatch): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/profile", { method: "PATCH", ...json(patch) })
}
