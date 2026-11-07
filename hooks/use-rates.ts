"use client"

import { useEffect, useState } from "react"
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

// Failed requests are retried a few times before the error is shown.
const RETRY_INTERVAL = 3 * 1000
const RETRY_COUNT = 3

const isValid = (snapshot?: RatesSnapshot): snapshot is RatesSnapshot =>
  Boolean(snapshot?.rates && snapshot.updatedAt)

const isNewer = (a: RatesSnapshot, b?: RatesSnapshot) =>
  !isValid(b) || Date.parse(a.updatedAt) > Date.parse(b.updatedAt)

// The server answers "STALE" when it served the previous version of /api/rates
// and is regenerating it in the background: x-vercel-cache on Vercel,
// x-nextjs-cache with `next start`. Neither tells when regeneration fails,
// the server just keeps serving the last good version.
const isRegenerating = (response: Response) =>
  (response.headers.get("x-vercel-cache") ??
    response.headers.get("x-nextjs-cache")) === "STALE"

// Without a network fetch itself throws a TypeError. A STALE response is
// treated as a failed one, so SWR asks again until the fresh rates are ready.
const fetcher = async (url: string): Promise<RatesSnapshot> => {
  const response = await fetch(url)

  if (!response.ok) {
    const error = new Error(`Failed to fetch rates: ${response.status}`)
    // error.info = await response.json()
    // error.status = response.status
    throw error
  }

  if (isRegenerating(response)) {
    throw new Error("Rates are being regenerated")
  }

  return response.json()
}

// Rates live in the SWR cache, which is persisted to localStorage (see
// SWRProvider), so the last known rates are available offline. SWR refreshes
// them on focus and when the network is back.
export function useRates(initial: RatesSnapshot): RatesSnapshot & {
  // The last request failed and all its retries too. Kept until a request
  // succeeds.
  error: Error | undefined
} {
  const { cache } = useSWRConfig()
  // SWR keeps the error while it retries, this tells when it gave up.
  const [hasGivenUp, setHasGivenUp] = useState(false)
  const { data, error, mutate } = useSWR(RATES_KEY, fetcher, {
    fallbackData: initial,
    dedupingInterval: REFRESH_INTERVAL,
    focusThrottleInterval: REFRESH_INTERVAL,
    // SWR calls it only in a visible tab with a network.
    onErrorRetry: (_error, _key, _config, revalidate, { retryCount }) => {
      if (retryCount > RETRY_COUNT) {
        setHasGivenUp(true)
        return
      }

      setTimeout(() => revalidate({ retryCount }), RETRY_INTERVAL)
    },
    onSuccess: () => setHasGivenUp(false),
  })

  // The server-rendered rates can be newer than the persisted ones, e.g. after
  // a deploy or when the cache is empty.
  useEffect(() => {
    if (isNewer(initial, cache.get(RATES_KEY)?.data)) {
      mutate(initial, { revalidate: false })
    }
  }, [cache, initial, mutate])

  const snapshot = isNewer(initial, data) ? initial : data

  return { ...snapshot, error: hasGivenUp ? error : undefined }
}
