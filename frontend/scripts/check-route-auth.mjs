#!/usr/bin/env node
/**
 * Fails the build if any route handler ships without authentication.
 *
 * Every exported HTTP method under src/app must either be assigned from one of
 * the wrappers in lib/http/with-auth, or belong to a path listed in
 * PUBLIC_API_ROUTES — which are the routes that authenticate themselves with a
 * signature or a shared secret.
 *
 * Wired as `prebuild`, so it runs inside `next build` and therefore inside the
 * Docker image build. A route that forgets auth fails the deploy rather than a
 * test suite nobody runs; CI goes straight from checkout to `docker build`.
 *
 * Checks methods, not files. A file-level "does it import with-auth" test
 * passes a file whose GET is wrapped and whose newly added DELETE is a bare
 * `export async function` — which is exactly the mistake worth catching.
 *
 * Zero dependencies, so PUBLIC_API_ROUTES is read out of the TypeScript source
 * by pattern rather than imported. An empty or unparseable result is a hard
 * error: silently reading it as "no public routes" would fail the honest
 * routes, and silently reading it as "everything" would defeat the check.
 */

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const appDir = join(root, "src", "app")
const publicRoutesFile = join(root, "src", "lib", "http", "public-routes.ts")

const WRAPPERS = new Set(["withAuth", "withUser", "withAccount"])
const METHODS = "GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS"

/**
 * `export const GET = withAuth(` — captures the method and the wrapper name.
 * The optional `<...>` is the type argument the dynamic routes pass for their
 * params, as in `withAccount<Params>(`.
 */
const WRAPPED_RE = new RegExp(
  `^\\s*export\\s+const\\s+(${METHODS})\\s*(?::[^=]+)?=\\s*` +
    `([A-Za-z_$][\\w$]*)\\s*(?:<[^(]*>)?\\s*\\(`,
  "gm",
)
/** `export async function GET(` — the unwrapped form, always a finding. */
const BARE_RE = new RegExp(
  `^\\s*export\\s+(?:async\\s+)?function\\s+(${METHODS})\\s*\\(`,
  "gm",
)

function readPublicRoutes() {
  const source = readFileSync(publicRoutesFile, "utf8")
  const block = source.match(/PUBLIC_API_ROUTES\s*=\s*\[([\s\S]*?)\]\s*as const/)
  if (!block) {
    throw new Error(
      `Could not find PUBLIC_API_ROUTES in ${relative(root, publicRoutesFile)}. ` +
        `This script parses that array as text — update the pattern if the ` +
        `declaration changed shape.`,
    )
  }
  const paths = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  if (paths.length === 0) {
    throw new Error(
      `PUBLIC_API_ROUTES parsed as empty. Either every public route was removed ` +
        `(delete this guard's parser too) or the array format changed.`,
    )
  }
  return new Set(paths)
}

function findRouteFiles(dir) {
  const found = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      found.push(...findRouteFiles(full))
    } else if (entry === "route.ts" || entry === "route.tsx") {
      found.push(full)
    }
  }
  return found
}

/** src/app/(main)/api/health/route.ts -> /api/health. Route groups drop out. */
function toUrlPath(file) {
  return (
    "/" +
    relative(appDir, file)
      .split(sep)
      .slice(0, -1)
      .filter((segment) => !segment.startsWith("("))
      .join("/")
  )
}

const publicRoutes = readPublicRoutes()
const routeFiles = findRouteFiles(appDir).sort()
const problems = []
const seenPaths = new Set()

for (const file of routeFiles) {
  const urlPath = toUrlPath(file)
  seenPaths.add(urlPath)
  const where = relative(root, file)
  const source = readFileSync(file, "utf8")

  const bare = [...source.matchAll(BARE_RE)].map((m) => m[1])
  const wrapped = [...source.matchAll(WRAPPED_RE)].map((m) => ({
    method: m[1],
    wrapper: m[2],
  }))

  if (publicRoutes.has(urlPath)) {
    // Public routes are exempt from the wrappers, not from scrutiny: they must
    // still carry a check of their own, which lives inside the handler and is
    // beyond what a text scan can verify. The comment on each PUBLIC_API_ROUTES
    // entry is the record of which one.
    continue
  }

  for (const method of bare) {
    problems.push(
      `${where}: ${method} is a bare export. Wrap it: ` +
        `export const ${method} = withAuth(async (request) => { ... })`,
    )
  }
  for (const { method, wrapper } of wrapped) {
    if (!WRAPPERS.has(wrapper)) {
      problems.push(
        `${where}: ${method} is assigned from ${wrapper}(), which is not one of ` +
          `${[...WRAPPERS].join(", ")}.`,
      )
    }
  }
  if (bare.length === 0 && wrapped.length === 0) {
    problems.push(
      `${where}: exports no HTTP method this script recognises. If it uses a ` +
        `form other than \`export const GET = ...\` or \`export function GET\`, ` +
        `teach the script that form rather than leaving the file unchecked.`,
    )
  }
}

// A listed path with no route file behind it is worth removing before an
// unrelated route is created at that path and inherits the exemption.
for (const urlPath of publicRoutes) {
  if (!seenPaths.has(urlPath)) {
    problems.push(
      `src/lib/http/public-routes.ts: "${urlPath}" is listed public but no ` +
        `route handler exists there. Remove the entry.`,
    )
  }
}

if (problems.length > 0) {
  console.error(`\ncheck-route-auth: ${problems.length} problem(s)\n`)
  for (const problem of problems) console.error(`  ✗ ${problem}`)
  console.error(
    `\nEvery route handler needs withAuth/withUser/withAccount, or an entry in ` +
      `PUBLIC_API_ROUTES with its own in-handler check.\n`,
  )
  process.exit(1)
}

console.log(
  `check-route-auth: ${routeFiles.length} route files OK ` +
    `(${publicRoutes.size} public, ${routeFiles.length - publicRoutes.size} authenticated)`,
)
