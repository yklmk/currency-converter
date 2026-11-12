const DECIMAL_AMOUNT = /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/
const COMMA_GROUPED_AMOUNT = /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/
const DOT_GROUPED_AMOUNT = /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/

export function normalizePastedAmount(text: string): string | null {
  const value = text.trim().replace(/[ \u00a0\u202f]/g, "")

  // A single separator is decimal, including ambiguous values like "1,234".
  if (DECIMAL_AMOUNT.test(value)) {
    const normalized = value.replace(",", ".")
    return normalized.startsWith(".") ? `0${normalized}` : normalized
  }

  if (COMMA_GROUPED_AMOUNT.test(value)) {
    return value.replaceAll(",", "")
  }

  if (DOT_GROUPED_AMOUNT.test(value)) {
    return value.replaceAll(".", "").replace(",", ".")
  }

  return null
}
