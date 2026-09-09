import { neon, neonConfig, Pool, type PoolClient } from "@neondatabase/serverless"
import ws from "ws"

/**
 * Two ways to reach Postgres, for two different jobs.
 *
 *   getDb()          — neon() over HTTP. Stateless, one statement per request,
 *                      no connection to manage. The right tool for the ~78
 *                      single-statement reads and writes across services/.
 *   withTransaction() — a pooled WebSocket session held open for a real
 *                      BEGIN … COMMIT. The only way to run several statements
 *                      atomically when a later one needs a value the earlier
 *                      one returned.
 *
 * Prefer getDb(). Reach for withTransaction only when statements must commit or
 * roll back together, and keep network I/O (Finnhub, Stripe, xAI) outside the
 * callback — a held transaction occupies a PgBouncer server slot for its whole
 * duration.
 */

// Only needed on Node 21 and below, where there is no global WebSocket. `ws` is
// already a dependency (api/stocks/trades uses it for the Finnhub feed), so
// setting it explicitly costs nothing and decouples the pool from the Node
// version — package.json still allows >=20, and the driver would otherwise fail
// at connect time rather than at build time.
neonConfig.webSocketConstructor = ws

export function getDb() {
  return neon(process.env.DATABASE_URL!)
}

/**
 * A tagged-template query function, deliberately shaped like the one getDb()
 * returns: `sql\`SELECT … ${value}\`` resolving to an array of rows.
 *
 * That shape is the point. A service that takes an SqlTag instead of calling
 * getDb() itself runs unmodified on either driver — the SQL, the interpolations
 * and the casts all stay exactly as written, and only the line that obtains the
 * tag changes.
 */
export type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>

/*
 * Retry policy for serializable transactions.
 *
 * Measured against a Neon branch when this lived in appendLedgerEntry: 50
 * concurrent appends to one account settle clean with ~39 needing a retry,
 * while 100 exhausted a 5-attempt budget for 2 of them. Real contention here is
 * a user double-clicking Buy — 2 or 3 — so 5 was already ample, but the budget
 * widens almost for free once the backoff is capped, and exhaustion surfaces to
 * the caller as a failed trade.
 */
export const SERIALIZABLE_MAX_ATTEMPTS = 8
const BASE_BACKOFF_MS = 10
// Uncapped exponential reaches ~1.3s on the 8th attempt for no benefit: these
// aborts clear in milliseconds, so waiting longer only adds tail latency.
const MAX_BACKOFF_MS = 100

/*
 * 40001 = serialization_failure (SSI abort), 40P01 = deadlock_detected. Both
 * mean the transaction left no trace and can be replayed from BEGIN.
 *
 * Connection errors (57P01 admin_shutdown, 08006 connection_failure) are
 * deliberately absent even though Neon's resilience guide lists them as
 * transient. They are transient but *ambiguous*: the COMMIT may have landed
 * with only its acknowledgement lost, so replaying can double-book a trade.
 * These two codes are the only ones that promise nothing was written.
 */
const RETRYABLE_SQLSTATES = new Set(["40001", "40P01"])

type PgErrorFields = { code?: unknown; constraint?: unknown; sourceError?: unknown }

/**
 * NeonDbError exposes `code` and `constraint` at the top level, but a wrapped
 * driver error can carry them one level down on `sourceError`. Check both.
 */
export function pgField(err: unknown, field: "code" | "constraint"): string | undefined {
  if (typeof err !== "object" || err === null) return undefined
  const top = (err as PgErrorFields)[field]
  if (typeof top === "string") return top
  const source = (err as PgErrorFields).sourceError
  if (typeof source === "object" && source !== null) {
    const nested = (source as PgErrorFields)[field]
    if (typeof nested === "string") return nested
  }
  return undefined
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * True only for aborts that guarantee the transaction left no trace, so the
 * same work can be re-sent. An error with no SQLSTATE at all — a thrown
 * sentinel from a callback, say — is never retryable.
 */
export function isRetryableSerializationError(err: unknown): boolean {
  const sqlState = pgField(err, "code")
  return sqlState !== undefined && RETRYABLE_SQLSTATES.has(sqlState)
}

/** Jittered: two contenders retrying on the same schedule collide again. */
export function serializableBackoff(attempt: number): number {
  const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS)
  return Math.round(backoff * (0.5 + Math.random()))
}

