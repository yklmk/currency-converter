import {
  FC,
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { Trash } from "lucide-react"
import {
  animate,
  motion,
  PanInfo,
  useDragControls,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"

import { Currency, CurrencyCode } from "@/types/currency"
import { Button } from "@/components/ui/button"
import {
  CurrencyInput,
  CurrencyInputProps,
} from "@/components/ui/currency-input"

const ACTION_WIDTH = 64
const ACTION_INSET = 4
const ICON_SIZE = 20
const ICON_EDGE = 16
const DELETE_THRESHOLD = 0.5
const DELETE_HYSTERESIS = 12
const DRAG_THRESHOLD = 12
const TOUCH_LOCK_THRESHOLD = 6
const OPEN_THRESHOLD = ACTION_WIDTH * 0.75
const DRAG_ELASTICITY = { left: 0.75, right: 0.05 }
const FLICK_VELOCITY = 700
const ICON_SPRING = { stiffness: 600, damping: 24, mass: 0.7 }
const SNAP_SPRING = {
  type: "spring" as const,
  stiffness: 550,
  damping: 32,
  mass: 0.8,
}
const DELETE_ANIMATION = {
  duration: 0.16,
  ease: [0.19, 1, 0.22, 1] as [number, number, number, number],
}
const INSTANT_ANIMATION = { duration: 0 }

interface SwipeRelease {
  position: number
  offset: number
  velocity: number
  isOpen: boolean
}

function getIsReadyToDelete(
  position: number,
  threshold: number,
  wasReadyToDelete: boolean
): boolean {
  const boundary = wasReadyToDelete ? threshold - DELETE_HYSTERESIS : threshold
  return -position >= boundary
}

function shouldOpenAction({
  position,
  offset,
  velocity,
  isOpen,
}: SwipeRelease): boolean {
  const isFlick =
    Math.abs(velocity) > FLICK_VELOCITY && Math.abs(offset) >= OPEN_THRESHOLD

  if (isFlick) {
    return velocity < 0
  }

  const threshold = isOpen ? ACTION_WIDTH / 2 : OPEN_THRESHOLD
  return position < -threshold
}

interface DraggableInputProps extends CurrencyInputProps {
  canRemove: boolean
  isOpen: boolean
  onRemove: (currency: Currency) => void
  onOpenChange: (currencyCode: CurrencyCode, isOpen: boolean) => void
}

const DraggableInput: FC<DraggableInputProps> = ({
  canRemove,
  isOpen,
  currency,
  disabled,
  onRemove,
  onOpenChange,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const dragDirection = useRef<"x" | "y" | null>(null)
  const suppressClick = useRef<boolean>(false)
  const tracking = useRef<boolean>(false)
  const removing = useRef<boolean>(false)
  const isReadyToDelete = useRef<boolean>(false)
  const targetOpen = useRef<boolean>(false)
  const [width, setWidth] = useState<number>(0)
  const [dragBounds, setDragBounds] = useState<{ left: number; right: number }>(
    {
      left: 0,
      right: 0,
    }
  )
  const x = useMotionValue<number>(0)
  const dragControls = useDragControls()
  const reducedMotion = useReducedMotion()
  const canSwipe = canRemove && !disabled
  const isRevealed = isOpen && canSwipe
  const deleteThreshold = Math.max(ACTION_WIDTH * 2, width * DELETE_THRESHOLD)
  const iconAnchor = useSpring(0, ICON_SPRING)

  // The first 64px slide the separate button in; further travel grows it.
  const actionX = useTransform(x, (value) => Math.max(0, ACTION_WIDTH + value))
  const actionWidth = useTransform(
    x,
    (value) =>
      Math.max(ACTION_WIDTH, Math.min(width, -value)) - ACTION_INSET * 2
  )
  const iconX = useTransform(() => {
    const center = actionWidth.get() / 2 - ICON_SIZE / 2
    return center + (ICON_EDGE - center) * iconAnchor.get() - 1
  })

  const updateReadyToDelete = useCallback(
    (value: boolean) => {
      if (isReadyToDelete.current === value) {
        return
      }

      isReadyToDelete.current = value
      if (reducedMotion) {
        iconAnchor.jump(value ? 1 : 0)
      } else {
        iconAnchor.set(value ? 1 : 0)
      }
    },
    [iconAnchor, reducedMotion]
  )

  const updateReadyToDeleteFromPosition = useCallback(
    (value: number) => {
      updateReadyToDelete(
        getIsReadyToDelete(value, deleteThreshold, isReadyToDelete.current)
      )
    },
    [deleteThreshold, updateReadyToDelete]
  )

  useMotionValueEvent(x, "change", (value) => {
    if (tracking.current) {
      updateReadyToDeleteFromPosition(value)
    }
  })

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const measure = () => setWidth(element.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  // Native scroll locking must run synchronously, before Motion's next frame.
  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface || !canSwipe) {
      return
    }

    let origin: { id: number; x: number; y: number } | null = null
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches.length === 1 ? event.touches[0] : null
      origin = touch
        ? { id: touch.identifier, x: touch.clientX, y: touch.clientY }
        : null
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!origin) {
        return
      }

      if (event.touches.length !== 1) {
        origin = null
        return
      }

      const touch = event.touches[0]
      if (touch.identifier !== origin.id) {
        return
      }

      if (!dragDirection.current) {
        const dx = Math.abs(touch.clientX - origin.x)
        const dy = Math.abs(touch.clientY - origin.y)
        if (dx >= TOUCH_LOCK_THRESHOLD && dx > dy) {
          dragDirection.current = "x"
        } else if (dy >= DRAG_THRESHOLD && dy > dx) {
          dragDirection.current = "y"
        }
      }

      if (dragDirection.current === "x" && event.cancelable) {
        event.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      origin = null
    }

    surface.addEventListener("touchstart", handleTouchStart, { passive: true })
    surface.addEventListener("touchmove", handleTouchMove, { passive: false })
    surface.addEventListener("touchend", handleTouchEnd, { passive: true })
    surface.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      surface.removeEventListener("touchstart", handleTouchStart)
      surface.removeEventListener("touchmove", handleTouchMove)
      surface.removeEventListener("touchend", handleTouchEnd)
      surface.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [canSwipe])

  const settle = useCallback(
    (open: boolean, velocity = 0, immediate = false) => {
      targetOpen.current = open
      x.stop()

      return animate(
        x,
        open ? -ACTION_WIDTH : 0,
        reducedMotion || immediate
          ? INSTANT_ANIMATION
          : { ...SNAP_SPRING, velocity }
      )
    },
    [x, reducedMotion]
  )

  useEffect(() => {
    if (
      !removing.current &&
      (targetOpen.current !== isRevealed || reducedMotion)
    ) {
      settle(isRevealed)
    }
  }, [isRevealed, reducedMotion, settle])

  useEffect(() => {
    return () => x.stop()
  }, [x])

  useEffect(() => {
    if (!isRevealed) {
      return
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target)
      ) {
        onOpenChange(currency.currencyCode, false)
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)

    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
  }, [isRevealed, currency.currencyCode, onOpenChange])

  const close = (restoreFocus = false) => {
    if (removing.current) {
      return
    }

    tracking.current = false
    updateReadyToDelete(false)
    onOpenChange(currency.currencyCode, false)
    settle(false, 0, restoreFocus)

    if (restoreFocus) {
      ref.current?.querySelector("input")?.focus()
    }
  }

  const handleDragEnd = (event: PointerEvent, info: PanInfo) => {
    tracking.current = false
    if (
      !canSwipe ||
      event.type === "pointercancel" ||
      dragDirection.current !== "x"
    ) {
      updateReadyToDelete(false)
      settle(isRevealed)
      return
    }

    if (isReadyToDelete.current && canRemove && !disabled) {
      removing.current = true
      x.stop()
      animate(x, -width, reducedMotion ? INSTANT_ANIMATION : DELETE_ANIMATION)
      onRemove(currency)
      return
    }

    updateReadyToDelete(false)

    const open = shouldOpenAction({
      position: x.get(),
      offset: info.offset.x,
      velocity: info.velocity.x,
      isOpen: isRevealed,
    })

    settle(open, info.velocity.x)
    onOpenChange(currency.currencyCode, open)
  }

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Escape" && (isRevealed || tracking.current)) {
      event.preventDefault()
      event.stopPropagation()
      dragControls.cancel()
      close(true)
    }
  }

  const handleBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      close()
    }
  }

  const handleFocusCapture: FocusEventHandler<HTMLDivElement> = (event) => {
    if (event.target instanceof HTMLInputElement && isRevealed) {
      close()
    }
  }

  const handlePointerDownCapture = () => {
    suppressClick.current = false
    dragDirection.current = null
    tracking.current = false
  }

  const handleClickCapture: MouseEventHandler<HTMLDivElement> = (event) => {
    // A completed swipe must not trigger the label's click-to-focus.
    if (suppressClick.current && event.detail !== 0) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (
      isRevealed &&
      !deleteButtonRef.current?.contains(event.target as Node)
    ) {
      close()
    }
  }

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    if (canSwipe && event.isPrimary && event.button === 0) {
      x.stop()
      const position = x.get()
      // Rebase elastic boundaries to the caught position, so the next move is continuous.
      setDragBounds({
        left: Math.min(isRevealed ? -ACTION_WIDTH : 0, position),
        right: Math.max(0, position),
      })
      // Explicit controls also accept gestures starting on the amount input.
      dragControls.start(event, { distanceThreshold: DRAG_THRESHOLD })
    }
  }

  const handleDragStart = (_: PointerEvent, info: PanInfo) => {
    // Choose the dominant axis once; later vertical drift doesn't cancel a swipe.
    const horizontal = dragDirection.current
      ? dragDirection.current === "x"
      : Math.abs(info.offset.x) > Math.abs(info.offset.y)
    dragDirection.current = horizontal ? "x" : "y"
    tracking.current = horizontal
    suppressClick.current = horizontal

    if (horizontal) {
      updateReadyToDeleteFromPosition(x.get())
    } else {
      dragControls.cancel()
      settle(isRevealed, 0, true)
    }
  }

  const handleRemoveClick = () => {
    onRemove(currency)
  }

  return (
    <div
      ref={ref}
      className="relative min-w-0 flex-1 rounded-lg border bg-background transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 motion-reduce:transition-none"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocusCapture={handleFocusCapture}
      onPointerDownCapture={handlePointerDownCapture}
      onClickCapture={handleClickCapture}
    >
      <div className="relative overflow-hidden rounded-[calc(var(--radius-lg)-1px)]">
        <motion.div
          ref={surfaceRef}
          drag={canSwipe ? "x" : false}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={dragBounds}
          dragElastic={DRAG_ELASTICITY}
          dragMomentum={false}
          className="relative z-10"
          style={{ x, touchAction: canSwipe ? "pan-y pinch-zoom" : undefined }}
          onPointerDown={handlePointerDown}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <CurrencyInput currency={currency} disabled={disabled} {...props} />
        </motion.div>
        <motion.div
          skullet-ignore=""
          aria-hidden={!isRevealed}
          inert={!isRevealed}
          className="absolute inset-y-1 right-1"
          style={{ width: actionWidth, x: actionX }}
        >
          <Button
            ref={deleteButtonRef}
            type="button"
            tabIndex={isRevealed ? 0 : -1}
            disabled={!canRemove}
            aria-label={`Remove ${currency.currencyCode}`}
            variant="destructive"
            className="relative size-full rounded-md border-destructive/20 p-0 focus-visible:ring-inset motion-reduce:transition-none motion-reduce:active:scale-100!"
            onClick={handleRemoveClick}
          >
            <motion.span
              className="absolute top-1/2 left-0 flex size-5 -translate-y-1/2 items-center justify-center"
              style={{ x: iconX }}
            >
              <Trash className="size-5" aria-hidden="true" />
            </motion.span>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

DraggableInput.displayName = "DraggableInput"

export { DraggableInput, type DraggableInputProps }
