import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Auth0Provider } from "@auth0/nextjs-auth0/client"
import { Analytics } from "@vercel/analytics/next"
import { auth0 } from "@/lib/auth0"
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration"
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
  themeColor: "#0A0B0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <Analytics />
      </body>
    </html>
  )
}
