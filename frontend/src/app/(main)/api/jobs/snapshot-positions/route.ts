import { snapshotAllPositions } from "@/services/position/position-history-service"
import { NextResponse } from "next/server"
import { Receiver } from "@upstash/qstash"

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

export async function POST(request: Request) {
  // Verify QStash signature
  const signature = request.headers.get("upstash-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 })
  }

  const body = await request.text()
  const isValid = await receiver.verify({ signature, body }).catch(() => false)
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    const result = await snapshotAllPositions()
    return NextResponse.json({
      ok: true,
      snapshotCount: result.snapshotCount,
      errors: result.errors,
    })
  } catch (error) {
    console.error("Snapshot positions job failed:", error)
    return NextResponse.json(
      { error: "Snapshot job failed" },
      { status: 500 }
    )
  }
}