/*
 * One pool for the process, not one per request.
 *
 * The driver's README warns against creating a Pool outside the request handler
 * — that advice is for serverless functions, where the runtime can freeze or
 * discard the isolate between invocations. This app is a long-lived container
 * (`node server.js` on ECS Fargate), so a module-level pool is the whole point:
 * WebSocket sessions get reused instead of being dialled per settlement.
 *
 * Parked on globalThis because `next dev` re-evaluates modules on every HMR
 * pass, which would otherwise leak a pool per edit.
 */
const globalForPool = globalThis as typeof globalThis & {
  __stockmindPool?: Pool
}

function getPool(): Pool {
  if (!globalForPool.__stockmindPool) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      // DATABASE_URL already points at the -pooler host, so this sits behind
      // PgBouncer in transaction mode. That supports interactive BEGIN … COMMIT
      // (a transaction holds one server connection for its duration); what it
      // does not support is session state *between* transactions — no SET, no
      // LISTEN, no session-level advisory locks. Nothing here wants any.
      max: 5,
      // A Neon compute can cold-start after scale-to-zero. The resilience guide
      // puts that at a few hundred ms, rarely seconds — 1s would fail before
      // the compute is ready.
      connectionTimeoutMillis: 15_000,
      // Let idle sessions drain so scale-to-zero can still suspend the compute.
      // Holding connections open indefinitely keeps it awake and billing.
      idleTimeoutMillis: 30_000,
    })

    // Mandatory, not defensive: an idle client that emits an error with no
    // listener attached is an unhandled 'error' event, which takes the whole
    // Node process down.
    //
    // Log err.stack, never err. Before emitting this event pg attaches the
    // failing client to the error (`err.client = client`), and that client
    // carries config.connectionString — the DATABASE_URL password in clear
    // text. console.error(err) expands it at Node's *default* inspect depth, so
    // the credential lands in CloudWatch. err.stack is message plus frames and
    // carries none of the error's own properties.
    pool.on("error", (err: Error) => {
      console.error("[db] idle pool client error:", err.stack ?? err.message)
    })

    globalForPool.__stockmindPool = pool
  }
  return globalForPool.__stockmindPool
}

/**
 * Builds the tagged-template function handed to a withTransaction callback.
 *
 * `live` is read through a closure rather than captured by value so the tag
 * dies with its transaction: a reference that outlives the callback would
 * otherwise fire a query on a client that has been released back to the pool
 * and may already be mid-transaction for someone else.
 */
function transactionTag(client: PoolClient, isLive: () => boolean): SqlTag {
  return (strings, ...values) => {
    if (!isLive()) {
      throw new Error("db: transaction tag used after its transaction ended")
    }
    let text = strings[0]
    for (let i = 0; i < values.length; i++) {
      text += `$${i + 1}${strings[i + 1]}`
    }
    return client.query(text, values).then((result) => result.rows)
  }
}

/**
 * Runs `fn` inside a single SERIALIZABLE transaction, retrying the whole thing
 * on a serialization abort.
 *
 * Retrying the *callback* rather than a statement is the only correct shape.
 * An SSI abort rolls the entire transaction back, so there is no session left
 * to re-send one statement into; replaying from BEGIN is the protocol. Two
 * consequences the callback has to respect:
 *
 *   - It may run up to MAX_ATTEMPTS times, so it must hold nothing but SQL. No
 *     network calls, no counters, no cache writes — those go after the commit,
 *     where they happen once and only if the data actually landed.
 *   - It must not swallow a query error and carry on. Postgres refuses every
 *     command after an error until ROLLBACK, so a caught-and-ignored failure
 *     turns the eventual COMMIT into a silent rollback: the caller is told the
 *     write succeeded and nothing was written.
 *
 * SERIALIZABLE rather than the default because the cash_ledger append derives
 * its running balance from the account's current tail, and only SSI stops two
 * concurrent appends from reading the same tail and both writing a wrong one.
 * See appendLedgerEntry in cash-ledger-service.ts for why weaker levels — and
 * REPEATABLE READ in particular — do not catch it.
 */
