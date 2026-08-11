#!/usr/bin/env node
/**
 * Throwaway harness for the cash_ledger write-skew fix (migration 027).
 *
 * Manual harness, not an automated test — the project has no test runner. Run it
 * by hand against a disposable Neon branch; it writes real ledger rows and
 * refuses to start without --confirm-throwaway.
 *
 * Lives outside frontend/, which is the Docker build context, so it can never
 * reach a deployed image.
 *
 *   node scripts/cash-ledger-concurrency-test.mjs --mode=old --account=1 --n=20 --confirm-throwaway
 *   node scripts/cash-ledger-concurrency-test.mjs --mode=new --account=1 --n=20 --confirm-throwaway
 *
 *   DATABASE_URL          connection string for the branch under test
 *   --mode                `old` = pre-fix SELECT-then-INSERT, `new` = appendLedgerEntry
 *   --account             account_id to append to (must already exist)
 *   --n                   number of concurrent appends (default 20)
 *   --confirm-throwaway   required; confirms the target is disposable
 *
 * `old` is expected to FAIL. A fix you never watched fail is a fix you can't
 * defend.
 *
 * The SQL here is copied from src/services/cash-ledger-service.ts rather than
 * imported — the app module resolves `@/` through Next and pulls in server-only
 * dependencies. What is under test is the database-level strategy (single
 * statement, Serializable, retry, unique index), which is the part that can
 * actually be wrong.
 */

import { neon } from "../frontend/node_modules/@neondatabase/serverless/index.mjs"

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=")
    return [k, v ?? true]
  }),
)

const MODE = args.mode ?? "new"
const ACCOUNT_ID = Number(args.account)
const N = Number(args.n ?? 20)
const REF_BASE = Number(args.refbase ?? 900000)

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error("DATABASE_URL is required")
if (!Number.isInteger(ACCOUNT_ID)) throw new Error("--account=<id> is required")
if (MODE !== "old" && MODE !== "new") throw new Error("--mode must be 'old' or 'new'")

// This writes permanent rows to cash_ledger, and --mode=old writes deliberately
// corrupt ones. Migration 003 declares the table append-only — never update,
// never delete — so there is no sanctioned way to undo a run. DATABASE_URL is
// ambient, and a shell that has the production string exported looks exactly
// like one that doesn't, so refuse by default and make the operator name the
// target they are about to write to.
const target = new URL(DATABASE_URL).host
if (!args["confirm-throwaway"]) {
  console.error(
    `\nRefusing to run against ${target}\n\n` +
      `  This appends permanent rows to cash_ledger${MODE === "old" ? ", and --mode=old writes\n  knowingly corrupt ones" : ""}. The table is append-only, so a run\n` +
      `  against production cannot be cleaned up.\n\n` +
      `  Point DATABASE_URL at a disposable Neon branch, then re-run with:\n\n` +
      `    --confirm-throwaway\n`,
  )
  process.exit(1)
}

console.log(`target: ${target}`)
const sql = neon(DATABASE_URL)

/** Pre-fix path: read the tail, add in JS, insert. Two transactions, no lock. */
async function appendOld(accountId, amount, referenceId) {
  const balRows = await sql`
    SELECT running_balance FROM cash_ledger
    WHERE account_id = ${accountId}
    ORDER BY created_at DESC
    LIMIT 1
  `
  const current = balRows.length > 0 ? Number(balRows[0].running_balance) : 0
  const next = current + amount
  await sql`
    INSERT INTO cash_ledger (account_id, entry_type, amount, running_balance, reference_id, description)
    VALUES (${accountId}, 'trade_settlement', ${amount}, ${next}, ${referenceId}, 'harness')
  `
}

const RETRYABLE = new Set(["40001", "40P01"])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function pgField(err, field) {
  if (typeof err !== "object" || err === null) return undefined
  if (typeof err[field] === "string") return err[field]
  const source = err.sourceError
  if (typeof source === "object" && source !== null && typeof source[field] === "string") {
    return source[field]
  }
  return undefined
}

/** Post-fix path: mirrors appendLedgerEntry. Returns attempts used. */
async function appendNew(accountId, amount, referenceId) {
  const MAX_ATTEMPTS = 8
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const statement = sql`
        INSERT INTO cash_ledger (
          account_id, entry_type, amount, running_balance, reference_id, description
        )
        SELECT
          ${accountId}::int,
          'trade_settlement'::text,
          ${amount}::numeric(16,2),
          COALESCE(
            (SELECT running_balance FROM cash_ledger
             WHERE account_id = ${accountId}::int
               AND id = (SELECT MAX(id) FROM cash_ledger
                         WHERE account_id = ${accountId}::int)),
            0
          ) + ${amount}::numeric(16,2),
          ${referenceId}::int,
          'harness'::text
      `
      await sql.transaction([statement], { isolationLevel: "Serializable" })
      return attempt
    } catch (err) {
      const code = pgField(err, "code")
      if (code === "23505") {
        if (pgField(err, "constraint") === "uq_cash_ledger_ref") return attempt
        throw err
      }
      if (!code || !RETRYABLE.has(code) || attempt === MAX_ATTEMPTS) throw err
      await sleep(Math.round(Math.min(10 * 2 ** (attempt - 1), 100) * (0.5 + Math.random())))
    }
  }
  throw new Error("exhausted attempts")
}

