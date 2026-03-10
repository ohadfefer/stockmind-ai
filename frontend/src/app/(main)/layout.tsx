import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { auth0 } from "@/lib/auth0"
import { getUserName } from "@/services/user-service"

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
