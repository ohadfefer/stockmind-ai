import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Auth0Provider } from "@auth0/nextjs-auth0/client"
import { Analytics } from "@vercel/analytics/next"
import { auth0 } from "@/lib/auth0"
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StockMind AI - Research Suite",
  description:
    "AI-powered stock research and analysis dashboard for smarter investing decisions",
  applicationName: "StockMind AI",
  appleWebApp: {
    capable: true,
    title: "StockMind AI",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Shrinks the layout viewport when the on-screen keyboard appears, so
  // `position: fixed; bottom: 0` bottom-sheets (mobile search + trade dialogs)
  // sit above the keyboard instead of being covered by it.
  interactiveWidget: "resizes-content",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth0.getSession()

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Auth0Provider user={session?.user}>
          {children}
        </Auth0Provider>
        <ServiceWorkerRegistration />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
