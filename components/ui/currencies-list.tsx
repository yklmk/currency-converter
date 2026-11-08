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

interface CurrenciesListProps {
  currencies: Currency[]
  onSelectCurrency: (currency: Currency) => void
  className?: string
}
interface CurrencyListItemProps {
  currency: Currency
  isSelected: boolean
  onClick: MouseEventHandler<HTMLDivElement>
  onMouseEnter: MouseEventHandler<HTMLDivElement>
}

const CurrencyListItem = forwardRef<HTMLDivElement, CurrencyListItemProps>(
  ({ currency, isSelected, onClick, onMouseEnter }, ref) => {
    return (
      <div
        role="option"
        aria-selected={isSelected}
        ref={ref}
        tabIndex={-1}
        className={
          "mb-2 flex w-full cursor-pointer items-center rounded-md p-2 outline-hidden transition-shadow select-none focus:bg-accent"
        }
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      >
        <Flag countryCode={currency.countryCode} size={28} />
        <div className="ml-2 flex flex-col justify-center text-left">
          <span className="mb-1 text-base leading-3">
            {currency.currencyName}
          </span>
          <span className="text-sm leading-3 text-ring">
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

  useEffect(() => {
    if (selectedIndex !== null && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.focus()
    }
  }, [selectedIndex])

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
      case "Enter":
      case " ":
        event.preventDefault()
        if (selectedIndex !== null) {
          onSelectCurrency(currencies[selectedIndex])
        }
        break
      default:
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
      aria-activedescendant={
        selectedIndex !== null
          ? `${currencies[selectedIndex].currencyCode}-currency`
          : undefined
      }
      tabIndex={0}
      className={cn(
        "min-h-32 overflow-y-scroll rounded-md border p-2 outline-hidden",
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
          onMouseEnter={() => setSelectedIndex(index)}
        />
      ))}
    </div>
  )
}
