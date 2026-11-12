import {
  forwardRef,
  KeyboardEvent,
  MouseEventHandler,
  useEffect,
  useRef,
  useState,
} from "react"

import { Currency } from "@/types/currency"
import { cn } from "@/lib/utils"
import { Flag } from "@/components/ui/flag"

const TYPEAHEAD_RESET_MS = 500

interface CurrenciesListProps {
  currencies: Currency[]
  onSelectCurrency: (currency: Currency) => void
  className?: string
}
interface CurrencyListItemProps {
  currency: Currency
  isSelected: boolean
  onClick: MouseEventHandler<HTMLDivElement>
}

const CurrencyListItem = forwardRef<HTMLDivElement, CurrencyListItemProps>(
  ({ currency, isSelected, onClick }, ref) => {
    return (
      <div
        role="option"
        aria-selected={isSelected}
        ref={ref}
        tabIndex={-1}
        className="mb-2 flex w-full cursor-pointer items-center rounded-md p-2 outline-hidden select-none [contain-intrinsic-size:auto_44px] [content-visibility:auto] hover:bg-accent focus:bg-accent"
        onClick={onClick}
      >
        <Flag countryCode={currency.countryCode} size={28} />
        <div className="ml-2 flex flex-col justify-center text-left">
          <span className="mb-1 text-base leading-3">
            {currency.currencyName}
          </span>
          <span className="text-sm leading-3 text-muted-foreground">
            {currency.currencyCode}
          </span>
        </div>
      </div>
    )
  }
)

CurrencyListItem.displayName = "CurrencyListItem"

export default function CurrenciesList({
  currencies,
  className,
  onSelectCurrency,
}: CurrenciesListProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const typeahead = useRef({ query: "", timeout: 0 })

  useEffect(() => {
    if (selectedIndex !== null && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.focus()
    }
  }, [selectedIndex])

  useEffect(() => () => window.clearTimeout(typeahead.current.timeout), [])

  const jumpTo = (key: string) => {
    const state = typeahead.current
    window.clearTimeout(state.timeout)
    state.query += key.toLowerCase()
    state.timeout = window.setTimeout(() => {
      state.query = ""
    }, TYPEAHEAD_RESET_MS)

    const isRepeat = [...state.query].every((char) => char === state.query[0])
    const query = isRepeat ? state.query[0] : state.query
    const start = isRepeat ? (selectedIndex ?? -1) + 1 : 0
    const ordered = [
      ...currencies.slice(start).map((currency, i) => [currency, start + i]),
      ...currencies.slice(0, start).map((currency, i) => [currency, i]),
    ] as [Currency, number][]

    const match = ordered.find(
      ([currency]) =>
        currency.currencyName.toLowerCase().startsWith(query) ||
        currency.currencyCode.toLowerCase().startsWith(query)
    )

    if (match) {
      setSelectedIndex(match[1])
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setSelectedIndex((prevIndex) => {
          if (prevIndex === null) {
            return 0
          } else {
            return prevIndex === currencies.length - 1 ? 0 : prevIndex + 1
          }
        })
        break
      case "ArrowUp":
        event.preventDefault()
        setSelectedIndex((prevIndex) => {
          if (prevIndex === null) {
            return currencies.length - 1
          } else {
            return prevIndex === 0 ? currencies.length - 1 : prevIndex - 1
          }
        })
        break
      case "Home":
        event.preventDefault()
        setSelectedIndex(0)
        break
      case "End":
        event.preventDefault()
        setSelectedIndex(currencies.length - 1)
        break
      case "Enter":
      case " ":
        event.preventDefault()
        if (selectedIndex !== null) {
          onSelectCurrency(currencies[selectedIndex])
        }
        break
      default:
        if (
          event.key.length === 1 &&
          /\S/.test(event.key) &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey
        ) {
          jumpTo(event.key)
        }
        break
    }
  }

  const handleItemClick = (currency: Currency, index: number) => {
    setSelectedIndex(index)
    onSelectCurrency(currency)
  }

  return (
    <div
      role="listbox"
      tabIndex={0}
      className={cn(
        "min-h-32 overflow-y-scroll overscroll-contain rounded-[calc(var(--radius-md)+(--spacing(1.5))+1px)] border p-1.5 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {currencies.map((currency, index) => (
        <CurrencyListItem
          key={currency.currencyCode}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          currency={currency}
          isSelected={selectedIndex === index}
          onClick={() => handleItemClick(currency, index)}
        />
      ))}
    </div>
  )
}
