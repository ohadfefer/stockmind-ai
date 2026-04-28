import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { auth0 } from "@/lib/auth0"
import { getUserName } from "@/services/user-service"
import { getSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth0.getSession()
  const user = session?.user ?? null

  const [displayName, subscription] = user
    ? await Promise.all([
        getUserName(user.sub),
        getSubscriptionForAuth0Id(user.sub),
      ])
    : [undefined, null]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={displayName ?? undefined}
        userImage={user?.picture ?? undefined}
        userPlan={subscription?.plan}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
