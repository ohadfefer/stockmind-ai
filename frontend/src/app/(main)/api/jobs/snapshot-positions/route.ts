import { snapshotAllPositions } from "@/services/position-history-service"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron using the secret header
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
