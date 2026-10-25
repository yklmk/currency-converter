"use client"

import { useEffect } from "react"
import useSWR, { useSWRConfig } from "swr"

import { Rate } from "@/types/currency"

export type RatesSnapshot = {
  rates: Rate
  updatedAt: string
}

const RATES_KEY = "/api/rates"

// Minimum time between requests to /api/rates, in milliseconds (10 minutes).
// /api/rates is cached on the server, but there is no point in
// asking for it on every tab switch.
const REFRESH_INTERVAL = 10 * 60 * 1000

// Age after which rates are considered outdated, in milliseconds (48 hours).
// currencyapi updates rates once a day and the server refreshes them every 6h,
// so rates up to ~30h old are normal.
const STALE_AFTER = 48 * 60 * 60 * 1000

// How many times to ask again when the server answers with an outdated
// response it is regenerating (count, not time).
const STALE_RETRIES = 2

// Delay before the first retry, in milliseconds (2 seconds). Doubles on every
// retry: 2s, then 4s.
const STALE_RETRY_DELAY = 2 * 1000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isValid = (snapshot?: RatesSnapshot): snapshot is RatesSnapshot =>
  Boolean(snapshot?.rates && snapshot.updatedAt)

const isNewer = (a: RatesSnapshot, b?: RatesSnapshot) =>
  !isValid(b) || Date.parse(a.updatedAt) > Date.parse(b.updatedAt)

// The server answers "STALE" when it served the previous version of /api/rates
// and is regenerating it in the background: x-vercel-cache on Vercel,
// x-nextjs-cache with `next start`. The fresh version is ready a moment later,
// so ask again instead of keeping the outdated rates until the next refresh.
const isRegenerating = (response: Response) =>
  (response.headers.get("x-vercel-cache") ??
    response.headers.get("x-nextjs-cache")) === "STALE"

const fetcher = async (url: string): Promise<RatesSnapshot> => {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.status}`)
    }

    if (!isRegenerating(response) || attempt === STALE_RETRIES) {
      return response.json()
    }

    await wait(STALE_RETRY_DELAY * 2 ** attempt)
  }
}

// Rates live in the SWR cache, which is persisted to localStorage (see
// SWRProvider), so the last known rates are available offline. SWR refreshes
// them on focus and when the network is back.
export function useRates(
  initial: RatesSnapshot
): RatesSnapshot & { isStale: boolean; isValidating: boolean } {
  const { cache } = useSWRConfig()
  const { data, mutate, isValidating } = useSWR(RATES_KEY, fetcher, {
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

  const snapshot = isNewer(initial, data) ? initial : data
  const isStale = Date.now() - Date.parse(snapshot.updatedAt) > STALE_AFTER

  return { ...snapshot, isStale, isValidating }
}
