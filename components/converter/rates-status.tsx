"use client"

import { TriangleExclamationPoint } from "lucide-react"

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
})

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
})

// The time for today's rates and the day for older ones.
function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt)
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday ? timeFormat.format(date) : dayFormat.format(date)
}

interface RatesStatusProps {
  updatedAt: string
  // Kept only after all retries failed.
  error: Error | undefined
}

// Sits at the end of the heading line: one line of text, no taller than the
// heading, so showing it never moves the inputs. Shown when the server couldn't
// refresh the rates. Without a network fetch throws a TypeError: that says
// nothing about the rates, so it isn't shown.
export function RatesStatus({ updatedAt, error }: RatesStatusProps) {
  const isShown = Boolean(error) && !(error instanceof TypeError)

  return (
    // The live region stays mounted, so screen readers announce every change.
    <div
      role="status"
      className="mb-px flex h-4 min-w-0 flex-1 items-center justify-end gap-2 text-xs/4 font-medium whitespace-nowrap text-muted-foreground"
    >
      {isShown && (
        <>
          <TriangleExclamationPoint className="size-3.5 shrink-0 text-error" />
          Rates from {formatUpdatedAt(updatedAt)}
        </>
      )}
    </div>
  )
}
