import { expect, test, type Locator } from "@playwright/test"

test("the landing page sends a logged-in user to the dashboard", async ({
  page,
}) => {
  await page.goto("/")

  await expect(page).toHaveURL("/dashboard")
})

// Each main page, with something that only renders once the page's own
// content has loaded. Market numbers are left out: they come live from
// Finnhub and change all day.
const pages: { path: string; marker: (main: Locator) => Locator }[] = [
  {
    path: "/dashboard",
    marker: (main) => main.getByText("Portfolio vs. Market", { exact: true }),
  },
  {
    path: "/portfolio",
    marker: (main) => main.getByRole("button", { name: "Analyze" }),
  },
  {
    path: "/watchlist",
    marker: (main) => main.getByRole("button", { name: "New watchlist" }),
  },
  {
    path: "/news",
    marker: (main) => main.getByRole("link", { name: "General", exact: true }),
  },
  {
    path: "/account",
    marker: (main) => main.getByRole("button", { name: "Account Balances" }),
  },
  {
    path: "/settings/basic-information",
    marker: (main) =>
      main.getByRole("heading", { name: "Details", exact: true }),
  },
]

for (const { path, marker } of pages) {
  test(`${path} opens for a logged-in user`, async ({ page }) => {
    const response = await page.goto(path)

    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(path)
    await expect(marker(page.getByRole("main"))).toBeVisible()
  })
}

test("logging out returns to the landing page and locks the app again", async ({
  page,
}) => {
  await page.goto("/auth/logout")

  await expect(page).toHaveURL("/")
  await expect(
    page.getByRole("link", { name: "Log in", exact: true }),
  ).toBeVisible()

  await page.goto("/dashboard")
  await expect(page).toHaveURL("/")
})
