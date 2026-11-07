import currencies from "@/helpers/currencies"

import { Rate, RatesData, RatesResponse } from "@/types/currency"
import ratesFixture from "@/lib/fixtures/rates.json"
import { createLogger, highlight } from "@/lib/log"

// How often the server refreshes rates from currencyapi, in seconds (6 hours).
export const RATES_REVALIDATE = 21600
export const RATES_TAG = "rates"

// Below this share of the monthly quota left, in percent, refreshes warn.
const LOW_QUOTA = 20

const log = createLogger("rates")

// Dev servers use the fixture to save the API quota. Set RATES_FIXTURE=1
// to use it elsewhere (local `pnpm preview`, Vercel Preview env).
const useFixture =
  process.env.NODE_ENV === "development" || process.env.RATES_FIXTURE === "1"

const normalizeRates = ({ data }: RatesResponse) =>
  Object.values(data).reduce((acc, { code, value }) => {
    return { ...acc, [code]: value.toFixed(2) }
  }, {} as Rate)

export const fetchRates = async (): Promise<RatesData> => {
  if (useFixture) {
    const fixture = ratesFixture as RatesResponse

    return {
      rates: normalizeRates(fixture),
      remainingQuota: 100,
      updatedAt: fixture.meta.last_updated_at,
    }
  }

  const currenciesCodes = currencies
    .map(({ currencyCode }) => currencyCode)
    .join(",")
  const response = await fetch(
    `https://api.currencyapi.com/v3/latest?currencies=${currenciesCodes}`,
    {
      headers: {
        apiKey: process.env.CURRENCY_API_KEY!,
      },
      next: { revalidate: RATES_REVALIDATE, tags: [RATES_TAG] },
    }
  )

  // Throwing keeps the last successful version in the cache instead of
  // caching empty rates from a 429/500 response.
  if (!response.ok) {
    log.error(
      `currencyapi responded ${response.status}: ${await response.text()}`
    )
    throw new Error(`currencyapi request failed: ${response.status}`)
  }

  const ratesResponse = (await response.json()) as RatesResponse

  const quota = response.headers.get("x-ratelimit-limit-quota-month")
  const remaining = response.headers.get("x-ratelimit-remaining-quota-month")
  const remainingQuota = (Number(remaining) / Number(quota)) * 100

  // updatedAt shows when currencyapi publishes new rates: the first log
  // with a new date tells the time.
  log.success(
    `refreshed, rates from ${highlight(ratesResponse.meta.last_updated_at)}, ${remaining} of ${quota} requests left this month`
  )

  if (remainingQuota < LOW_QUOTA) {
    log.warn(`only ${remaining} of ${quota} requests left this month`)
  }

  return {
    rates: normalizeRates(ratesResponse),
    remainingQuota,
    updatedAt: ratesResponse.meta.last_updated_at,
  }
}
