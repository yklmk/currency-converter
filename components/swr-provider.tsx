"use client"

import { PropsWithChildren } from "react"
import { SWRConfig } from "swr"

import { localStorageProvider } from "@/lib/swr-cache"

export function SWRProvider({ children }: PropsWithChildren) {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>{children}</SWRConfig>
  )
}
