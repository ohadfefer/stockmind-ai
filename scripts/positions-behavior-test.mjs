#!/usr/bin/env node
/**
 * Throwaway harness for the positions rewrite in
 * frontend/src/services/position/position-service.ts.
 *
 * Two things under test:
 *  - the arithmetic is unchanged from the JS version it replaced (weighted
 *    average cost basis, clamped sells, realized P&L), apart from the one
 *    deliberate behaviour change: a sell against a closed or missing position
 *    is now a no-op instead of charging commission and fees to realized_pnl;
 *  - concurrent buys of the same symbol no longer lose updates or duplicate.
 *
 * Manual harness, not an automated test — the project has no test runner. Run it
 * by hand against a disposable Neon branch; it writes real positions rows and
 * refuses to start without --confirm-throwaway.
 *
 *   DATABASE_URL=... node scripts/positions-behavior-test.mjs --account=1 --confirm-throwaway
 */

import { neon } from "../frontend/node_modules/@neondatabase/serverless/index.mjs"

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=")
    return [k, v ?? true]
  }),
)

const ACCOUNT_ID = Number(args.account)
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("DATABASE_URL is required")
if (!Number.isInteger(ACCOUNT_ID)) throw new Error("--account=<id> is required")

// Writes real positions rows for throwaway symbols and never cleans them up.
// DATABASE_URL is ambient, so refuse by default rather than trust the shell.
const target = new URL(DATABASE_URL).host
if (!args["confirm-throwaway"]) {
  console.error(
    `\nRefusing to run against ${target}\n\n` +
      `  This writes positions rows and does not clean them up.\n\n` +
      `  Point DATABASE_URL at a disposable Neon branch, then re-run with:\n\n` +
      `    --confirm-throwaway\n`,
  )
  process.exit(1)
}

console.log(`target: ${target}`)
const sql = neon(DATABASE_URL)
const COMMISSION = 2.0
const FEES = 0.5

// Copied verbatim from updatePosition.
async function buy(symbol, quantity, price) {
  const totalCost = quantity * price + COMMISSION + FEES
  await sql`
    INSERT INTO positions (account_id, symbol, quantity, average_cost_basis, realized_pnl)
    VALUES (
      ${ACCOUNT_ID}::int,
      ${symbol}::text,
      ${quantity}::numeric(16,6),
      (${totalCost}::numeric / ${quantity}::numeric)::numeric(16,6),
      0
    )
    ON CONFLICT (account_id, symbol) DO UPDATE
    SET quantity = positions.quantity + EXCLUDED.quantity,
        average_cost_basis =
          (positions.quantity * positions.average_cost_basis + ${totalCost}::numeric)
          / (positions.quantity + EXCLUDED.quantity),
        updated_at = NOW()
  `
}

async function sell(symbol, quantity, price) {
  await sql`
    UPDATE positions
    SET quantity = quantity - LEAST(${quantity}::numeric, quantity),
        realized_pnl = realized_pnl
          + (${price}::numeric - average_cost_basis)
            * LEAST(${quantity}::numeric, quantity)
          - ${COMMISSION}::numeric - ${FEES}::numeric,
        updated_at = NOW()
    WHERE account_id = ${ACCOUNT_ID}::int
      AND symbol = ${symbol}::text
      AND quantity > 0
  `
}

async function read(symbol) {
  const rows = await sql`
    SELECT quantity, average_cost_basis, realized_pnl FROM positions
    WHERE account_id = ${ACCOUNT_ID} AND symbol = ${symbol}
  `
  if (rows.length === 0) return null
  return {
    qty: Number(rows[0].quantity),
    avg: Number(rows[0].average_cost_basis),
    pnl: Number(rows[0].realized_pnl),
  }
}

let ok = true
const near = (a, b) => Math.abs(a - b) < 0.000001
const step = (label, actual, want) => {
  const pass =
    actual !== null &&
    near(actual.qty, want.qty) &&
    near(actual.avg, want.avg) &&
    near(actual.pnl, want.pnl)
  console.log(
    `  ${pass ? "PASS" : "FAIL"}  ${label}\n` +
      `        got  qty=${actual?.qty} avg=${actual?.avg} pnl=${actual?.pnl}\n` +
      `        want qty=${want.qty} avg=${want.avg} pnl=${want.pnl}`,
  )
  ok = pass && ok
}

const SYM = `ZZT${Date.now() % 100000}`
console.log(`\naccount=${ACCOUNT_ID} symbol=${SYM}\n`)

// 1. First buy of a new symbol: cost basis includes commission and fees.
await buy(SYM, 10, 100)
step("first buy 10 @ 100", await read(SYM), { qty: 10, avg: 100.25, pnl: 0 })

// 2. Add to the position: weighted average across both lots.
await buy(SYM, 10, 110)
step("add 10 @ 110 -> weighted avg", await read(SYM), { qty: 20, avg: 105.25, pnl: 0 })

// 3. Partial sell: realize P&L against the average, minus costs.
await sell(SYM, 5, 120)
step("sell 5 @ 120", await read(SYM), { qty: 15, avg: 105.25, pnl: 71.25 })

// 4. Oversized sell clamps to what is held.
await sell(SYM, 100, 130)
step("sell 100 @ 130 clamps to 15", await read(SYM), { qty: 0, avg: 105.25, pnl: 440.0 })

// 5. The deliberate behaviour change: a sell against a closed position moves
//    nothing. Previously this charged commission and fees to realized_pnl.
await sell(SYM, 5, 140)
step("sell against closed position is a no-op", await read(SYM), { qty: 0, avg: 105.25, pnl: 440.0 })

// 6. Re-opening a closed position keeps the P&L already banked on it.
await buy(SYM, 5, 90)
step("re-open keeps realized_pnl", await read(SYM), { qty: 5, avg: 90.5, pnl: 440.0 })

// 7. Sell against a symbol that was never held: no row created, no error.
const NEVER = `ZZN${Date.now() % 100000}`
await sell(NEVER, 5, 100)
console.log(
  `  ${(await read(NEVER)) === null ? "PASS" : "FAIL"}  sell on missing position creates nothing`,
)
ok = (await read(NEVER)) === null && ok

// 8. Concurrency: N simultaneous first buys of a brand-new symbol. The old
//    SELECT-then-INSERT lost updates here and could insert twice.
const RACE = `ZZR${Date.now() % 100000}`
const N = 25
const settled = await Promise.allSettled(
  Array.from({ length: N }, () => buy(RACE, 2, 50)),
)
const failed = settled.filter((s) => s.status === "rejected")
const raced = await read(RACE)
// Every buy is 2 shares at 50 plus 2.50 costs, so the blended basis is
// (2*50 + 2.5) / 2 = 51.25 regardless of interleaving.
const rows = await sql`
  SELECT COUNT(*)::int AS n FROM positions WHERE account_id = ${ACCOUNT_ID} AND symbol = ${RACE}
`
console.log(
  `\n  ${failed.length === 0 ? "PASS" : "FAIL"}  ${N} concurrent first buys: ${failed.length} errors`,
)
console.log(`  ${rows[0].n === 1 ? "PASS" : "FAIL"}  exactly one row exists — got ${rows[0].n}`)
ok = failed.length === 0 && rows[0].n === 1 && ok
step(`${N} concurrent buys of 2 @ 50 accumulate`, raced, { qty: N * 2, avg: 51.25, pnl: 0 })

console.log(`\n${ok ? "ALL CHECKS PASSED" : "FAILURES PRESENT"}\n`)
process.exit(ok ? 0 : 1)
