"use client"

import { ReactElement, useMemo, useRef, useState } from "react"
import supportedCurrencies from "@/helpers/currencies"
import { useIsClient, useLocalStorage, useMediaQuery } from "usehooks-ts"

import { Currency, Rate } from "@/types/currency"
import { convertAmounts, CurrencyAmount } from "@/lib/convert"
import { useRates } from "@/hooks/use-rates"
import CurrencySelectModal from "@/components/currency-select-modal"

import { DEFAULT_CURRENCIES, MIN_CURRENCIES } from "./constants"
import Container from "./container"
import { CurrencyList } from "./currency-list"
import { ConverterHeader } from "./header"
import { RatesStatus } from "./rates-status"

interface ConverterProps {
  rates: Rate
  updatedAt: string
}

export default function Converter({
  rates: serverRates,
  updatedAt,
}: ConverterProps): ReactElement {
  const isClient = useIsClient()
  const serverSnapshot = useMemo(
    () => ({ rates: serverRates, updatedAt }),
    [serverRates, updatedAt]
  )
  const {
    rates,
    updatedAt: ratesUpdatedAt,
    error: ratesError,
  } = useRates(serverSnapshot)

  const [lastInput, setLastInput] = useState<CurrencyAmount | null>(null)
  const amounts = convertAmounts(rates, lastInput)
  const [currencies, setCurrencies] = useLocalStorage<Currency[]>(
    "currencies",
    DEFAULT_CURRENCIES
  )
  const [isCurrenciesListOpen, setIsCurrenciesListOpen] =
    useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isListRevealed, setIsListRevealed] = useState<boolean>(false)
  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const selectedCodes = new Set(
    currencies.map(({ currencyCode }) => currencyCode)
  )
  const availableCurrencies = supportedCurrencies.filter(
    ({ currencyCode }) => !selectedCodes.has(currencyCode)
  )

  const onSelectCurrency = (currency: Currency) => {
    setCurrencies((prev) =>
      prev.some((item) => item.currencyCode === currency.currencyCode)
        ? prev
        : [...prev, currency]
    )
    setIsCurrenciesListOpen(false)
  }

  const onCurrencySelectModalClose = () => {
    addButtonRef.current?.focus()
  }

  const onRemoveCurrency = (currency: Currency) => {
    setCurrencies((prev) =>
      prev.length > MIN_CURRENCIES
        ? prev.filter((item) => item.currencyCode !== currency.currencyCode)
        : prev
    )
  }

  function onReorderCurrencies(
    order: Currency[],
    startOrder: Currency[]
  ): void {
    setCurrencies((current) => {
      // useLocalStorage reads the latest stored value, including unrendered tab updates.
      const sourceUnchanged =
        current.length === startOrder.length &&
        current.every((currency, index) => {
          const original = startOrder[index]
          return (
            currency.currencyCode === original.currencyCode &&
            currency.currencyName === original.currencyName &&
            currency.countryCode === original.countryCode
          )
        })
      return sourceUnchanged ? order : current
    })
  }

  return (
    <>
      {/* Until the stored list has replaced its skeleton the card snaps to it,
          so rows never sit outside a card that is still catching up. */}
      <Container animateHeight={isListRevealed && !reducedMotion}>
        <ConverterHeader
          isEditing={isEditing}
          reducedMotion={reducedMotion}
          canAddCurrency={availableCurrencies.length > 0}
          addButtonRef={addButtonRef}
          onToggleEditing={() => setIsEditing((previous) => !previous)}
          onAddCurrency={() => setIsCurrenciesListOpen(true)}
        />

        <div className="flex flex-col px-4 pt-4 pb-14 sm:mx-auto sm:w-[70%]">
          <div className="flex items-end justify-between gap-3 pb-3">
            <h1 className="shrink-0 text-3xl leading-none font-bold tracking-tighter">
              Converter
            </h1>

            {isClient && (
              <RatesStatus updatedAt={ratesUpdatedAt} error={ratesError} />
            )}
          </div>

          <CurrencyList
            currencies={currencies}
            amounts={amounts}
            isLoading={!isClient}
            isEditing={isEditing}
            onReorder={onReorderCurrencies}
            onRemove={onRemoveCurrency}
            onValueChange={setLastInput}
            onReveal={() => setIsListRevealed(true)}
          />
        </div>
      </Container>

      <CurrencySelectModal
        isOpen={isCurrenciesListOpen}
        onOpenChange={setIsCurrenciesListOpen}
        onClose={onCurrencySelectModalClose}
        currencies={availableCurrencies}
        setCurrency={onSelectCurrency}
      />
    </>
  )
}
