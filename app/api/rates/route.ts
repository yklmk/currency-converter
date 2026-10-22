import { fetchRates } from "@/lib/api"

// Must be a literal, keep in sync with RATES_REVALIDATE.
export const revalidate = 21600

export async function GET() {
  const { rates, updatedAt } = await fetchRates()

  return Response.json({ rates, updatedAt })
}
