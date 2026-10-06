import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test"

// Cheap, so a run's buy and sell cost little beyond the $2.50 commission and
// fees each fill pays. No other spec touches it.
const SYMBOL = "F"

// The test user starts with no cash, and a deposit is allowed once every 72
// hours, so the test tops up only when it has to. 10,000 covers years of runs.
const MINIMUM_CASH = 1_000
const DEPOSIT = 10_000

// Orders this run placed. afterEach cancels any still pending, so a failure
// before Execute can't leave a second row for the next run's orders table.
let placedOrderIds: number[] = []

test.beforeEach(() => {
  placedOrderIds = []
})

test.afterEach(async ({ page }) => {
  // 409 means it filled or was already cancelled, which is fine.
  for (const id of placedOrderIds) {
    await page.request.patch(`/api/orders/${id}`, {
      data: { status: "cancelled" },
    })
  }
})

/**
 * The same numbers the trade form checks against. Read through the API
 * because cash isn't on the trade pages, and the position is easier to
 * compare as a number than as rendered text.
 */
async function tradingInfo(request: APIRequestContext) {
  const response = await request.get("/api/portfolio/trading-info")
  expect(response.status()).toBe(200)
  const info = (await response.json()) as {
    cashBalance: number
    positions: { symbol: string; quantity: number }[]
  }
  return {
    cash: info.cashBalance,
    shares: info.positions.find((p) => p.symbol === SYMBOL)?.quantity ?? 0,
  }
}

async function depositIfLow(request: APIRequestContext) {
  const { cash } = await tradingInfo(request)
  if (cash >= MINIMUM_CASH) return

  const response = await request.post("/api/transfers", {
    data: { direction: "deposit", amount: DEPOSIT, method: "bank_transfer" },
  })
  // The body names the reason on failure, e.g. the 72-hour cooldown.
  expect(response.status(), await response.text()).toBe(202)
  const { id } = (await response.json()) as { id: number }

  // The server settles a deposit on a 10-second timer.
  await expect
    .poll(
      async () => {
        const transfer = await request.get(`/api/transfers/${id}`)
        return ((await transfer.json()) as { status: string }).status
      },
      { timeout: 30_000 },
    )
    .toBe("completed")
}

/** Places a one-share market order through the form and executes it. */
async function trade(page: Page, action: "Buy" | "Sell", sharesHeld: number) {
  const main = page.getByRole("main")

  await page.goto("/portfolio/trade")
  if (action === "Sell") {
    await main.getByRole("combobox", { name: "Action" }).click()
    await page.getByRole("option", { name: "Sell" }).click()
  }
  await main.getByLabel("Symbol").fill(SYMBOL)
  await main.getByLabel("Quantity").fill("1")
  // Shown once the form has the account's positions and its 1-second symbol
  // debounce has settled. Continue checks a sell against that same count, so
  // clicking before it appears reads as holding no shares.
  await expect(main.getByText(`Holding ${sharesHeld} ${SYMBOL}`)).toBeVisible()
  await main.getByRole("button", { name: "Continue" }).click()

  await expect(main.getByText(`${action} 1 shares of ${SYMBOL}`)).toBeVisible()
  const placed = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/orders",
  )
  await main.getByRole("button", { name: "Confirm Order" }).click()
  const placedResponse = await placed
  expect(placedResponse.status(), await placedResponse.text()).toBe(201)
  placedOrderIds.push(((await placedResponse.json()) as { id: number }).id)

  // Orders lists only pending orders, and this spec is the only one placing
  // them, so this run's order is the one row for the symbol.
  await expect(page).toHaveURL("/portfolio/orders")
  const row = main
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: SYMBOL, exact: true }) })
  await expect(row).toContainText(action.toUpperCase())

  const executed = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/executions"),
  )
  await row.getByRole("button", { name: "Execute" }).click()
  // Status only. The page sends this with apiSend and never reads the body,
  // and text() on it then waited out the whole test timeout. On a failure the
  // trace has the body; a 502 means Finnhub had no price for the fill.
  expect((await executed).status()).toBe(201)
  await expect(row).toHaveCount(0)
}

test("buying and then selling a share moves the position and the cash", async ({
  page,
}) => {
  // Two orders, each with debounced fields and a first-visit compile of every
  // page on the way, plus a deposit that can take 10 seconds.
  test.slow()

  await test.step("make sure the account can pay for a share", async () => {
    await depositIfLow(page.request)
  })
  const start = await tradingInfo(page.request)

  // Fill prices are live, so the cash checks are directional: a buy costs at
  // least the fees, and a sell at a positive price returns more than them.
  const afterBuy = await test.step("buy one share", async () => {
    await trade(page, "Buy", start.shares)
    const now = await tradingInfo(page.request)
    expect(now.shares).toBe(start.shares + 1)
    expect(now.cash).toBeLessThan(start.cash)
    return now
  })

  await test.step("sell it again", async () => {
    await trade(page, "Sell", afterBuy.shares)
    const now = await tradingInfo(page.request)
    expect(now.shares).toBe(start.shares)
    expect(now.cash).toBeGreaterThan(afterBuy.cash)
  })
})
