import {
  ChangeEventHandler,
  ClipboardEventHandler,
  InputHTMLAttributes,
  MouseEventHandler,
  ReactElement,
  RefObject,
  useId,
  useState,
} from "react"

import { Currency } from "@/types/currency"
import { normalizePastedAmount } from "@/lib/normalize-pasted-amount"
import { cn } from "@/lib/utils"
import { Flag } from "@/components/ui/flag"
import { Input } from "@/components/ui/input"

function CurrencyIdentity({
  currency,
  hasTrailingControl = false,
}: {
  currency: Currency
  hasTrailingControl?: boolean
}): ReactElement {
  return (
    // The name uses the space left by the amount; edit controls reserve 40px inside it.
    <span className="relative h-8 min-w-0 flex-1 contain-layout">
      <span
        className={cn(
          "absolute inset-y-0 left-0 flex w-full items-center transition-[width] duration-(--duration-enter) ease-(--ease-out-quad) motion-reduce:transition-none",
          hasTrailingControl && "w-[calc(100%-2.5rem)]"
        )}
      >
        <Flag countryCode={currency.countryCode} size={32} />
        <span className="ml-3 flex min-w-0 flex-col justify-center">
          <span className="truncate pb-1 text-base leading-3">
            {currency.currencyName}
          </span>
          <span className="text-sm leading-3 text-muted-foreground">
            {currency.currencyCode}
          </span>
        </span>
      </span>
    </span>
  )
}

function CurrencyDisplay({
  currency,
  value,
  hasTrailingControl = false,
}: {
  currency: Currency
  value: string
  hasTrailingControl?: boolean
}): ReactElement {
  return (
    <span className="flex w-full items-center justify-between gap-3 p-4 text-left">
      <CurrencyIdentity
        currency={currency}
        hasTrailingControl={hasTrailingControl}
      />
      <span
        className={cn(
          "max-w-[40%] min-w-3 shrink-0 truncate text-right text-base tabular-nums",
          hasTrailingControl && "transform-[translateX(-2.5rem)]"
        )}
      >
        {value || "0"}
      </span>
    </span>
  )
}

interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "onPaste"
> {
  onValueChange: (value: string) => void
  inputRef: RefObject<HTMLInputElement | null>
  currency: Currency
  hasTrailingControl?: boolean
}

function CurrencyInput({
  currency,
  inputRef,
  value,
  onValueChange,
  hasTrailingControl = false,
  ...props
}: CurrencyInputProps): ReactElement {
  const [pasteError, setPasteError] = useState<string | null>(null)
  const pasteErrorId = useId()
  const amountText = String(value ?? "") || props.placeholder || "0"

  // A click on the field itself keeps the browser's caret. A click elsewhere
  // on the card focuses the field with the caret at the end, where a label
  // would leave it at the start.
  const handleCardClick: MouseEventHandler<HTMLLabelElement> = (event) => {
    const input = inputRef.current

    if (!input || input.disabled || event.target === input) {
      return
    }

    event.preventDefault()
    input.focus()

    const length = input.value.length
    input.setSelectionRange(length, length)
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const newValue = event.target.value.replace(",", ".")

    if (newValue === "" || /^\d+\.?\d*$/.test(newValue)) {
      setPasteError(null)
      onValueChange(newValue)
    }
  }

  const handlePaste: ClipboardEventHandler<HTMLInputElement> = (event) => {
    event.preventDefault()
    const input = event.currentTarget

    if (input.readOnly || input.disabled) {
      return
    }

    const normalized = normalizePastedAmount(
      event.clipboardData.getData("text/plain")
    )
    if (normalized === null) {
      setPasteError("Paste a valid number.")
      return
    }

    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? start
    const nextValue =
      input.value.slice(0, start) + normalized + input.value.slice(end)

    if (!/^\d+\.?\d*$/.test(nextValue)) {
      setPasteError(
        "The resulting number would have multiple decimal separators."
      )
      return
    }

    if (input.maxLength >= 0 && nextValue.length > input.maxLength) {
      setPasteError(`Use no more than ${input.maxLength} characters.`)
      return
    }

    setPasteError(null)
    input.setRangeText(normalized, start, end, "end")
    onValueChange(nextValue)
  }

  return (
    <>
      <label
        onClick={handleCardClick}
        className="flex w-full cursor-[inherit] items-center justify-between gap-3 bg-background p-4 select-none"
      >
        <CurrencyIdentity
          currency={currency}
          hasTrailingControl={hasTrailingControl}
        />

        <span
          // Translate the whole field so the caret and its sizing text stay aligned.
          // will-change keeps its layer alive: iOS Safari stutters when it has to
          // create one as the slide starts.
          className={cn(
            "relative max-w-[40%] min-w-3 shrink-0 transform-[translateX(0)] transition-transform duration-(--duration-enter) ease-(--ease-out-quad) will-change-transform motion-reduce:transition-none",
            hasTrailingControl && "transform-[translateX(-2.5rem)]"
          )}
        >
          {/* Size to the exact text width without measuring or reserving an input column. */}
          <span
            aria-hidden="true"
            skullet-ignore=""
            className="invisible block truncate text-base whitespace-pre tabular-nums"
          >
            {amountText}
          </span>
          <Input
            ref={inputRef}
            value={value}
            className="absolute inset-0 size-full min-w-0 cursor-text border-none bg-transparent p-0 text-right text-base text-ellipsis tabular-nums select-text [-webkit-user-select:text] focus:[-webkit-touch-callout:default] focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 md:text-base dark:bg-transparent dark:disabled:bg-transparent"
            name={currency.currencyCode}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            aria-label={`${currency.currencyCode} currency input`}
            aria-describedby={pasteErrorId}
            onPaste={handlePaste}
            onChange={handleChange}
            {...props}
          />
        </span>
      </label>
      <p id={pasteErrorId} role="status" className="sr-only">
        {pasteError}
      </p>
    </>
  )
}

export { CurrencyInput, CurrencyDisplay, type CurrencyInputProps }
