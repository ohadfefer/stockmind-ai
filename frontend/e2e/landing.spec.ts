import { expect, test } from "@playwright/test"

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
