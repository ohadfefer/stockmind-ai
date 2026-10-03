import path from "node:path"
import { defineConfig, devices } from "@playwright/test"
import { AUTH_FILE } from "./e2e/auth-state"

// Playwright doesn't read .env files, so load .env.local the way
// `npm run seed:demo` does. A variable already set in the shell wins over the
// file.
process.loadEnvFile(path.join(__dirname, ".env.local"))

// The test server must never touch production: it runs against the "e2e"
// Neon branch. Compare endpoints rather than whole strings, so a pooled and a
// direct URL for the same branch still count as the same database.
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
if (!e2eDatabaseUrl) {
  throw new Error(
    "E2E_DATABASE_URL is not set. Add the e2e Neon branch's pooled connection string to .env.local.",
  )
}
const endpointOf = (url: string) =>
  new URL(url).hostname.split(".")[0].replace(/-pooler$/, "")
if (
  process.env.DATABASE_URL &&
  endpointOf(e2eDatabaseUrl) === endpointOf(process.env.DATABASE_URL)
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
