import { expect, test } from "@playwright/test"

// No other spec touches this symbol, so they can all run in parallel.
const SYMBOL = "AAPL"
// Out of reach for the stock, and distinct enough to find this run's row by.
const TARGET = "9999.99"

// Creating an alert first turns on push: the dialog subscribes the browser and
// registers that subscription with the server. A real subscribe() goes to the
// browser vendor's push service, a third party these tests leave out, so the
// init script below stands in for it with a subscription on an allowlisted
// host. Everything after that is the app's own code, including the PUT to
// /api/push-subscriptions. Nothing ever pushes to this endpoint: the alert
// checker runs against production, not the e2e branch.
const FAKE_PUSH_ENDPOINT = "https://fcm.googleapis.com/fcm/send/stockmind-e2e"
// The server's id for a subscription: base64url of its endpoint, unpadded.
const FAKE_PUSH_ID = Buffer.from(FAKE_PUSH_ENDPOINT).toString("base64url")

// The app reads Notification.permission, which Playwright's default headless
// shell keeps at "denied" even with the permission granted (permissions.query
// says "granted"). Chrome's own headless mode applies the grant.
test.use({ channel: "chromium", permissions: ["notifications"] })

// Alerts this run created. afterEach deletes them, so a failure before the
// delete step can't leave a second matching row for the next run.
let createdAlertIds: number[] = []

test.beforeEach(async ({ page }) => {
  createdAlertIds = []
  await page.addInitScript((endpoint) => {
    PushManager.prototype.subscribe = async () =>
      ({
        endpoint,
        getKey: (name: PushEncryptionKeyName) =>
          new Uint8Array(name === "p256dh" ? 65 : 16).buffer,
        unsubscribe: async () => true,
      }) as unknown as PushSubscription
  }, FAKE_PUSH_ENDPOINT)
})

test.afterEach(async ({ page }) => {
  // 404 means the test already deleted it, which is fine.
  for (const id of createdAlertIds) {
    await page.request.delete(`/api/alerts/${id}`)
  }
  await page.request.delete(`/api/push-subscriptions/${FAKE_PUSH_ID}`)
})

test("a price alert created on a stock lists under Portfolio → Alerts and can be deleted there", async ({
  page,
}) => {
  const main = page.getByRole("main")

  await page.goto(`/details/${SYMBOL}`)
  await main.getByRole("button", { name: "Alert", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: `Create Alert for ${SYMBOL}` })
  await dialog.getByRole("button", { name: "Price Above" }).click()
  // The "Target Price" text isn't a <label> tied to the input.
  await dialog.getByPlaceholder("0.00").fill(TARGET)

  const created = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/alerts",
  )
  await dialog.getByRole("button", { name: "Create Alert" }).click()
  const createdResponse = await created
  expect(createdResponse.status(), await createdResponse.text()).toBe(201)
  createdAlertIds.push(((await createdResponse.json()) as { id: number }).id)
  await expect(dialog).toBeHidden()

  await page.goto("/portfolio?tab=alerts")
  const row = main.getByRole("row").filter({ hasText: `Price > $${TARGET}` })
  await expect(row).toContainText(SYMBOL)
  await expect(row).toContainText("active")

  // exact: the hidden confirm step's "Confirm remove" contains "Remove" too.
  await row.getByRole("button", { name: "Remove", exact: true }).click()
  const deleted = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      new URL(response.url()).pathname.startsWith("/api/alerts/"),
  )
  await row.getByRole("button", { name: "Confirm remove" }).click()
  await expect(row).toHaveCount(0)
  expect((await deleted).status()).toBe(204)

  // The list is server-rendered, so a reload shows what was saved. Wait for
  // the list (or its empty state) first: a count of 0 also holds before it
  // has rendered at all.
  await page.reload()
  await expect(
    main.getByRole("table").or(main.getByText("No alerts set")),
  ).toBeVisible()
  await expect(row).toHaveCount(0)
})
