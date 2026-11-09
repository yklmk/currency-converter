import type { Amounts, CurrencyCode, Rate } from "@/types/currency"

export interface CurrencyAmount {
  currencyCode: CurrencyCode
  value: string
}

export function convertAmounts(
  rates: Rate,
  input: CurrencyAmount | null
): Amounts {
  const amounts: Amounts = {}

  for (const currencyCode of Object.keys(rates) as CurrencyCode[]) {
    const amount = input
      ? (Number(input.value) / rates[input.currencyCode]) * rates[currencyCode]
      : rates[currencyCode]

    amounts[currencyCode] = amount.toFixed(2)
  }

  if (input) {
    amounts[input.currencyCode] = input.value
  }

  return amounts
}
