"use client"

import { PropsWithChildren } from "react"
import { useReducedMotion } from "framer-motion"
import { SkeletonTheme as SkeletonThemeBase } from "react-loading-skeleton"

type SkeletonThemeProps = PropsWithChildren<{
  baseColor?: string
  highlightColor?: string
}>

export function SkeletonTheme({
  baseColor,
  highlightColor,
  children,
}: SkeletonThemeProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <SkeletonThemeBase
      baseColor={baseColor}
      highlightColor={highlightColor}
      enableAnimation={!prefersReducedMotion}
      duration={prefersReducedMotion ? 3.2 : 1.2}
    >
      {children}
    </SkeletonThemeBase>
  )
}
