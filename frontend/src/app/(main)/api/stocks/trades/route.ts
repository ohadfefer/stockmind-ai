import { NextResponse } from "next/server"
import WebSocket from "ws"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "FINNHUB_API_KEY not configured" },
      { status: 500 }
    )
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
}
