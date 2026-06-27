import { getDb } from "@/lib/db"

/**
 * Seeds and resets the shared demo account behind the public "Try the demo"
 * login. Everything here is account-scoped and idempotent: resetDemoAccount()
 * ensures the demo identity, wipes the demo account's data, and re-seeds a
 * realistic portfolio, watchlists, alerts, AI chats, and a year of daily
 * performance points. Run manually via `npm run seed:demo`.
 *
 * Stripe is deliberately untouched (subscriptions / users.subscription_plan /
 * users.stripe_customer_id): deleting our local mirror while Stripe keeps its
 * copy is what orphans customers/subs and dead-ends webhooks. See the project
 * notes for the full reasoning.
 *
 * Entry prices below are FIXED — the live dashboard values positions against
 * real-time Finnhub quotes, so current/unrealized P&L is genuinely live. Only
 * the trade history and the performance chart are seeded.
 */

const DEMO_AUTH0_SUB = "auth0|6a3fa0b0dbd594d590a907c3"
const DEMO_EMAIL = "ohadfefer16+demo@gmail.com"
const DEMO_NAME = "Demo User"

const DEPOSIT_AMOUNT = 100_000
const DEPOSIT_DATE = "2025-07-07"
const COMMISSION = 2.0
const FEES = 0.5
const TRADE_TIME = "T14:30:00Z" // fixed intraday time for all seeded events

interface Lot {
  symbol: string
  qty: number
  price: number // entry price per share
  buyDate: string // YYYY-MM-DD
  // Present only for closed (sold) positions:
  sellDate?: string
  sellPrice?: number
}

// ~$75k cost basis across 12 sectors, one buy each on a different date.
const OPEN_LOTS: Lot[] = [
  { symbol: "AAPL", qty: 40, price: 205, buyDate: "2025-07-14" },
  { symbol: "MSFT", qty: 16, price: 420, buyDate: "2025-08-04" },
  { symbol: "NVDA", qty: 50, price: 125, buyDate: "2025-08-18" },
  { symbol: "GOOGL", qty: 35, price: 180, buyDate: "2025-09-08" },
  { symbol: "AMZN", qty: 35, price: 185, buyDate: "2025-09-22" },
  { symbol: "META", qty: 10, price: 720, buyDate: "2025-10-13" },
  { symbol: "TSLA", qty: 20, price: 330, buyDate: "2025-11-03" },
  { symbol: "JPM", qty: 28, price: 235, buyDate: "2025-11-24" },
  { symbol: "V", qty: 22, price: 285, buyDate: "2026-01-12" },
  { symbol: "COST", qty: 7, price: 905, buyDate: "2026-02-09" },
  { symbol: "UNH", qty: 14, price: 305, buyDate: "2026-03-16" },
  { symbol: "AMD", qty: 30, price: 165, buyDate: "2026-04-20" },
]

// Bought then fully sold — surface realized P&L in Account History.
const CLOSED_LOTS: Lot[] = [
  { symbol: "NFLX", qty: 12, price: 600, buyDate: "2025-08-11", sellDate: "2026-02-23", sellPrice: 760 },
  { symbol: "PYPL", qty: 80, price: 72, buyDate: "2025-10-06", sellDate: "2026-01-26", sellPrice: 64 },
  { symbol: "DIS", qty: 50, price: 95, buyDate: "2025-12-01", sellDate: "2026-04-06", sellPrice: 112 },
]

const WATCHLISTS: { name: string; items: { symbol: string; addedAt: string }[] }[] = [
  {
    name: "General",
    items: [
      { symbol: "AAPL", addedAt: "2025-07-10" },
      { symbol: "NVDA", addedAt: "2025-08-15" },
      { symbol: "MSFT", addedAt: "2025-08-02" },
      { symbol: "TSLA", addedAt: "2025-10-30" },
      { symbol: "AMD", addedAt: "2026-04-18" },
      { symbol: "JPM", addedAt: "2025-11-20" },
    ],
  },
  {
    name: "Tech & AI",
    items: [
      { symbol: "NVDA", addedAt: "2025-08-16" },
      { symbol: "AMD", addedAt: "2026-03-01" },
      { symbol: "AVGO", addedAt: "2026-02-12" },
      { symbol: "TSM", addedAt: "2026-01-20" },
      { symbol: "PLTR", addedAt: "2026-03-22" },
      { symbol: "SMCI", addedAt: "2026-04-02" },
    ],
  },
]

