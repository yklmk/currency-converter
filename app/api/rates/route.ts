import { fetchRates } from "@/lib/api"

// Serve the response statically and regenerate it every 21600 seconds (6 hours),
// same as RATES_REVALIDATE.
export const revalidate = 21600

export async function GET() {
  const { rates, updatedAt } = await fetchRates()

  return Response.json({ rates, updatedAt })
}
