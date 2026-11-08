"use client"

import { useEffect } from "react"
import { Moon, SunMedium } from "lucide-react"
import { AnimatePresence, motion, type Transition } from "motion/react"
import { useTheme } from "next-themes"
import { useIsClient } from "usehooks-ts"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"

const iconTransition: Transition = { type: "spring", duration: 0.3, bounce: 0 }

const iconMotion = {
  initial: { opacity: 0, scale: 0.5, filter: "blur(2px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.5, filter: "blur(2px)" },
  transition: iconTransition,
}

// Two states over a three-state model: the button flips to the opposite of
// what is shown. When that matches the OS, the override is dropped and the
// theme follows the system again; otherwise the choice is pinned.
export function ThemeToggle() {
  const { resolvedTheme, systemTheme, setTheme } = useTheme()
  const isClient = useIsClient()

  const isDark = resolvedTheme === "dark"
  const target = isDark ? "light" : "dark"

  useEffect(() => {
    if (!resolvedTheme) {
      return
    }

    const color = isDark
      ? siteConfig.themeColor.dark
      : siteConfig.themeColor.light
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", color))
  }, [resolvedTheme, isDark])

  const onToggle = () => {
    setTheme(target === systemTheme ? "system" : target)
  }

  return (
    <Button
      size="icon"
      variant="outline"
      aria-label={isClient ? `Switch to ${target} theme` : "Toggle theme"}
      onClick={onToggle}
    >
      <span className="grid *:col-start-1 *:row-start-1">
        <AnimatePresence initial={false}>
          {isClient && (
            <motion.span key={resolvedTheme} {...iconMotion}>
              {isDark ? <Moon /> : <SunMedium />}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </Button>
  )
}
