import {
  ChangeEventHandler,
  FC,
  InputHTMLAttributes,
  KeyboardEventHandler,
  MouseEventHandler,
  useRef,
} from "react"
import Bowser from "bowser"

import { Currency } from "@/types/currency"
import { cn } from "@/lib/utils"
import { Flag } from "@/components/ui/flag"
import { Input } from "@/components/ui/input"

let isMacCache: boolean | undefined

function isMac() {
  if (isMacCache === undefined) {
    isMacCache =
      Bowser.getParser(window.navigator.userAgent).getOSName() === "macOS"
  }

  return isMacCache
}

interface CurrencyInputProps extends InputHTMLAttributes<HTMLInputElement> {
  currency: Currency
  containerClassName?: string
  onRemoveShortcut?: (currency: Currency) => void
}

const CurrencyInput: FC<CurrencyInputProps> = ({
  currency,
  containerClassName,
  value,
  onChange,
  onRemoveShortcut,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // A click on the field itself keeps the browser's caret. A click elsewhere
  // on the card focuses the field with the caret at the end, where a label
  // would leave it at the start.
  const handleCardClick: MouseEventHandler<HTMLLabelElement> = (event) => {
    const input = inputRef.current

    if (!input || event.target === input) {
      return
    }

    event.preventDefault()
    input.focus()

    const length = input.value.length
    input.setSelectionRange(length, length)
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    let newValue = event.target.value
    newValue = newValue.replace(",", ".")

    if (newValue === "" || /^\d+\.?\d*$/.test(newValue)) {
      if (onChange) {
        event.target.value = newValue
        onChange(event)
      }
    }
  }

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!onRemoveShortcut || event.key !== "Backspace" || !event.shiftKey) {
      return
    }

    const modifier = isMac() ? event.metaKey : event.ctrlKey

    if (modifier) {
      event.preventDefault()
      onRemoveShortcut(currency)
    }
  }

  return (
    <label
      onClick={handleCardClick}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between bg-background p-4 select-none",
        containerClassName
      )}
    >
      <div className="mr-1 flex shrink-0">
        <Flag countryCode={currency.countryCode} size={32} />
        <div className="ml-3 flex flex-col justify-center">
          <span className="pb-1 text-base leading-3 text-nowrap">
            {currency.currencyName}
          </span>
          <span className="text-sm leading-3 text-ring">
            {currency.currencyCode}
          </span>
        </div>
      </div>

      <Input
        ref={inputRef}
        value={value}
        className="size-auto max-w-[40%] min-w-3 shrink border-none bg-transparent p-0 text-right text-base text-ellipsis tabular-nums focus-visible:ring-0 disabled:bg-transparent md:text-base dark:bg-transparent dark:disabled:bg-transparent"
        name={currency.currencyCode}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        aria-label={`${currency.currencyCode} currency input`}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </label>
  )
}

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput, type CurrencyInputProps }
