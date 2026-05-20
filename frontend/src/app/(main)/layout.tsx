import { redirect } from "next/navigation"
import { Sidebar, type SidebarUserProps } from "@/components/sidebar"
import { Header } from "@/components/header"
import { auth0 } from "@/lib/auth0"
import { getUserName, isUserOnboarded } from "@/services/user-service"
import { getSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth0.getSession()
  const user = session?.user ?? null

  // A session can exist without a completed Neon users/account row (e.g. signup
  // that never finished onboarding). Such users have no DB-backed data and the
  // app breaks for them — route them back to onboarding until it's complete.
  if (user && !(await isUserOnboarded(user.sub))) {
    redirect("/onboarding")
  }

  const [displayName, subscription] = user
    ? await Promise.all([
        getUserName(user.sub),
        getSubscriptionForAuth0Id(user.sub),
      ])
    : [undefined, null]

  const userProps: SidebarUserProps = {
    userName: displayName ?? undefined,
    userImage: user?.picture ?? undefined,
    userPlan: subscription?.plan,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar {...userProps} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header {...userProps} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
