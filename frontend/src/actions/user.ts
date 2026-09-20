import { apiFetch, json } from "@/actions/http"
import type { UserDetails } from "@/services/user-service"

/** Renames the signed-in user; resolves to the whole updated details row. */
export function updateFullName(fullName: string): Promise<UserDetails> {
  return apiFetch<UserDetails>("/api/user", { method: "PATCH", ...json({ fullName }) })
}
