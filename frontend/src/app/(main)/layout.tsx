import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { auth0 } from "@/lib/auth0"
import { getDb } from "@/lib/db"

async function getUserName(auth0Id: string): Promise<string | null> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT full_name FROM users WHERE auth0_id = ${auth0Id}
    `
    return rows[0]?.full_name ?? null
  } catch {
    return null
  }
}

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth0.getSession()
  const user = session?.user ?? null

  const displayName = user ? await getUserName(user.sub) : undefined

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={displayName ?? undefined}
        userImage={user?.picture ?? undefined}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