interface AlertSeed {
  symbol: string
  condition: "price_above" | "earnings"
  targetValue: number | null
  status: "active" | "triggered"
  createdAt: string
  triggeredAt: string | null
  earningsDate: string | null
}

const ALERTS: AlertSeed[] = [
  { symbol: "NVDA", condition: "price_above", targetValue: 150, status: "triggered", createdAt: "2026-04-05T16:00:00Z", triggeredAt: "2026-05-14T13:40:00Z", earningsDate: null },
  { symbol: "AAPL", condition: "price_above", targetValue: 250, status: "active", createdAt: "2026-05-20T10:00:00Z", triggeredAt: null, earningsDate: null },
  { symbol: "AMD", condition: "price_above", targetValue: 200, status: "active", createdAt: "2026-05-22T10:00:00Z", triggeredAt: null, earningsDate: null },
  { symbol: "TSLA", condition: "earnings", targetValue: null, status: "active", createdAt: "2026-06-26T12:00:00Z", triggeredAt: null, earningsDate: "2026-07-22T00:00:00Z" },
  { symbol: "DIS", condition: "earnings", targetValue: null, status: "triggered", createdAt: "2026-05-10T12:00:00Z", triggeredAt: "2026-05-13T13:00:00Z", earningsDate: "2026-05-13T00:00:00Z" },
]

interface ChatSeed {
  title: string
  createdAt: string
  userMsg: string
  assistantMsg: string
}

const CHATS: ChatSeed[] = [
  {
    title: "NVDA",
    createdAt: "2026-06-10T09:15:00Z",
    userMsg: "What's driving NVDA right now?",
    assistantMsg: `### NVIDIA (NVDA) — what's driving it

- **Data-center demand**: hyperscaler capex on AI training and inference is the core growth engine; the latest Blackwell-class GPUs remain supply-constrained.
- **Margins**: gross margins in the low-70s% reflect real pricing power, though they normalize as supply catches up.
- **Risks**: customer concentration in a handful of hyperscalers, export controls on China, and rising competition from custom silicon (TPUs, MI-series).

**Bottom line**: still the AI-infrastructure bellwether — momentum is real but priced for continued execution. Watch data-center revenue growth and forward guidance each quarter.`,
  },
  {
    title: "Concentration risk",
    createdAt: "2026-06-20T16:40:00Z",
    userMsg: "What's my biggest concentration risk?",
    assistantMsg: `### Your biggest concentration risk

Your book leans heavily into **mega-cap technology** — AAPL, MSFT, NVDA, GOOGL, AMZN and META together drive most of the portfolio's beta. That means:

- **Correlated drawdowns**: these names tend to sell off together on rate or AI-sentiment shocks.
- **Single-factor exposure**: you're effectively long "large-cap growth / AI" more than you are diversified.

**Ways to balance it**: trim the largest tech weights, or add less-correlated sleeves (healthcare, energy, financials, short-duration cash). You already hold JPM, V, UNH and COST — nudging those up would lower the overall tech concentration.`,
  },
]

const round2 = (n: number) => Math.round(n * 100) / 100
const round6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000
const lotCost = (l: Lot) => l.qty * l.price + COMMISSION + FEES
const ts = (date: string) => `${date}${TRADE_TIME}`
const dayMs = 86_400_000

type Sql = ReturnType<typeof getDb>

interface TradeEvent {
  date: string
  symbol: string
  side: "buy" | "sell"
  qty: number
  price: number
}

