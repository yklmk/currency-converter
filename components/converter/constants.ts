import { Currency } from "@/types/currency"

export const DEFAULT_CURRENCIES: Currency[] = [
  {
    currencyCode: "USD",
    currencyName: "US Dollar",
    countryCode: "US",
  },
  {
    currencyCode: "EUR",
    currencyName: "Euro",
    countryCode: "EU",
  },
  {
    currencyCode: "GBP",
    currencyName: "British Pound",
    countryCode: "GB",
  },
]

export const MIN_CURRENCIES = 2
export const MAX_AMOUNT_LENGTH = 10

// Row moves, the lifted row and the card height share one spring.
export const LAYOUT_SPRING = {
  type: "spring" as const,
  stiffness: 500,
  damping: 38,
  mass: 0.8,
}
