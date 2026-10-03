import { expect, test } from "@playwright/test"

// Start without the setup project's saved session.
test.use({ storageState: { cookies: [], origins: [] } })

test("landing page offers log in and sign up to a logged-out visitor", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { level: 1, name: "StockMind AI" }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Log in", exact: true }),
  ).toHaveAttribute("href", "/auth/login?returnTo=/dashboard")
  await expect(
    page.getByRole("link", { name: "Sign up", exact: true }),
  ).toHaveAttribute("href", "/auth/login?screen_hint=signup&returnTo=/onboarding")
})

test("a logged-out visit to a protected page redirects to the landing page", async ({
  page,
}) => {
  await page.goto("/dashboard")

  await expect(page).toHaveURL("/")
})

test("a logged-out API call gets a 401 problem+json", async ({ page }) => {
  const response = await page.request.get("/api/watchlists")

  expect(response.status()).toBe(401)
  expect(response.headers()["content-type"]).toMatch(
    /^application\/problem\+json/,
  )
  expect(await response.json()).toMatchObject({
    status: 401,
    code: "unauthenticated",
  })
})
