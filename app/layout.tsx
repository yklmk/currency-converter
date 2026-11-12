import "@/styles/globals.css"

import { ReactNode } from "react"
import { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { MotionConfig } from "motion/react"
import { ThemeProvider } from "next-themes"
import { SkulletProvider } from "skullet/react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { ServiceWorkerUpdater } from "@/components/service-worker-updater"
import { SWRProvider } from "@/components/swr-provider"
import { TailwindIndicator } from "@/components/tailwind-indicator"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  appleWebApp: {
    title: siteConfig.shortName,
  },
  icons: {
    icon: [
      {
        url: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        url: "/icons/favicon.ico",
        sizes: "256x256",
        type: "image/x-icon",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: siteConfig.name,
    locale: "en-US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
  },
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: siteConfig.themeColor.light,
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: siteConfig.themeColor.dark,
    },
  ],
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  fallback: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  fallback: [
    "Menlo",
    "Monaco",
    "Lucida Console",
    '"Liberation Mono"',
    '"Courier New"',
    "monospace",
  ],
})

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "min-h-dvh bg-muted font-sans antialiased",
            geist.variable,
            geistMono.variable
          )}
        >
          <MotionConfig reducedMotion="user">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SkulletProvider>
                <div
                  vaul-drawer-wrapper=""
                  className="relative flex min-h-dvh flex-col rounded-md bg-muted pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
                >
                  <div className="flex-1">
                    <SWRProvider>{children}</SWRProvider>
                  </div>
                </div>
                <TailwindIndicator />
              </SkulletProvider>
            </ThemeProvider>
          </MotionConfig>
          {process.env.NODE_ENV === "production" && <Analytics />}
          <ServiceWorkerUpdater />
        </body>
      </html>
    </>
  )
}
