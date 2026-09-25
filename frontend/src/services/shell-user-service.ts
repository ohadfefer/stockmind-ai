import { revalidateTag, unstable_cache } from "next/cache"
import { getDb } from "@/lib/db"

/**
 * The users-row fields the (main) layout needs on every full render: the
 * sidebar and header name, and the onboarding gate.
 */
export interface ShellUser {
  fullName: string
  onboarded: boolean
}

function getShellUserCacheTag(auth0Id: string): string {
  return `shell-user:${auth0Id}`
}

/**
 * Anything that writes users.full_name or users.onboarded_at must call this,
 * or the sidebar keeps the old name and a just-onboarded user is sent back to
 * /onboarding until the cache entry ages out.
 *
 * { expire: 0 } rather than a named profile: "default" and "max" are
 * stale-while-revalidate, so the very next read — the name editor's
 * router.refresh(), the redirect out of onboarding — would still get the old
 * row and only refresh it in the background.
 */
export function revalidateShellUser(auth0Id: string): void {
  revalidateTag(getShellUserCacheTag(auth0Id), { expire: 0 })
}

/**
 * Name and onboarding flag in one query, cached across requests. The layout
 * renders on every full load and router.refresh(), and neither the sidebar
 * nor the page's loading skeleton can paint until it resolves, so a cache hit
 * takes the database off first paint.
 *
 * Null when there is no users row (a signup that never finished onboarding)
 * or when the query fails — the layout sends both to /onboarding, as it
 * always has. The failure is caught outside the cache, so a Neon blip is
 * never stored.
 */
export async function getShellUser(auth0Id: string): Promise<ShellUser | null> {
  try {
    return await unstable_cache(
      async (): Promise<ShellUser | null> => {
        const sql = getDb()
        const rows = await sql`
          SELECT full_name, onboarded_at IS NOT NULL AS onboarded
          FROM users
          WHERE auth0_id = ${auth0Id}
        `
        const row = rows[0]
        if (!row) return null
        return {
          fullName: row.full_name as string,
          onboarded: row.onboarded as boolean,
        }
      },
      ["shell-user-by-auth0-id", auth0Id],
      // The 60s ceiling is for writers that can't reach this process's cache,
      // like the demo seed script or a manual SQL fix. In-app writers call
      // revalidateShellUser.
      { tags: [getShellUserCacheTag(auth0Id)], revalidate: 60 },
    )()
  } catch (err) {
    console.error("[getShellUser] failed", err)
    return null
  }
}
