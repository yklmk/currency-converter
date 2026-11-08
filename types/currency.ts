import currencies from "@/helpers/currencies"

export type Currency = (typeof currencies)[number]
export type CurrencyCode = (typeof currencies)[number]["currencyCode"]
export type CountryCode = (typeof currencies)[number]["countryCode"]

export type Rate = Record<CurrencyCode, number>

export type RatesData = {
  rates: Rate
  remainingQuota: number
  updatedAt: string
}

export type RatesResponse = {
  meta: {
    last_updated_at: string
  }
  data: {
    [key in CurrencyCode]: {
      code: CurrencyCode
      value: number
    }
  }
}
