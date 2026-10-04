import { expect, test } from "@playwright/test"

// No other spec touches this symbol, so they can all run in parallel.
const SYMBOL = "KO"

// Removing a symbol that isn't there still answers 204, so this always leaves
// General without it, even if the last run failed before its remove step.
test.beforeEach(async ({ page }) => {
  const response = await page.request.delete(
    `/api/watchlists/default/items/${SYMBOL}`,
  )
  expect(response.status()).toBe(204)
})

test("following a stock adds it to General, and removing it there unfollows it", async ({
  page,
}) => {
  const main = page.getByRole("main")

  await page.goto(`/details/${SYMBOL}`)
  await main.getByRole("button", { name: "Follow", exact: true }).click()
  // The button only flips once the PUT has answered.
  await expect(main.getByRole("button", { name: "Following" })).toBeVisible()

  await page.goto("/watchlist")
  const row = main
    .getByRole("row")
    .filter({ has: page.getByText(SYMBOL, { exact: true }) })
  await expect(row).toBeVisible()

  // exact: the hidden confirm step's "Confirm remove" contains "Remove" too.
  await row.getByRole("button", { name: "Remove", exact: true }).click()
  const removed = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().endsWith(`/items/${SYMBOL}`),
  )
  await row.getByRole("button", { name: "Confirm remove" }).click()
  await expect(row).toHaveCount(0)
  expect((await removed).status()).toBe(204)

  // The details page reads following from the database, so this checks the
  // removal was saved, not just hidden.
  await page.goto(`/details/${SYMBOL}`)
  await expect(
    main.getByRole("button", { name: "Follow", exact: true }),
  ).toBeVisible()
})
