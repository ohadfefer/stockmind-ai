import { withAuth } from "@/lib/http/with-auth"
import { internal, invalid } from "@/lib/http/problem"
import { isValidSymbol } from "@/lib/symbol"
import WebSocket from "ws"

export const runtime = "nodejs"
// Vercel's ceiling on the Hobby plan with Fluid compute. A stream can't
// outlive its function, so this bounds every connection.
export const maxDuration = 300

// End each stream this far inside maxDuration, so the browser sees a clean end
// and EventSource reconnects on its own, instead of the platform killing the
// function mid-write.
const STREAM_LIFETIME_MS = 280_000

/**
 * Server-sent trade ticks, proxied off Finnhub's websocket.
 *
 * withAuth, not withAccount — market data, no account state. EventSource
 * cannot set headers but does send same-origin cookies, so the session
 * reaches the wrapper the same way it does on any other route; a 401 surfaces
 * to the client as `onerror` with readyState CLOSED, which LivePrice handles
 * by giving up.
 *
 * The stream body is deliberately outside guard's reach: guard only covers
 * producing the Response, and everything below happens after it is returned.
 */
export const GET = withAuth(async (request) => {
  const symbol = new URL(request.url).searchParams.get("symbol")
  if (!isValidSymbol(symbol)) return invalid("Invalid symbol")

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    // Logged, not returned: naming the missing variable tells an unauthenticated
    // prober how the deployment is configured.
    console.error("[stocks/trades] FINNHUB_API_KEY is not set")
    return internal()
  }

  const encoder = new TextEncoder()
  let finish = () => {}
  const stream = new ReadableStream({
    start(controller) {
      const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`)
      let closed = false

      // The one way out, reached from every path: the lifetime timer, a
      // Finnhub error, Finnhub hanging up, the browser leaving. Idempotent
      // because those overlap — closing the controller a second time throws,
      // and with nothing to catch it that was an uncaughtException on every
      // navigation away from /details/[symbol]. On Fluid compute one instance
      // serves several requests, so a crash would take theirs down too.
      finish = () => {
        if (closed) return
        closed = true
        clearTimeout(lifetime)
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "unsubscribe", symbol }))
        }
        // Also while CONNECTING, which the old cleanup skipped: the socket
        // would finish its handshake and subscribe for a reader long gone.
        ws.close()
        try {
          controller.close()
        } catch {
          // The reader cancelled first; the stream is already closed.
        }
      }

      const lifetime = setTimeout(finish, STREAM_LIFETIME_MS)

      ws.on("open", () => {
        ws.send(JSON.stringify({ type: "subscribe", symbol }))
      })

      ws.on("message", (data) => {
        if (closed) return
        try {
          const parsed = JSON.parse(data.toString())
          if (parsed.type === "trade" && parsed.data?.length > 0) {
            const latest = parsed.data[parsed.data.length - 1]
            const event = `data: ${JSON.stringify({
              price: latest.p,
              volume: latest.v,
              timestamp: latest.t,
              symbol: latest.s,
            })}\n\n`
            controller.enqueue(encoder.encode(event))
          }
        } catch {
          // skip malformed messages
        }
      })

      // Also fires for the abort ws.close() causes during a handshake, which
      // `closed` filters out: that one is ours, not Finnhub's.
      ws.on("error", () => {
        if (closed) return
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "WebSocket error" })}\n\n`)
        )
        finish()
      })

      ws.on("close", () => finish())

      request.signal.addEventListener("abort", () => finish())
    },
    cancel() {
      finish()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
})
