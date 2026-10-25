import { PropsWithChildren } from "react"

import { FadeArc } from "@/components/ui/fade-arc"

export type IndicatorState = "success" | "warning" | "error" | "default"

export type IndicatorColors = Record<IndicatorState, string>

export interface IndicatorProps {
  state: IndicatorState
  indicatorColors?: IndicatorColors
  loading?: boolean
}

export function Indicator({
  state = "default",
  indicatorColors,
  loading = false,
  children,
}: PropsWithChildren<IndicatorProps>) {
  const statusColors: IndicatorColors = {
    success: "bg-green-300",
    error: "bg-red-400",
    warning: "bg-orange-300",
    default: "bg-gray-300",
  }

  const color = indicatorColors?.[state] || statusColors[state]

  return (
    <div className="flex items-center">
      {loading ? (
        <FadeArc
          role="presentation"
          aria-hidden
          className="mr-2 size-3 motion-reduce:!animate-none"
        />
      ) : (
        <div className={`mr-2 size-2.5 rounded-full ${color}`} />
      )}
      {children && <span className="pr-1 text-sm font-medium">{children}</span>}
    </div>
  )
}
