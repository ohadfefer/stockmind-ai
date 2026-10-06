import fs from "node:fs"
import path from "node:path"
import { defineConfig, devices } from "@playwright/test"
import { AUTH_FILE } from "./e2e/auth-state"

// Playwright doesn't read .env files, so load .env.local when it exists. A
// variable already set in the shell wins over the file. CI has no .env.local:
// its variables come from the job's environment.
const envFile = path.join(__dirname, ".env.local")
if (fs.existsSync(envFile)) process.loadEnvFile(envFile)

// The test server must never touch production: it runs against the "e2e"
// Neon branch. Compare endpoints rather than whole strings, so a pooled and a
// direct URL for the same branch still count as the same database.
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
if (!e2eDatabaseUrl) {
  throw new Error(
    "E2E_DATABASE_URL is not set. Add the e2e Neon branch's pooled connection string to .env.local, or to the environment in CI.",
  )
}
// new URL() puts the whole string, password included, on the error it throws
// for a malformed one, so throw one that only names the variable.
const parseDbUrl = (name: string, url: string) => {
  try {
    return new URL(url)
  } catch {
    throw new Error(`${name} is not a valid connection string.`)
  }
}
// A branch copies production's roles with their passwords, so any role but
// the branch-only e2e_runner also logs in to production. This check works
// without DATABASE_URL, which CI doesn't set.
if (parseDbUrl("E2E_DATABASE_URL", e2eDatabaseUrl).username !== "e2e_runner") {
  throw new Error(
    "E2E_DATABASE_URL must log in as e2e_runner, the e2e branch's own role. See README → Testing → One-time setup.",
  )
}
const endpointOf = (name: string, url: string) =>
  parseDbUrl(name, url).hostname.split(".")[0].replace(/-pooler$/, "")
if (
  process.env.DATABASE_URL &&
  endpointOf("E2E_DATABASE_URL", e2eDatabaseUrl) ===
    endpointOf("DATABASE_URL", process.env.DATABASE_URL)
) {
  throw new Error(
    "E2E_DATABASE_URL points at the same Neon endpoint as DATABASE_URL. Tests must run against the e2e branch, not production.",
  )
}

// Must match APP_BASE_URL: Auth0's redirect_uri is built from it, so a login
// started on any other host fails with "state parameter is invalid".
const baseURL = "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  reporter: [["list"], ["html", { open: "never" }]],
  // `next dev` compiles a route on its first visit, and the data-changing
  // specs reach several of theirs by client-side navigation, which page.goto
  // doesn't wait for. The default 5s can run out mid-compile.
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    // Logs in once per run and saves the session for every test after it.
    // Never traced: a trace records what was typed. (The HTML report records
    // typed text too, in step titles, so auth.setup.ts doesn't fill() the
    // password.) A screenshot is safe (the password field shows dots) and
    // shows where a failed login got stuck.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        trace: "off",
        screenshot: "only-on-failure",
      },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `${baseURL}/api/health`,
    // Never reuse a running dev server: it talks to production. If one is up
    // on :3000, Playwright stops with "is already used" instead.
    reuseExistingServer: false,
    // A variable set on the process beats .env.local in Next.js, so this
    // server, and only this one, talks to the e2e branch.
    env: { DATABASE_URL: e2eDatabaseUrl },
  },
})
