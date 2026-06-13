import { NextResponse } from "next/server"

// Lightweight liveness probe for the ALB target group and Docker HEALTHCHECK.
// Intentionally does no I/O so a slow dependency never marks the task unhealthy.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json({ status: "ok" })
}
