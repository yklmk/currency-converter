import {
  ReactElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import { AnimatePresence, Reorder } from "motion/react"
import { Skeleton } from "skullet/react"
import { useMediaQuery } from "usehooks-ts"

import { Amounts, Currency, CurrencyCode } from "@/types/currency"
import { CurrencyAmount } from "@/lib/convert"

import {
  DEFAULT_CURRENCIES,
  MAX_AMOUNT_LENGTH,
  MIN_CURRENCIES,
} from "./constants"
import { CurrencyRow, DragInput } from "./input/currency-row"

interface CurrencyListProps {
  currencies: Currency[]
  amounts: Amounts
  isLoading: boolean
  isEditing: boolean
  onReorder: (order: Currency[], startOrder: Currency[]) => void
  onRemove: (currency: Currency) => void
  onValueChange: (input: CurrencyAmount) => void
  onReveal: () => void
}

interface ActiveDrag {
  currencyCode: CurrencyCode
  input: DragInput
  startOrder: Currency[]
}

interface PendingDrop {
  currencyCode: CurrencyCode
  order: Currency[]
}

export function CurrencyList({
  currencies,
  amounts,
  isLoading,
  isEditing,
  onReorder,
  onRemove,
  onValueChange,
  onReveal,
}: CurrencyListProps): ReactElement {
  // Share one live preference instead of subscribing separately in every row layer.
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [openCurrency, setOpenCurrency] = useState<CurrencyCode | null>(null)
  // Reorder previews stay local; persist the order only after a confirmed drop.
  const [previewOrder, setPreviewOrder] = useState<Currency[] | null>(null)
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [announcement, setAnnouncement] = useState<string>("")
  // Release can arrive before React commits Motion's latest order update.
  const latestOrder = useRef<Currency[] | null>(null)
  const pendingDrop = useRef<PendingDrop | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const focusTargets = useRef<Map<CurrencyCode, HTMLElement>>(new Map())
  const instructionsId = useId()
  const canRemove = currencies.length > MIN_CURRENCIES
  const isReorderActive = activeDrag !== null

  useEffect(() => {
    setOpenCurrency(null)
    const drop = pendingDrop.current
    if (!drop) {
      return
    }

    // Announce the actual outcome, not a preview rejected by the storage updater.
    pendingDrop.current = null
    const applied =
      currencies.length === drop.order.length &&
      currencies.every(
        (currency, index) =>
          currency.currencyCode === drop.order[index].currencyCode
      )

    if (applied) {
      const position =
        currencies.findIndex(
          (currency) => currency.currencyCode === drop.currencyCode
        ) + 1
      setAnnouncement(
        `${drop.currencyCode} placed at position ${position} of ${currencies.length}.`
      )
    } else {
      setAnnouncement(
        `${drop.currencyCode} move cancelled because the currency list changed.`
      )
    }
  }, [isEditing, currencies])

  useEffect(() => {
    // Mode changes discard any unconfirmed reorder preview.
    latestOrder.current = null
    pendingDrop.current = null
    setPreviewOrder(null)
    setActiveDrag(null)
    setAnnouncement("")
  }, [isEditing])

  const handleReorder = (order: Currency[]) => {
    if (!latestOrder.current) {
      return
    }

    latestOrder.current = order
    setPreviewOrder(order)

    if (activeDrag) {
      const index = order.findIndex(
        (currency) => currency.currencyCode === activeDrag.currencyCode
      )
      setAnnouncement(
        `${activeDrag.currencyCode}, position ${index + 1} of ${order.length}.`
      )
    }
  }

  const finishDrag = (cancelled: boolean) => {
    if (!activeDrag || !latestOrder.current) {
      return
    }

    const order = latestOrder.current
    // A drop must not overwrite a list updated by another tab or the Add dialog.
    const sourceChanged = activeDrag.startOrder !== currencies
    const changed = order.some(
      (currency, index) =>
        currency.currencyCode !== activeDrag.startOrder[index]?.currencyCode
    )
    latestOrder.current = null
    // Clearing the preview also restores the saved order after cancellation.
    setPreviewOrder(null)
    setActiveDrag(null)
    if (!cancelled && !sourceChanged && changed) {
      pendingDrop.current = { currencyCode: activeDrag.currencyCode, order }
      onReorder(order, activeDrag.startOrder)
      return
    }

    const index = order.findIndex(
      (currency) => currency.currencyCode === activeDrag.currencyCode
    )
    let message: string
    if (sourceChanged) {
      message = `${activeDrag.currencyCode} move cancelled because the currency list changed.`
    } else if (cancelled) {
      message = `${activeDrag.currencyCode} move cancelled. Order unchanged.`
    } else {
      message = `${activeDrag.currencyCode} placed at position ${index + 1} of ${order.length}.`
    }
    setAnnouncement(message)
  }

  const handleDragStateChange = (
    currencyCode: CurrencyCode,
    input: DragInput,
    isDragging: boolean,
    cancelled = false
  ) => {
    if (isDragging) {
      // Swipe and reorder cannot own a row at the same time.
      setOpenCurrency(null)
      latestOrder.current = currencies
      setPreviewOrder(currencies)
      setActiveDrag({ currencyCode, input, startOrder: currencies })
      const index = currencies.findIndex(
        (currency) => currency.currencyCode === currencyCode
      )
      setAnnouncement(
        `${currencyCode} picked up. Position ${index + 1} of ${currencies.length}. Use Up and Down to move, Space or Enter to drop, Escape to cancel.`
      )
    } else if (
      activeDrag?.currencyCode === currencyCode &&
      activeDrag.input === input
    ) {
      finishDrag(cancelled)
    }
  }

  const registerFocusTarget = useCallback(
    (code: CurrencyCode, element: HTMLElement) => {
      focusTargets.current.set(code, element)
      return () => {
        // Skullet may unmount an older copy after the current row mounts.
        if (focusTargets.current.get(code) === element) {
          focusTargets.current.delete(code)
        }
      }
    },
    []
  )

  const handleNavigate = (code: CurrencyCode, direction: -1 | 1) => {
    const index = currencies.findIndex(
      (currency) => currency.currencyCode === code
    )
    const nextIndex = Math.max(
      0,
      Math.min(currencies.length - 1, index + direction)
    )
    const nextCurrency = currencies[nextIndex]
    if (nextCurrency) {
      focusTargets.current.get(nextCurrency.currencyCode)?.focus()
    }
  }

  // The move button edits the same preview order as pointer reordering.
  const handleKeyboardMove = (code: CurrencyCode, direction: -1 | 1) => {
    const order = latestOrder.current
    if (
      activeDrag?.input !== "keyboard" ||
      activeDrag.currencyCode !== code ||
      !order
    ) {
      return
    }

    const index = order.findIndex((currency) => currency.currencyCode === code)
    const target = index + direction
    if (index < 0 || target < 0 || target >= order.length) {
      return
    }

    const nextOrder = [...order]
    const currency = nextOrder[index]
    nextOrder[index] = nextOrder[target]
    nextOrder[target] = currency
    handleReorder(nextOrder)
  }

  const handleRemove = (currency: Currency) => {
    if (!canRemove || isReorderActive) {
      return
    }

    setOpenCurrency(null)
    setAnnouncement(`${currency.currencyCode} removed.`)
    onRemove(currency)
  }

  const handleSwipeOpenChange = useCallback(
    (currencyCode: CurrencyCode, isOpen: boolean) => {
      if (isOpen && canRemove) {
        setOpenCurrency(currencyCode)
      } else {
        setOpenCurrency((prev) => (prev === currencyCode ? null : prev))
      }
    },
    [canRemove]
  )

  return (
    <div ref={listRef}>
      <p id={instructionsId} className="sr-only">
        On the move button, press Space or Enter to pick up a currency. Use Up
        and Down to move, Space or Enter to drop, Escape to cancel.
      </p>
      <p role="status" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
      <Skeleton
        id="currencies"
        label="Loading currencies"
        // The server can't read localStorage; use the same defaults until hydration.
        data={isLoading ? null : currencies}
        sample={DEFAULT_CURRENCIES}
        onReveal={onReveal}
      >
        {(list) => {
          const order = previewOrder ?? list
          return (
            <Reorder.Group
              data-currency-list=""
              layoutScroll
              axis="y"
              values={order}
              className="relative flex flex-col gap-4"
              role="list"
              onReorder={handleReorder}
            >
              {/* Reduced motion keeps the slot occupied until the fade finishes. */}
              <AnimatePresence
                initial={false}
                mode={reducedMotion ? "sync" : "popLayout"}
              >
                {order.map((currency, position) => (
                  <CurrencyRow
                    key={currency.currencyCode}
                    currency={currency}
                    position={position}
                    registerFocusTarget={registerFocusTarget}
                    onNavigate={handleNavigate}
                    onKeyboardMove={handleKeyboardMove}
                    value={amounts[currency.currencyCode] ?? ""}
                    maxLength={MAX_AMOUNT_LENGTH}
                    dragConstraints={listRef}
                    canRemove={canRemove}
                    isEditing={isEditing}
                    reducedMotion={reducedMotion}
                    isOpen={currency.currencyCode === openCurrency}
                    onOpenChange={handleSwipeOpenChange}
                    isKeyboardDragging={
                      activeDrag?.input === "keyboard" &&
                      activeDrag.currencyCode === currency.currencyCode
                    }
                    isPointerDragging={
                      activeDrag?.input === "pointer" &&
                      activeDrag.currencyCode === currency.currencyCode
                    }
                    isReorderActive={isReorderActive}
                    instructionsId={instructionsId}
                    onDragStateChange={handleDragStateChange}
                    onValueChange={onValueChange}
                    onRemove={handleRemove}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )
        }}
      </Skeleton>
    </div>
  )
}
