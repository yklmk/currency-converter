// Picks the circle flags of the supported currencies out of the whole set
// (~500 KB) into lib/flags.generated.json (~30 KB), which the client imports.
// Runs before dev and build, and after install. The output isn't committed.
import { writeFileSync } from "node:fs"
import { icons } from "@iconify-json/circle-flags"

import currencies from "../helpers/currencies.ts"
import { createLogger, highlight } from "../lib/log.ts"

const OUTPUT = "lib/flags.generated.json"

const log = createLogger("flags")
const flags: Record<string, string> = {}
const missing: string[] = []

for (const { countryCode } of currencies) {
  const icon = icons.icons[countryCode.toLowerCase()]
  if (!icon) {
    missing.push(countryCode)
    continue
  }

  const width = icon.width ?? icons.width
  const height = icon.height ?? icons.height
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${icon.body}</svg>`

  // A data URL, not inline SVG: the flags use masks with fixed ids, which would
  // clash when a flag shows twice on the page.
  flags[countryCode] = `data:image/svg+xml,${encodeURIComponent(svg)}`
}

if (missing.length > 0) {
  log.error(`no circle flag for ${missing.join(", ")}`)
  process.exit(1)
}

const json = JSON.stringify(flags, null, 2) + "\n"
writeFileSync(new URL(`../${OUTPUT}`, import.meta.url), json)

const size = (Buffer.byteLength(json) / 1024).toFixed(1)
log.success(
  `${highlight(Object.keys(flags).length)} flags → ${OUTPUT} (${size} kB)`
)
