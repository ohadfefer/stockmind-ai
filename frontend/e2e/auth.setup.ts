import { expect, test as setup } from "@playwright/test"
import { AUTH_FILE } from "./auth-state"

setup("log in as the e2e test user", async ({ page }) => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  if (!email || !password) {
    throw new Error("E2E_EMAIL and E2E_PASSWORD must be set in .env.local.")
  }

  // Auth0's hosted login page: email and password on one form. Its labels end
  // in a required-field "*" that is aria-hidden but still part of the text
  // Playwright matches, so match the start of the label. The ^ also keeps
  // "Password" off the "Show password" toggle next to the field.
  await page.goto("/auth/login?returnTo=/dashboard")
  await page.getByLabel(/^Email address/).fill(email)
  // Not fill(): the HTML report titles that step Fill "<value>", which would
  // write the password into playwright-report/ on every run. An evaluate step
  // is titled just "Evaluate". The input event stands in for typing, for any
  // script on the page that listens for it.
  await page
    .getByLabel(/^Password/)
    .evaluate((input: HTMLInputElement, value) => {
      input.value = value
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }, password)
  await page.getByRole("button", { name: "Continue", exact: true }).click()

  // The session cookie is set by /auth/callback, so arriving at /dashboard is
  // enough; no need to wait for the page to finish loading. An assertion
  // rather than waitForURL, so a failure prints where the login got stuck:
  // still on Auth0 means it rejected the credentials, and /onboarding means
  // the test user has no onboarded users row in the e2e branch. The longer
  // timeout covers `next dev` compiling /dashboard on its first visit.
  await expect(page).toHaveURL("/dashboard", { timeout: 20_000 })
  await page.context().storageState({ path: AUTH_FILE })
})
