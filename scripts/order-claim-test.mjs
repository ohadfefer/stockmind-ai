#!/usr/bin/env node
/**
 * Manual harness for the two trade-integrity fixes. Not an automated test — the
 * project has no test runner. Run against a disposable Neon branch; it writes
 * real orders and refuses to start without --confirm-throwaway.
 *
 * Covers:
 *  - claimPendingOrder is a compare-and-set, so replaying one orderId settles
 *    it exactly once no matter how many requests arrive together;
 *  - the migration 028 CHECK constraints reject negative quantities even when
 *    route validation is bypassed entirely (this writes raw SQL, so there is no
 *    application code in the way).
 *
 *   DATABASE_URL=... node scripts/order-claim-test.mjs --account=1 --confirm-throwaway
 */

import { neon } from "../frontend/node_modules/@neondatabase/serverless/index.mjs"

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=")
    return [k, v ?? true]
  }),
)

const ACCOUNT_ID = Number(args.account)
const N = Number(args.n ?? 25)
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("DATABASE_URL is required")
if (!Number.isInteger(ACCOUNT_ID)) throw new Error("--account=<id> is required")

let target
try {
  target = new URL(DATABASE_URL).host
} catch {
  throw new Error("DATABASE_URL is not a valid connection string")
}
if (!args["confirm-throwaway"]) {
  console.error(
    `\nRefusing to run against ${target}\n\n` +
      `  This writes orders and executions and does not clean them up.\n\n` +
      `  Point DATABASE_URL at a disposable Neon branch, then re-run with:\n\n` +
      `    --confirm-throwaway\n`,
  )
  process.exit(1)
}

console.log(`target: ${target}`)
const sql = neon(DATABASE_URL)

let ok = true
const check = (label, pass, detail) => {
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`)
  ok = pass && ok
}

/** Copied from claimPendingOrder in order-service.ts. */
async function claim(orderId, fillPrice) {
  const rows = await sql`
    UPDATE orders
    SET status = 'filled',
        filled_quantity = quantity,
        average_fill_price = ${fillPrice},
        filled_at = NOW()
    WHERE id = ${orderId} AND account_id = ${ACCOUNT_ID} AND status = 'pending'
    RETURNING symbol, side, quantity
  `
  return rows.length > 0 ? rows[0] : null
}

console.log(`\naccount=${ACCOUNT_ID} concurrent-claims=${N}\n`)

// --- 1. Replay: N simultaneous claims of one pending order -------------------
const created = await sql`
  INSERT INTO orders (account_id, symbol, side, order_type, quantity, average_fill_price)
  VALUES (${ACCOUNT_ID}, 'ZCLAIM', 'buy', 'market', 10, 100)
  RETURNING id
`
const orderId = created[0].id

const settled = await Promise.allSettled(
  Array.from({ length: N }, () => claim(orderId, 150)),
)
const failed = settled.filter((s) => s.status === "rejected")
const winners = settled.filter((s) => s.status === "fulfilled" && s.value !== null)

check("no claim threw", failed.length === 0, `${failed.length} errors`)
check(
  `exactly one of ${N} concurrent claims wins`,
  winners.length === 1,
  `${winners.length} claims returned a row`,
)
check(
  "winner reads terms from the order row, not the caller",
  winners[0]?.value?.symbol === "ZCLAIM" && Number(winners[0]?.value?.quantity) === 10,
  `got symbol=${winners[0]?.value?.symbol} qty=${winners[0]?.value?.quantity}`,
)

const after = await sql`SELECT status FROM orders WHERE id = ${orderId}`
check("order ends up filled", after[0].status === "filled", `status=${after[0].status}`)

// A later replay, after the order has settled, must also find nothing to claim.
check("post-settlement replay claims nothing", (await claim(orderId, 150)) === null)

// --- 2. CHECK constraints, bypassing all application code --------------------
const rejects = async (label, fn) => {
  try {
    await fn()
    check(label, false, "insert succeeded — constraint missing")
  } catch (err) {
    const code = err?.code ?? err?.sourceError?.code
    check(label, code === "23514", `sqlstate ${code ?? "unknown"}`)
  }
}

console.log("")
await rejects("orders rejects negative quantity", () => sql`
  INSERT INTO orders (account_id, symbol, side, order_type, quantity, average_fill_price)
  VALUES (${ACCOUNT_ID}, 'ZNEG', 'buy', 'market', -1000, 150)
`)

await rejects("executions rejects negative quantity", () => sql`
  INSERT INTO executions (order_id, account_id, symbol, side, quantity, price, commission, fees)
  VALUES (${orderId}, ${ACCOUNT_ID}, 'ZNEG', 'buy', -1000, 150, 2.00, 0.50)
`)

await rejects("positions rejects negative quantity", () => sql`
  INSERT INTO positions (account_id, symbol, quantity, average_cost_basis, realized_pnl)
  VALUES (${ACCOUNT_ID}, 'ZNEG', -1000, 150, 0)
`)

console.log(`\n${ok ? "ALL CHECKS PASSED" : "FAILURES PRESENT"}\n`)
process.exit(ok ? 0 : 1)
