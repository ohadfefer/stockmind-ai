import { auth0 } from "@/lib/auth0"
import { getDb } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth0.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fullName } = await request.json()

  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 })
  }

  const { sub: auth0Id, email, picture } = session.user
  const sql = getDb()

  try {
    await sql`
      INSERT INTO users (auth0_id, email, full_name, image_url)
      VALUES (${auth0Id}, ${email}, ${fullName.trim()}, ${picture ?? null})
      ON CONFLICT (auth0_id) DO UPDATE
      SET full_name = ${fullName.trim()}, updated_at = NOW()
    `
    return NextResponse.json({ status: "saved" })
  } catch (error) {
    console.error("Failed to save user:", error)
    return NextResponse.json(
      { error: "Failed to save user" },
      { status: 500 }
    )
  }
}
