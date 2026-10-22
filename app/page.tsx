import ConverterWidget from "@/app/components/converter-widget"

// Must be a literal, keep in sync with RATES_REVALIDATE.
export const revalidate = 21600

export default async function IndexPage() {
  return (
    <section className="container flex flex-col items-center justify-center px-4 pb-8 pt-10 md:px-8 md:pb-10 md:pt-40">
      <ConverterWidget />
    </section>
  )
}
