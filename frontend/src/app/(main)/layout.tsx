import { redirect } from "next/navigation"
import { Sidebar, type SidebarUserProps } from "@/components/sidebar"
import { Header } from "@/components/header"
import { MobileFooter } from "@/components/mobile/mobile-footer"
import { NavHistoryTracker } from "@/components/nav-history-tracker"
import { NavigationLoaderProvider } from "@/components/navigation-loader"
import { MainContainer } from "@/components/main-container"
import { auth0 } from "@/lib/auth0"
import { getShellUser } from "@/services/shell-user-service"
import { getSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth0.getSession()
  const user = session?.user ?? null
  const shellUser = user ? await getShellUser(user.sub) : null

  // A session can exist without a completed Neon users/account row (e.g. signup
  // that never finished onboarding). Such users have no DB-backed data and the
  // app breaks for them — route them back to onboarding until it's complete.
  if (user && !shellUser?.onboarded) {
    redirect("/onboarding")
  }

  const subscription = user ? await getSubscriptionForAuth0Id(user.sub) : null

  const userProps: SidebarUserProps = {
    userName: shellUser?.fullName,
    userImage: user?.picture ?? undefined,
    userPlan: subscription?.plan,
  }

  return (
    <NavigationLoaderProvider>
      <div className="flex h-dvh overflow-hidden">
        <NavHistoryTracker />
        <Sidebar {...userProps} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header {...userProps} />
          <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            <MainContainer>{children}</MainContainer>
          </main>
          <MobileFooter />
        </div>
      </div>
    </NavigationLoaderProvider>
  )
}
