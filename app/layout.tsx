import "@/styles/globals.css"

import { ReactNode } from "react"
import { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { MotionConfig } from "framer-motion"
import { ThemeProvider } from "next-themes"

import "react-loading-skeleton/dist/skeleton.css"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { SkeletonTheme } from "@/components/ui/adaptive-skeleton-theme"
import { TailwindIndicator } from "@/components/tailwind-indicator"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },

  description: siteConfig.description,

  appleWebApp: {
    title: siteConfig.shortName,
  },
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(240 4.8% 95.9%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(0, 0%, 11%)" },
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
            "bg-muted min-h-dvh font-sans antialiased transition-colors duration-300",
            geist.variable,
            geistMono.variable
          )}
        >
          <MotionConfig reducedMotion="user">
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <SkeletonTheme
                baseColor="hsl(var(--skeleton-bg))"
                highlightColor="hsl(var(--skeleton-highlight))"
              >
                <div
                  vaul-drawer-wrapper=""
                  className="bg-muted relative flex min-h-dvh flex-col rounded-md"
                >
                  <div className="flex-1">{children}</div>
                </div>
                <TailwindIndicator />
              </SkeletonTheme>
            </ThemeProvider>
          </MotionConfig>
          <Analytics />
        </body>
      </html>
    </>
  )
}
