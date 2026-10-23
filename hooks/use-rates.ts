"use client"

import { useEffect } from "react"
import useSWR, { useSWRConfig } from "swr"

import { Rate } from "@/types/currency"

export type RatesSnapshot = {
  rates: Rate
  updatedAt: string
}

const RATES_KEY = "/api/rates"

// /api/rates is cached on the server, but there is no point in asking for it
// on every tab switch.
const REFRESH_INTERVAL = 10 * 60 * 1000

const isValid = (snapshot?: RatesSnapshot): snapshot is RatesSnapshot =>
  Boolean(snapshot?.rates && snapshot.updatedAt)

const isNewer = (a: RatesSnapshot, b?: RatesSnapshot) =>
  !isValid(b) || Date.parse(a.updatedAt) > Date.parse(b.updatedAt)

const fetcher = async (url: string): Promise<RatesSnapshot> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch rates: ${response.status}`)
  }

  return response.json()
}

// Rates live in the SWR cache, which is persisted to localStorage (see
// SWRProvider), so the last known rates are available offline. SWR refreshes
// them on focus and when the network is back.
export function useRates(initial: RatesSnapshot): RatesSnapshot {
  const { cache } = useSWRConfig()
  const { data, mutate } = useSWR(RATES_KEY, fetcher, {
    fallbackData: initial,
    dedupingInterval: REFRESH_INTERVAL,
    focusThrottleInterval: REFRESH_INTERVAL,
  })

  // The server-rendered rates can be newer than the persisted ones, e.g. after
  // a deploy or when the cache is empty.
  useEffect(() => {
    if (isNewer(initial, cache.get(RATES_KEY)?.data)) {
      mutate(initial, { revalidate: false })
    }
  }, [cache, initial, mutate])

  return isNewer(initial, data) ? initial : data
}
