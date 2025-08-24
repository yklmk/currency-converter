import { FC, KeyboardEventHandler, RefObject, useEffect, useRef } from "react"
import { motion, MotionProps, PanInfo } from "framer-motion"
import { useOnClickOutside } from "usehooks-ts"

import { Currency, CurrencyCode } from "@/types/currency"
import { Button } from "@/components/ui/button"
import {
  CurrencyInput,
  CurrencyInputProps,
} from "@/components/ui/currency-input"
import { Icons } from "@/components/icons"

interface DraggableInputProps extends CurrencyInputProps {
  draggable: boolean
  isDragged: boolean
  motionProps?: MotionProps
  onRemove?: (currency: Currency) => void
  setIsDragged: (currencyCode: CurrencyCode, isDragged: boolean) => void
}

const DraggableInput: FC<DraggableInputProps> = ({
  draggable,
  isDragged,
  currency,
  disabled,
  motionProps,
  onRemove,
  setIsDragged,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  const onRemoveClick = () => {
    if (onRemove) {
      setIsDragged(currency.currencyCode, false)
      setTimeout(() => onRemove(currency), 100)
    }
  }

  const handleDragEnd = (info: PanInfo) => {
    const offset = info.offset.x
    const threshold = -50
    setIsDragged(currency.currencyCode, offset < threshold)
  }

  const handleOutsideClick = () => {
    setIsDragged(currency.currencyCode, false)
  }

  const handleDeleteButtonKeyDown: KeyboardEventHandler<HTMLButtonElement> = (
    event
  ) => {
    if (event.key === "Escape") {
      event.preventDefault()
      setIsDragged(currency.currencyCode, false)
    }
  }

  useEffect(() => {
    if (!isDragged) {
      deleteButtonRef.current?.blur()
    }
  }, [isDragged])

  // @ts-expect-error
  useOnClickOutside(ref, handleOutsideClick)

  return (
    <motion.div
      ref={ref}
      className="z-10 w-full overflow-hidden"
      {...motionProps}
    >
      <motion.div
        dragDirectionLock
        drag={draggable && "x"}
        dragConstraints={{ left: isDragged ? -68 : 0, right: 0 }}
        dragElastic={{ left: 0.3, right: 0.01 }}
        className="relative flex items-center justify-between p-1"
        onDragEnd={(_, info) => handleDragEnd(info)}
        animate={{
          x: isDragged ? -68 : 0,
        }}
        transition={{ type: "tween", duration: 0.2 }}
        onAnimationComplete={() => {
          if (isDragged) {
            deleteButtonRef.current?.focus()
          }
        }}
      >
        <CurrencyInput currency={currency} disabled={disabled} {...props} />
        <Button
          ref={deleteButtonRef}
          tabIndex={isDragged ? 0 : -1}
          aria-label="Remove currency"
          variant="destructive"
          className="absolute right-[-60px] h-[66px] rounded-lg"
          onClick={onRemoveClick}
          onKeyDown={handleDeleteButtonKeyDown}
        >
          <Icons.trash />
        </Button>
      </motion.div>
    </motion.div>
  )
}

DraggableInput.displayName = "DraggableInput"

export { DraggableInput, type DraggableInputProps }