/** Chronological buy/sell timeline across open and closed lots. */
function buildTimeline(): TradeEvent[] {
  const events: TradeEvent[] = []
  for (const l of OPEN_LOTS) {
    events.push({ date: l.buyDate, symbol: l.symbol, side: "buy", qty: l.qty, price: l.price })
  }
  for (const l of CLOSED_LOTS) {
    events.push({ date: l.buyDate, symbol: l.symbol, side: "buy", qty: l.qty, price: l.price })
    events.push({ date: l.sellDate!, symbol: l.symbol, side: "sell", qty: l.qty, price: l.sellPrice! })
  }
  return events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** Cash balance step-function: running balance after the last event on/before `date`. */
function buildCashTimeline(timeline: TradeEvent[]): { date: string; balance: number }[] {
  const points: { date: string; balance: number }[] = [
    { date: DEPOSIT_DATE, balance: DEPOSIT_AMOUNT },
  ]
  let running = DEPOSIT_AMOUNT
  for (const ev of timeline) {
    const value = ev.qty * ev.price
    const amount = ev.side === "buy" ? -(value + COMMISSION + FEES) : value - COMMISSION - FEES
    running = round2(running + amount)
    points.push({ date: ev.date, balance: running })
  }
  return points
}

function cashAt(points: { date: string; balance: number }[], date: string): number {
  let bal = 0
  for (const p of points) {
    if (p.date <= date) bal = p.balance
    else break
  }
  return bal
}

// Deterministic PRNG (mulberry32) so the chart is stable across reseeds — the
// history doesn't reshuffle every night, it just grows by a day.
function makePrng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAILY_DRIFT = 0.0006 // slight upward bias so the year nets ~+10%
const DAILY_VOL = 0.012 // half-range of the daily shock (~±1.2%, mixed red/green)
const MARKET_SEED = 20260707

interface DailyRow {
  d: string
  mv: number
  cb: number
  cash: number
}

/**
 * ~1 row per weekday from the deposit to yesterday (UTC). Market value follows
 * a shared random-walk index measured from each lot's entry day, so:
 *  - days are a realistic mix of gains and losses (drives the daily-returns UI),
 *  - a new buy enters at cost (no spurious jump on its purchase day).
 */
function buildDailyValues(endDate: Date): DailyRow[] {
  const cashPoints = buildCashTimeline(buildTimeline())
  const lots = [...OPEN_LOTS, ...CLOSED_LOTS]

  const days: string[] = []
  for (
    let t = new Date(`${DEPOSIT_DATE}T00:00:00Z`);
    t <= endDate;
    t = new Date(t.getTime() + dayMs)
  ) {
    const dow = t.getUTCDay()
    if (dow === 0 || dow === 6) continue // weekdays only
    days.push(t.toISOString().slice(0, 10))
  }
  const dayIndexOf = new Map(days.map((d, i) => [d, i]))

  // Multiplicative market index: idx[i]/idx[entry] = a lot's growth since entry.
  const prng = makePrng(MARKET_SEED)
  const idx: number[] = [1]
  for (let i = 1; i < days.length; i++) {
    const shock = DAILY_DRIFT + (prng() * 2 - 1) * DAILY_VOL
    idx.push(idx[i - 1] * (1 + shock))
  }

  return days.map((date, i) => {
    const cash = cashAt(cashPoints, date)
    let marketValue = 0
    let costBasis = 0
    for (const lot of lots) {
      const held = lot.buyDate <= date && (!lot.sellDate || date < lot.sellDate)
      if (!held) continue
      const cost = lotCost(lot)
      const entry = dayIndexOf.get(lot.buyDate) ?? i
      marketValue += cost * (idx[i] / idx[entry])
      costBasis += cost
    }
    return { d: date, mv: round2(marketValue), cb: round2(costBasis), cash: round2(cash) }
  })
}

async function ensureDemoIdentity(sql: Sql): Promise<{ userId: number; accountId: number }> {
  // Upsert the user WITHOUT touching subscription_plan / stripe_customer_id.
  const userRows = (await sql`
    INSERT INTO users (auth0_id, email, full_name, is_demo, onboarded_at)
    VALUES (${DEMO_AUTH0_SUB}, ${DEMO_EMAIL}, ${DEMO_NAME}, true, NOW())
    ON CONFLICT (auth0_id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        is_demo = true,
        onboarded_at = COALESCE(users.onboarded_at, NOW()),
        updated_at = NOW()
    RETURNING id
  `) as { id: number }[]
  const userId = userRows[0].id

  await sql`
    INSERT INTO user_profiles (user_id, experience_level, motivation, interests, investor_style, engagement_cadence)
    VALUES (${userId}, 'experienced', 'growth_opportunist', ARRAY['ai_tech','dividends']::text[], 'active', 'daily')
    ON CONFLICT (user_id) DO NOTHING
  `

  const existing = (await sql`
    SELECT id FROM accounts WHERE user_id = ${userId} AND status = 'active'
    ORDER BY opened_at LIMIT 1
  `) as { id: number }[]
  if (existing.length > 0) return { userId, accountId: existing[0].id }

  const created = (await sql`
    INSERT INTO accounts (user_id, account_number)
    VALUES (${userId}, ${"SIM-" + String(userId).padStart(5, "0")})
    RETURNING id
  `) as { id: number }[]
  return { userId, accountId: created[0].id }
}

async function wipeAccountData(sql: Sql, accountId: number): Promise<void> {
  // Order respects FKs; ON DELETE CASCADE handles executions (via orders) and
  // conversation_messages (via conversations). Stripe-scoped tables (users,
  // subscriptions) are intentionally left alone.
  await sql`DELETE FROM conversations WHERE account_id = ${accountId}`
  await sql`DELETE FROM orders WHERE account_id = ${accountId}`
  await sql`DELETE FROM cash_ledger WHERE account_id = ${accountId}`
  await sql`DELETE FROM transfers WHERE account_id = ${accountId}`
  await sql`DELETE FROM positions WHERE account_id = ${accountId}`
  await sql`DELETE FROM position_history WHERE account_id = ${accountId}`
  await sql`DELETE FROM stock_alerts WHERE account_id = ${accountId}`
  await sql`DELETE FROM missed_alerts WHERE account_id = ${accountId}`
  await sql`DELETE FROM portfolio_daily_value WHERE account_id = ${accountId}`
  await sql`DELETE FROM watchlist_items WHERE watchlist_id IN (SELECT id FROM watchlists WHERE account_id = ${accountId})`
  await sql`DELETE FROM watchlists WHERE account_id = ${accountId}`
}

async function seedTradesAndCash(sql: Sql, accountId: number): Promise<void> {
  const depTs = ts(DEPOSIT_DATE)
  const xfer = (await sql`
    INSERT INTO transfers (account_id, direction, amount, method, status, description, initiated_at, completed_at)
    VALUES (${accountId}, 'deposit', ${DEPOSIT_AMOUNT}, 'bank_transfer', 'completed', 'Initial funding', ${depTs}, ${depTs})
    RETURNING id
  `) as { id: number }[]
  let running = DEPOSIT_AMOUNT
  await sql`
    INSERT INTO cash_ledger (account_id, entry_type, amount, running_balance, reference_id, description, created_at)
    VALUES (${accountId}, 'deposit', ${DEPOSIT_AMOUNT}, ${running}, ${xfer[0].id}, 'Deposit', ${depTs})
  `

  for (const ev of buildTimeline()) {
    const at = ts(ev.date)
    const order = (await sql`
      INSERT INTO orders (account_id, symbol, side, order_type, quantity, time_in_force, status, filled_quantity, average_fill_price, submitted_at, filled_at)
      VALUES (${accountId}, ${ev.symbol}, ${ev.side}, 'market', ${ev.qty}, 'day', 'filled', ${ev.qty}, ${ev.price}, ${at}, ${at})
      RETURNING id
    `) as { id: number }[]

    const exec = (await sql`
      INSERT INTO executions (order_id, account_id, symbol, side, quantity, price, commission, fees, executed_at)
      VALUES (${order[0].id}, ${accountId}, ${ev.symbol}, ${ev.side}, ${ev.qty}, ${ev.price}, ${COMMISSION}, ${FEES}, ${at})
      RETURNING id
    `) as { id: number }[]

    const value = ev.qty * ev.price
    const amount = round2(ev.side === "buy" ? -(value + COMMISSION + FEES) : value - COMMISSION - FEES)
    running = round2(running + amount)
    const desc = `${ev.side.toUpperCase()} ${ev.qty} ${ev.symbol} @ $${ev.price} (comm $${COMMISSION}, fees $${FEES})`
    await sql`
      INSERT INTO cash_ledger (account_id, entry_type, amount, running_balance, reference_id, description, created_at)
      VALUES (${accountId}, 'trade_settlement', ${amount}, ${running}, ${exec[0].id}, ${desc}, ${at})
    `
  }

  for (const lot of OPEN_LOTS) {
    const avg = round6(lotCost(lot) / lot.qty)
    await sql`
      INSERT INTO positions (account_id, symbol, quantity, average_cost_basis, realized_pnl, updated_at)
      VALUES (${accountId}, ${lot.symbol}, ${lot.qty}, ${avg}, 0, ${ts(lot.buyDate)})
    `
  }
  for (const lot of CLOSED_LOTS) {
    const avg = lotCost(lot) / lot.qty
    const realized = round2((lot.sellPrice! - avg) * lot.qty - COMMISSION - FEES)
    await sql`
      INSERT INTO positions (account_id, symbol, quantity, average_cost_basis, realized_pnl, updated_at)
      VALUES (${accountId}, ${lot.symbol}, 0, ${round6(avg)}, ${realized}, ${ts(lot.sellDate!)})
    `
  }
}

async function seedWatchlists(sql: Sql, accountId: number): Promise<void> {
  for (const wl of WATCHLISTS) {
    const created = (await sql`
      INSERT INTO watchlists (account_id, name) VALUES (${accountId}, ${wl.name}) RETURNING id
    `) as { id: number }[]
    for (const item of wl.items) {
      await sql`
        INSERT INTO watchlist_items (watchlist_id, symbol, added_at)
        VALUES (${created[0].id}, ${item.symbol}, ${ts(item.addedAt)})
      `
    }
  }
}

async function seedAlerts(sql: Sql, accountId: number): Promise<void> {
  for (const a of ALERTS) {
    await sql`
      INSERT INTO stock_alerts (account_id, symbol, condition, target_value, status, triggered_at, created_at, earnings_date)
      VALUES (${accountId}, ${a.symbol}, ${a.condition}, ${a.targetValue}, ${a.status}, ${a.triggeredAt}, ${a.createdAt}, ${a.earningsDate})
    `
  }
}

async function seedChats(sql: Sql, accountId: number): Promise<void> {
  for (const chat of CHATS) {
    const replyAt = new Date(Date.parse(chat.createdAt) + 18_000).toISOString()
    const conv = (await sql`
      INSERT INTO conversations (account_id, title, created_at, updated_at)
      VALUES (${accountId}, ${chat.title}, ${chat.createdAt}, ${replyAt})
      RETURNING id
    `) as { id: number }[]
    await sql`
      INSERT INTO conversation_messages (conversation_id, role, content, created_at)
      VALUES (${conv[0].id}, 'user', ${chat.userMsg}, ${chat.createdAt})
    `
    await sql`
      INSERT INTO conversation_messages (conversation_id, role, content, created_at)
      VALUES (${conv[0].id}, 'assistant', ${chat.assistantMsg}, ${replyAt})
    `
  }
}

async function seedDailyValues(sql: Sql, accountId: number): Promise<void> {
  const yesterday = new Date(Date.now() - dayMs)
  const rows = buildDailyValues(yesterday)
  // total_value is a GENERATED column (market_value + cash_balance) — never inserted.
  await sql`
    INSERT INTO portfolio_daily_value (account_id, date, market_value, cost_basis, cash_balance, net_cash_flow, created_at)
    SELECT ${accountId}, x.d, x.mv, x.cb, x.cash, 0, NOW()
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
      AS x(d date, mv numeric, cb numeric, cash numeric)
  `
}

export interface DemoSeedResult {
  userId: number
  accountId: number
}

/**
 * Idempotent: ensures the demo identity, wipes the demo account's data, and
 * re-seeds it. Safe to run on a fresh DB or nightly. Leaves all Stripe state
 * untouched.
 */
export async function resetDemoAccount(): Promise<DemoSeedResult> {
  const sql = getDb()
  const { userId, accountId } = await ensureDemoIdentity(sql)
  await wipeAccountData(sql, accountId)
  await seedTradesAndCash(sql, accountId)
  await seedWatchlists(sql, accountId)
  await seedAlerts(sql, accountId)
  await seedChats(sql, accountId)
  await seedDailyValues(sql, accountId)
  return { userId, accountId }
}

/** Alias — seeding the demo is the same idempotent operation as resetting it. */
export const seedDemoAccount = resetDemoAccount
