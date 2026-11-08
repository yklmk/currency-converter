import ConverterWidget from "@/app/components/converter-widget"

// Regenerate the page every 21600 seconds (6 hours), same as RATES_REVALIDATE.
export const revalidate = 21600

export default async function IndexPage() {
  return (
    <section className="mx-auto flex w-full max-w-350 flex-col items-center justify-center px-4 pt-10 pb-8 md:px-8 md:pt-40 md:pb-10">
      <ConverterWidget />
    </section>
  )
}
