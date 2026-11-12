import { PropsWithChildren, ReactElement, useLayoutEffect, useRef } from "react"
import { animate, motion, useMotionValue } from "motion/react"

import { cn } from "@/lib/utils"

import { LAYOUT_SPRING } from "./constants"

interface ContainerProps {
  className?: string
  animateHeight: boolean
}

export default function Container({
  className,
  animateHeight,
  children,
}: PropsWithChildren<ContainerProps>): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const height = useMotionValue<number | "auto">("auto")

  useLayoutEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) {
      return
    }

    const sync = (animated: boolean) => {
      // Target the final outer height, including its minimum and borders.
      const minHeight = parseFloat(getComputedStyle(container).minHeight) || 0
      const borderHeight = container.offsetHeight - container.clientHeight
      // Layout height excludes Vaul's background scale.
      const target = Math.max(minHeight, content.offsetHeight + borderHeight)
      if (target === height.get()) {
        return
      }

      if (animated) {
        // Retarget from the live height. Sharing the rows' spring keeps the
        // card's edge moving in step with the last row.
        animate(height, target, LAYOUT_SPRING)
      } else {
        height.jump(target)
      }
    }

    // Only later content changes animate; the height in place when this runs
    // is adopted as is.
    sync(false)
    // Observe natural content, never the surface whose height is animated.
    const observer = new ResizeObserver(() => sync(animateHeight))
    observer.observe(content)
    return () => {
      observer.disconnect()
      height.stop()
    }
  }, [height, animateHeight])

  return (
    <motion.div
      ref={containerRef}
      style={{ height }}
      className={cn(
        "relative flex min-h-125 w-full max-w-125 flex-col rounded-[calc(var(--radius-lg)+(--spacing(2))+1px)] border border-transparent bg-background smooth-shadow-ring-md",
        className
      )}
    >
      <div ref={contentRef} className="flex shrink-0 flex-col">
        {children}
      </div>
    </motion.div>
  )
}