async function snapshot(accountId) {
  const rows = await sql`
    SELECT
      COUNT(*)::int AS rows,
      COALESCE(SUM(amount), 0)::numeric(16,2) AS sum_amount,
      COALESCE(
        (SELECT running_balance FROM cash_ledger
         WHERE account_id = ${accountId} ORDER BY id DESC LIMIT 1),
        0
      )::numeric(16,2) AS tail_balance
    FROM cash_ledger
    WHERE account_id = ${accountId}
  `
  return {
    rows: rows[0].rows,
    sumAmount: Number(rows[0].sum_amount),
    tailBalance: Number(rows[0].tail_balance),
  }
}

async function invariantBreaks(accountId) {
  const rows = await sql`
    SELECT COUNT(*)::int AS broken FROM (
      SELECT
        amount,
        running_balance - COALESCE(
          LAG(running_balance) OVER (PARTITION BY account_id ORDER BY id), 0
        ) AS implied_amount
      FROM cash_ledger
      WHERE account_id = ${accountId}
    ) t
    WHERE implied_amount IS DISTINCT FROM amount
  `
  return rows[0].broken
}

const check = (label, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`)
  return ok
}

// The columns are numeric(16,2) and exact, but arithmetic on them here happens
// in JS doubles: 17253.44 - 16253.44 is 999.9999999999982. Compare in cents.
const cents = (n) => Math.round(n * 100)

// Alternating debits and credits, mirroring concurrent buys and sells.
const amounts = Array.from({ length: N }, (_, i) => (i % 2 === 0 ? -200 : 300))
const expectedDelta = amounts.reduce((a, b) => a + b, 0)

const before = await snapshot(ACCOUNT_ID)
console.log(`\nmode=${MODE} account=${ACCOUNT_ID} n=${N}`)
console.log(`before: rows=${before.rows} sum=${before.sumAmount} tail=${before.tailBalance}\n`)

const append = MODE === "old" ? appendOld : appendNew
const settled = await Promise.allSettled(
  amounts.map((amount, i) => append(ACCOUNT_ID, amount, REF_BASE + i)),
)
const failures = settled.filter((s) => s.status === "rejected")
const retried = settled.filter((s) => s.status === "fulfilled" && s.value > 1).length

const after = await snapshot(ACCOUNT_ID)
console.log(`after:  rows=${after.rows} sum=${after.sumAmount} tail=${after.tailBalance}`)
if (MODE === "new") console.log(`retries: ${retried}/${N} appends needed more than one attempt`)
if (failures.length) console.log(`errors:  ${failures.length} — ${failures[0].reason?.message}`)
console.log("")

let ok = true
ok = check("no append threw", failures.length === 0, `${failures.length} failed`) && ok
ok = check(`${N} rows written`, after.rows - before.rows === N, `got ${after.rows - before.rows}`) && ok
ok =
  check(
    "sum(amount) moved by the expected total",
    cents(after.sumAmount) - cents(before.sumAmount) === cents(expectedDelta),
    `got ${(cents(after.sumAmount) - cents(before.sumAmount)) / 100}, want ${expectedDelta}`,
  ) && ok
ok =
  check(
    "tail running_balance equals sum(amount)",
    cents(after.tailBalance) === cents(after.sumAmount),
    `tail ${after.tailBalance} vs sum ${after.sumAmount}`,
  ) && ok

const broken = await invariantBreaks(ACCOUNT_ID)
ok = check("ledger invariant holds", broken === 0, `${broken} rows disagree with their own amount`) && ok

// A retry after a committed write whose response was lost must not double-write.
if (MODE === "new") {
  const dupRef = REF_BASE + 10_000
  await Promise.allSettled([
    appendNew(ACCOUNT_ID, -50, dupRef),
    appendNew(ACCOUNT_ID, -50, dupRef),
  ])
  const dupRows = await sql`
    SELECT COUNT(*)::int AS n FROM cash_ledger
    WHERE account_id = ${ACCOUNT_ID} AND entry_type = 'trade_settlement' AND reference_id = ${dupRef}
  `
  ok = check("duplicate reference_id writes one row", dupRows[0].n === 1, `got ${dupRows[0].n}`) && ok
}

console.log(`\n${ok ? "ALL CHECKS PASSED" : "FAILURES PRESENT"}\n`)
process.exit(ok ? 0 : 1)
