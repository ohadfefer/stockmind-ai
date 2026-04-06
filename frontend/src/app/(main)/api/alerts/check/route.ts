import { NextResponse } from "next/server"
import { Receiver } from "@upstash/qstash"
import { checkAlerts } from "@/services/alerts/alert-checker-service"

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

  const result = await checkAlerts()
  return NextResponse.json(result)
}
