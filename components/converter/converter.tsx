"use client"

import { useMemo, useRef, useState } from "react"
import supportedCurrencies from "@/helpers/currencies"
import { Check, Plus } from "lucide-react"
import { AnimatePresence, Reorder } from "motion/react"
import { Skeleton } from "skullet/react"
import { useIsClient, useLocalStorage } from "usehooks-ts"

import { Currency, CurrencyCode, Rate } from "@/types/currency"
import { convertAmounts, CurrencyAmount } from "@/lib/convert"
import { useRates } from "@/hooks/use-rates"
import { Button } from "@/components/ui/button"
import CurrencySelectModal from "@/components/currency-select-modal"
import { ThemeToggle } from "@/components/theme-toggle"

import Container from "./container"
import { Input } from "./input"
import { RatesStatus } from "./rates-status"

interface ConverterProps {
  rates: Rate
  updatedAt: string
}

const defaultCurrencies: Currency[] = [
  {
    currencyCode: "USD",
    currencyName: "US Dollar",
    countryCode: "US",
  },
  {
    currencyCode: "EUR",
    currencyName: "Euro",
    countryCode: "EU",
  },
  {
    currencyCode: "GBP",
    currencyName: "British Pound",
    countryCode: "GB",
  },
]

const MAX_LENGTH = 10

export default function Converter({
  rates: serverRates,
  updatedAt,
}: ConverterProps) {
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
    defaultCurrencies
  )
  const [openCurrency, setOpenCurrency] = useState<CurrencyCode | null>(null)
  const [isCurrenciesListOpen, setIsCurrenciesListOpen] =
    useState<boolean>(false)
  const [isEditModeEnabled, setIsEditModeEnabled] = useState<boolean>(false)

  const listRef = useRef<HTMLDivElement>(null)
  const addButtonRef = useRef<HTMLButtonElement | null>(null)

  const availableCurrencies = supportedCurrencies.filter((currency) => {
    return !currencies.some(
      (item) => item.currencyCode === currency.currencyCode
    )
  })

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

  const onOpenCurrenciesList = () => setIsCurrenciesListOpen(true)
  const onEnableEditMode = () => {
    setOpenCurrency(null)
    setIsEditModeEnabled(true)
  }
  const onDisableEditMode = () => setIsEditModeEnabled(false)

  const onRemoveCurrency = (currency: Currency) => {
    if (currencies.length > 2) {
      setOpenCurrency(null)
      setCurrencies((prev) =>
        prev.length > 2
          ? prev.filter((item) => item.currencyCode !== currency.currencyCode)
          : prev
      )
    }
  }

  const onSwipeOpenChange = (currencyCode: CurrencyCode, value: boolean) => {
    if (value) {
      if (currencies.length > 2) {
        setOpenCurrency(currencyCode)
      }
    } else {
      setOpenCurrency((prev) => (prev === currencyCode ? null : prev))
    }
  }

  return (
    <>
      <Container>
        <div className="flex items-center justify-between border-b p-2">
          <div className="flex">
            <ThemeToggle />
          </div>
          {isEditModeEnabled ? (
            <Button variant="outline" onClick={onDisableEditMode}>
              <Check />
              Done
            </Button>
          ) : (
            <Button
              ref={addButtonRef}
              variant="outline"
              disabled={availableCurrencies.length === 0}
              aria-label="Add currency"
              onClick={onOpenCurrenciesList}
            >
              <Plus />
              Add
            </Button>
          )}
        </div>

        <div className="flex flex-col px-4 pt-4 pb-10 sm:mx-auto sm:w-[70%]">
          <div className="flex items-end justify-between gap-3 pb-3">
            <h1 className="shrink-0 text-3xl leading-none font-bold tracking-tighter">
              Converter
            </h1>

            {isClient && (
              <RatesStatus updatedAt={ratesUpdatedAt} error={ratesError} />
            )}
          </div>

          <div ref={listRef}>
            <Skeleton
              id="currencies"
              label="Loading currencies"
              // The server can't read localStorage, so until the page is
              // hydrated the list is a skeleton drawn from the defaults.
              data={isClient ? currencies : null}
              sample={defaultCurrencies}
            >
              {(list) => (
                <Reorder.Group
                  layoutScroll
                  axis="y"
                  values={list}
                  className="relative flex flex-col"
                  role="list"
                  onReorder={setCurrencies}
                >
                  <AnimatePresence initial={false} mode="sync">
                    {list.map((currency) => (
                      <Input
                        key={currency.currencyCode}
                        showControls={isEditModeEnabled}
                        currency={currency}
                        value={amounts[currency.currencyCode] ?? ""}
                        maxLength={MAX_LENGTH}
                        dragConstraints={listRef}
                        canRemove={list.length > 2}
                        isOpen={currency.currencyCode === openCurrency}
                        onOpenChange={onSwipeOpenChange}
                        onEditModeClick={onEnableEditMode}
                        onValueChange={(value) =>
                          setLastInput({
                            currencyCode: currency.currencyCode,
                            value,
                          })
                        }
                        onRemove={onRemoveCurrency}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </Skeleton>
          </div>
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