export async function withTransaction<T>(fn: (sql: SqlTag) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= SERIALIZABLE_MAX_ATTEMPTS; attempt++) {
    const client = await getPool().connect()
    let live = true
    // A client whose ROLLBACK failed is in an unknown state; it must be
    // destroyed rather than handed to the next caller.
    let broken = false
    // Which serialization abort sent us round again, logged after the client is
    // back in the pool.
    let abortCode: string | undefined

    // The pool's own error handler is attached on connect and removed again for
    // as long as a client is checked out (pg's _acquireClient), so for the whole
    // life of this transaction nothing is listening. An 'error' event with no
    // listener is an uncaught exception, which means a Neon compute restart or a
    // dropped WebSocket mid-settlement would take the process down instead of
    // failing one request. pool.on("error") does not cover this — it only sees
    // clients sitting idle in the pool.
    // err.stack, not err — same reason as the pool handler above. Nothing
    // attaches a client to this one today, but the two handlers should not
    // differ in how much of an error they are willing to print.
    const onClientError = (err: Error) => {
      console.error("[db] background error on an active client:", err.stack ?? err.message)
    }
    client.on("error", onClientError)

    try {
      await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE")
      // Transaction-scoped, so it survives PgBouncer's transaction pooling
      // where a plain SET would not. Caps how long a wedged statement can pin
      // a pooler server slot; every transaction here is a handful of indexed
      // writes, so 10s means "something is wrong", not "busy".
      await client.query("SET LOCAL statement_timeout = '10s'")

      const result = await fn(transactionTag(client, () => live))

      await client.query("COMMIT")
      return result
    } catch (err) {
      // Best effort. On a dropped connection this throws too, which is
      // expected and harmless — the server rolls back an uncommitted
      // transaction on its own when the session dies.
      try {
        await client.query("ROLLBACK")
      } catch {
        broken = true
      }

      if (
        !isRetryableSerializationError(err) ||
        attempt === SERIALIZABLE_MAX_ATTEMPTS
      ) {
        // Distinguish "contention beat us" from "some other query failed" —
        // both leave the caller with the same generic 500, and only this line
        // says which happened.
        if (isRetryableSerializationError(err)) {
          console.error(
            `[db] serialization abort persisted through ` +
              `${SERIALIZABLE_MAX_ATTEMPTS} attempts; giving up`,
          )
        }
        throw err
      }
      abortCode = pgField(err, "code")
      // Falls through to the backoff below, but only after `finally` has put
      // the connection back — see there.
    } finally {
      live = false
      // Before release: the pool re-attaches its own handler on release and
      // reuses the client, so leaving this one on would stack a listener per
      // checkout and trip MaxListenersExceededWarning.
      client.removeListener("error", onClientError)
      client.release(broken)
    }

    // Reachable only on a retryable abort, and deliberately outside the block
    // above: the client is already back in the pool, so backing off does not
    // hold a connection open. Under contention — the only time this runs —
    // that is the difference between waiting and blocking someone else.
    //
    // Logged because it is otherwise invisible. SERIALIZABLE here spans orders,
    // executions, cash_ledger and positions, so the false-positive abort rate
    // is higher than the figures measured when only the ledger append ran under
    // it; without this there is no way to tell one retry from seven.
    console.warn(
      `[db] ${abortCode} abort, retrying attempt ` +
        `${attempt + 1}/${SERIALIZABLE_MAX_ATTEMPTS}`,
    )
    await sleep(serializableBackoff(attempt))
  }

  // Unreachable — the final attempt either returns or rethrows. Here so the
  // loop can never fall through and report success having committed nothing.
  throw new Error(`withTransaction: exhausted ${SERIALIZABLE_MAX_ATTEMPTS} attempts`)
}
