import { withAuth } from "@/lib/http/with-auth"
import { internal, invalid } from "@/lib/http/problem"
import { isValidSymbol } from "@/lib/symbol"
import WebSocket from "ws"

export const runtime = "nodejs"

/**
 * Server-sent trade ticks, proxied off Finnhub's websocket.
 *
 * withAuth, not withAccount — market data, no account state. EventSource
 * cannot set headers but does send same-origin cookies, so the session
 * reaches the wrapper the same way it does on any other route; a 401 surfaces
 * to the client as `onerror`, which LivePrice already handles by closing.
 *
 * The stream body is deliberately outside guard's reach: guard only covers
 * producing the Response, and everything below happens after it is returned.
 *
 * KNOWN BUG, left alone on purpose: `cleanup()` on the error path is followed
 * by controller.close(), and the ws "close" handler then closes it a second
 * time — a process-level uncaughtException on every navigation away from
 * /details/[symbol]. It is unrelated to the auth sweep and wants its own commit.
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
  const stream = new ReadableStream({
    start(controller) {
      const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`)

      const cleanup = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "unsubscribe", symbol }))
          ws.close()
        }
      }

      ws.on("open", () => {
        ws.send(JSON.stringify({ type: "subscribe", symbol }))
      })

      ws.on("message", (data) => {
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

      ws.on("error", () => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "WebSocket error" })}\n\n`)
        )
        cleanup()
        controller.close()
      })

      ws.on("close", () => {
        controller.close()
      })

      request.signal.addEventListener("abort", cleanup)
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
