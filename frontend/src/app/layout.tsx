import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Auth0Provider } from "@auth0/nextjs-auth0/client"
import { Analytics } from "@vercel/analytics/next"
import { auth0 } from "@/lib/auth0"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StockMind AI - Research Suite",
  description:
    "AI-powered stock research and analysis dashboard for smarter investing decisions",
}

export const viewport: Viewport = {
  themeColor: "#0A0B0D",
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
        <Analytics />
      </body>
    </html>
  )
}
