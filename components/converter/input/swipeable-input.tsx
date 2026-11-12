import {
  FocusEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { Trash } from "lucide-react"
import {
  animate,
  motion,
  MotionValue,
  PanInfo,
  useDragControls,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "motion/react"

import { Currency, CurrencyCode } from "@/types/currency"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CurrencyDisplay,
  CurrencyInput,
  CurrencyInputProps,
} from "@/components/ui/currency-input"

import { isNativeInputInteraction } from "./input-interaction"

const ACTION_WIDTH = 64
const ACTION_INSET = 4
const ICON_SIZE = 20
const ICON_EDGE = 16
const DELETE_THRESHOLD = 0.5
const DELETE_HYSTERESIS = 12
const DRAG_THRESHOLD = 12
// Lock page scrolling before Motion crosses its drag threshold.
const TOUCH_LOCK_THRESHOLD = 6
const OPEN_THRESHOLD = ACTION_WIDTH * 0.75
const DRAG_ELASTICITY = { left: 0.75, right: 0.05 }
const FLICK_VELOCITY = 700
const WHEEL_IDLE_DELAY = 140
const ICON_SPRING = { stiffness: 600, damping: 24, mass: 0.7 }
const SNAP_SPRING = {
  type: "spring" as const,
  stiffness: 550,
  damping: 32,
  mass: 0.8,
}
const EASE_OUT_EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1]
// Finishes the throw the finger started; Motion drives it per frame in JS.
const DELETE_ANIMATION = { duration: 0.16, ease: EASE_OUT_EXPO }
const INSTANT_ANIMATION = { duration: 0 }

interface SwipeRelease {
  position: number
  offset: number
  velocity: number
  isOpen: boolean
}

interface PointerSession {
  pointer: PointerEvent
  releaseFrame: number | null
  removeListeners: () => void
}

function isSessionEvent(
  session: PointerSession | null,
  event: PointerEvent
): boolean {
  return (
    // Pointer IDs are reused; reject callbacks from an older press.
    session !== null &&
    session.pointer.pointerId === event.pointerId &&
    event.timeStamp >= session.pointer.timeStamp
  )
}

function getWheelUnit(event: WheelEvent, pageWidth: number): number {
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return 16
    case WheelEvent.DOM_DELTA_PAGE:
      return pageWidth
    default:
      return 1
  }
}

function getIsReadyToDelete(
  position: number,
  threshold: number,
  wasReadyToDelete: boolean
): boolean {
  // Separate enter/exit thresholds prevent flicker near the delete boundary.
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
    // A fast reversal wins over the current displacement.
    return velocity < 0
  }

  const threshold = isOpen ? ACTION_WIDTH / 2 : OPEN_THRESHOLD
  return position < -threshold
}

interface SwipeableInputProps extends CurrencyInputProps {
  trailingControl?: ReactNode
  canRemove: boolean
  isOpen: boolean
  areActionsDisabled?: boolean
  isReordering?: boolean
  reducedMotion: boolean
  onRemove: (currency: Currency) => void
  onOpenChange: (currencyCode: CurrencyCode, isOpen: boolean) => void
}

function SwipeableInput({
  canRemove,
  isOpen,
  areActionsDisabled = false,
  isReordering = false,
  reducedMotion,
  currency,
  inputRef,
  disabled,
  onRemove,
  onOpenChange,
  trailingControl,
  ...props
}: SwipeableInputProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const dragDirection = useRef<"x" | "y" | null>(null)
  const suppressClick = useRef<boolean>(false)
  const pointerSession = useRef<PointerSession | null>(null)
  const removing = useRef<boolean>(false)
  const isReadyToDelete = useRef<boolean>(false)
  // Keep the snap target separate from the live drag position.
  const targetOpen = useRef<boolean>(false)
  const openChangeRef =
    useRef<SwipeableInputProps["onOpenChange"]>(onOpenChange)
  useLayoutEffect(() => {
    openChangeRef.current = onOpenChange
  }, [onOpenChange])
  const [width, setWidth] = useState<number>(0)
  const [dragBounds, setDragBounds] = useState<{ left: number; right: number }>(
    {
      left: 0,
      right: 0,
    }
  )
  const x = useMotionValue<number>(0)
  const dragControls = useDragControls()
  const canSwipe =
    canRemove && !disabled && !isReordering && !areActionsDisabled
  const isRevealed = isOpen && canSwipe
  const deleteThreshold = Math.max(ACTION_WIDTH * 2, width * DELETE_THRESHOLD)
  const iconAnchor: MotionValue<number> = useSpring(0, ICON_SPRING)

  // The first 64px slide the separate button in; further travel grows it.
  const actionX = useTransform(x, (value) => Math.max(0, ACTION_WIDTH + value))
  const actionWidth = useTransform(
    x,
    (value) =>
      Math.max(ACTION_WIDTH, Math.min(width, -value)) - ACTION_INSET * 2
  )
  // Once ready to delete, spring the icon from the center toward the left edge.
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

  function updateReadyToDeleteFromPosition(value: number): void {
    updateReadyToDelete(
      getIsReadyToDelete(value, deleteThreshold, isReadyToDelete.current)
    )
  }

  useEffect(() => {
    if (reducedMotion) {
      // Stop an icon spring that was already running when the preference changed.
      iconAnchor.jump(isReadyToDelete.current ? 1 : 0)
    }
  }, [reducedMotion, iconAnchor])

  useMotionValueEvent(x, "change", (value) => {
    // Only direct dragging can arm deletion; settling animations cannot.
    if (pointerSession.current && dragDirection.current === "x") {
      updateReadyToDeleteFromPosition(value)
    }
  })

  const clearPointerSession = useCallback(() => {
    const session = pointerSession.current
    if (!session) {
      return
    }

    pointerSession.current = null
    session.removeListeners()
    if (session.releaseFrame !== null) {
      // An old tap fallback must not reset the next gesture.
      cancelAnimationFrame(session.releaseFrame)
    }
  }, [])

  const settle = useCallback(
    (open: boolean, velocity = 0, immediate = false) => {
      // Retarget from the live position and carry the release velocity forward.
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

  const stopPointerGesture = useCallback(() => {
    clearPointerSession()
    dragControls.cancel()
    dragDirection.current = null
    updateReadyToDelete(false)
  }, [clearPointerSession, dragControls, updateReadyToDelete])

  const cancelPointerGesture = useCallback(() => {
    stopPointerGesture()
    settle(targetOpen.current)
  }, [settle, stopPointerGesture])

  const close = useCallback(
    (restoreFocus = false) => {
      if (removing.current) {
        return
      }

      stopPointerGesture()
      onOpenChange(currency.currencyCode, false)
      settle(false, 0, restoreFocus)

      if (restoreFocus) {
        inputRef.current?.focus()
      }
    },
    [currency.currencyCode, inputRef, onOpenChange, settle, stopPointerGesture]
  )

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
      if (event.touches.length !== 1) {
        origin = null
        cancelPointerGesture()
        return
      }

      if (isNativeInputInteraction(event.target, "touch")) {
        origin = null
        return
      }

      const touch = event.touches[0]
      origin = { id: touch.identifier, x: touch.clientX, y: touch.clientY }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!origin || !pointerSession.current) {
        return
      }

      if (event.touches.length !== 1) {
        origin = null
        cancelPointerGesture()
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
      // A preference change replaces these listeners; finish their old session first.
      if (pointerSession.current) {
        cancelPointerGesture()
      }
      surface.removeEventListener("touchstart", handleTouchStart)
      surface.removeEventListener("touchmove", handleTouchMove)
      surface.removeEventListener("touchend", handleTouchEnd)
      surface.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [canSwipe, cancelPointerGesture])

  // Reconcile props without restarting the spring already started on release.
  useEffect(() => {
    if (!canSwipe) {
      stopPointerGesture()
      settle(false, 0, isReordering)
    } else if (
      !removing.current &&
      (targetOpen.current !== isRevealed || reducedMotion)
    ) {
      settle(isRevealed)
    }
  }, [
    isReordering,
    canSwipe,
    isRevealed,
    reducedMotion,
    settle,
    stopPointerGesture,
  ])

  useEffect(() => {
    return () => {
      clearPointerSession()
      dragControls.cancel()
      x.stop()
    }
  }, [clearPointerSession, dragControls, x])

  useEffect(() => {
    const element = ref.current
    if (!element || !canSwipe) {
      return
    }

    // Keep one wheel axis until the trackpad's inertial tail stops.
    let axis: "x" | "y" | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let interrupted = false

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    }

    const interrupt = (event: Event) => {
      if (axis === "x") {
        // Ignore the remaining wheel tail after a click or key takes over.
        interrupted = true
        if (event instanceof KeyboardEvent && event.key === "Escape") {
          event.preventDefault()
          settle(false)
          openChangeRef.current(currency.currencyCode, false)
        } else {
          settle(targetOpen.current)
        }
      }
    }

    const stopListeningForInterrupt = () => {
      document.removeEventListener("pointerdown", interrupt, true)
      document.removeEventListener("keydown", interrupt, true)
      window.removeEventListener("blur", interrupt)
    }

    const finish = () => {
      stopListeningForInterrupt()
      if (axis === "x" && !interrupted) {
        const open = x.get() < -ACTION_WIDTH / 2
        settle(open, x.getVelocity())
        openChangeRef.current(currency.currencyCode, open)
      }

      axis = null
      timer = null
      interrupted = false
    }

    const handleWheel = (event: WheelEvent) => {
      // Ctrl+wheel includes trackpad pinch-to-zoom.
      if (event.ctrlKey || pointerSession.current || removing.current) {
        return
      }

      const dx = Math.abs(event.deltaX)
      const dy = Math.abs(event.deltaY)
      if (!axis && Math.max(dx, dy) >= 1) {
        axis = dx > dy ? "x" : "y"
        if (axis === "x") {
          document.addEventListener("pointerdown", interrupt, true)
          document.addEventListener("keydown", interrupt, true)
          window.addEventListener("blur", interrupt)
        }
      }

      if (!axis) {
        return
      }

      clearTimer()
      timer = setTimeout(finish, WHEEL_IDLE_DELAY)

      if (axis !== "x" || !event.cancelable) {
        return
      }

      event.preventDefault()
      if (interrupted) {
        return
      }

      x.stop()
      const unit = getWheelUnit(event, element.clientWidth)
      // Wheel gestures reveal the action; inertial scrolling never deletes.
      x.set(Math.max(-ACTION_WIDTH, Math.min(0, x.get() - event.deltaX * unit)))
    }

    element.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      clearTimer()
      if (axis === "x") {
        x.jump(targetOpen.current ? -ACTION_WIDTH : 0)
      }

      element.removeEventListener("wheel", handleWheel)
      stopListeningForInterrupt()
    }
  }, [canSwipe, currency.currencyCode, settle, x])

  useEffect(() => {
    if (!isRevealed) {
      return
    }

    const element = ref.current
    if (!element) {
      return
    }
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !element.contains(event.target)) {
        close()
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      const target = event.target
      if (
        event.key === "Escape" &&
        target instanceof Node &&
        // A pointer can leave focus on the row or body instead of its inner surface.
        (element.contains(target) || target.contains(element))
      ) {
        event.preventDefault()
        close(true)
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    document.addEventListener("keydown", closeOnEscape, true)

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      document.removeEventListener("keydown", closeOnEscape, true)
    }
  }, [isRevealed, close])

  const handleDragEnd = (event: PointerEvent, info: PanInfo) => {
    if (!isSessionEvent(pointerSession.current, event)) {
      return
    }

    clearPointerSession()
    if (
      !canSwipe ||
      event.type === "pointercancel" ||
      dragDirection.current !== "x"
    ) {
      updateReadyToDelete(false)
      settle(isRevealed)
      return
    }

    if (isReadyToDelete.current) {
      // Commit on release; reversing before release can still cancel deletion.
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

  const handlePointerDownCapture: PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (!event.isPrimary) {
      return
    }

    if (pointerSession.current) {
      cancelPointerGesture()
    }
    suppressClick.current = false
    dragDirection.current = null
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
    if (
      !canSwipe ||
      !event.isPrimary ||
      event.button !== 0 ||
      isNativeInputInteraction(event.target, event.pointerType)
    ) {
      return
    }

    if (event.pointerType !== "touch") {
      // Preserve the amount's focus; a browser mousedown blur would cancel the swipe.
      event.preventDefault()
    }

    const handleRelease = (release: PointerEvent) => {
      const session = pointerSession.current
      if (!session || !isSessionEvent(session, release)) {
        return
      }

      if (release.type === "pointercancel") {
        cancelPointerGesture()
        return
      }

      // Motion delivers onDragEnd after rendering. A tap has no onDragEnd,
      // so restore the snap target if that callback hasn't finished the session.
      session.releaseFrame = requestAnimationFrame(() => {
        if (pointerSession.current === session) {
          cancelPointerGesture()
        }
      })
    }

    // Finish even when the pointer leaves the card or the window loses focus.
    const handleWindowBlur = () => cancelPointerGesture()
    const handleEscape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") {
        keyEvent.preventDefault()
        close(true)
      }
    }
    const handleAdditionalPointer = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerSession.current?.pointer.pointerId) {
        cancelPointerGesture()
      }
    }
    window.addEventListener("pointerup", handleRelease)
    window.addEventListener("pointercancel", handleRelease)
    window.addEventListener("blur", handleWindowBlur)
    window.addEventListener("keydown", handleEscape, true)
    window.addEventListener("pointerdown", handleAdditionalPointer, true)

    pointerSession.current = {
      pointer: event.nativeEvent,
      releaseFrame: null,
      removeListeners: () => {
        window.removeEventListener("pointerup", handleRelease)
        window.removeEventListener("pointercancel", handleRelease)
        window.removeEventListener("blur", handleWindowBlur)
        window.removeEventListener("keydown", handleEscape, true)
        window.removeEventListener("pointerdown", handleAdditionalPointer, true)
      },
    }

    x.stop()
    const position = x.get()
    // Rebase elastic boundaries to the caught position, so the next move is continuous.
    setDragBounds({
      left: Math.min(isRevealed ? -ACTION_WIDTH : 0, position),
      right: Math.max(0, position),
    })
    // Touch can start a swipe on an amount that isn't being edited.
    dragControls.start(event, { distanceThreshold: DRAG_THRESHOLD })
  }

  const handleDragStart = (event: PointerEvent, info: PanInfo) => {
    if (!isSessionEvent(pointerSession.current, event)) {
      return
    }

    // Choose the dominant axis once; later vertical drift doesn't cancel a swipe.
    const horizontal = dragDirection.current
      ? dragDirection.current === "x"
      : Math.abs(info.offset.x) > Math.abs(info.offset.y)
    dragDirection.current = horizontal ? "x" : "y"
    suppressClick.current = horizontal

    if (horizontal) {
      updateReadyToDeleteFromPosition(x.get())
    } else {
      cancelPointerGesture()
    }
  }

  // The border stays fixed; only the inner surface follows the swipe.
  return (
    <div
      ref={ref}
      className="relative min-w-0 flex-1 rounded-lg border bg-background"
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
          className={cn(
            "relative z-10",
            canSwipe && "touch-pan-y touch-pinch-zoom"
          )}
          initial={false}
          style={{
            x: isReordering ? 0 : x,
          }}
          onPointerDown={handlePointerDown}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Keep the touch target mounted; overlay plain text during reorder. */}
          <div className={isReordering ? "invisible" : undefined}>
            <CurrencyInput
              inputRef={inputRef}
              currency={currency}
              disabled={disabled}
              {...props}
              readOnly={isReordering || props.readOnly}
            />
          </div>
          {isReordering && (
            <div className="pointer-events-none absolute inset-0">
              <CurrencyDisplay
                currency={currency}
                value={String(props.value ?? "")}
                hasTrailingControl={props.hasTrailingControl}
              />
            </div>
          )}
        </motion.div>
        <motion.div
          skullet-ignore=""
          aria-hidden={!isRevealed}
          inert={!isRevealed}
          className="absolute inset-y-1 right-1 z-20"
          style={{
            width: actionWidth,
            x: actionX,
          }}
        >
          <Button
            ref={deleteButtonRef}
            type="button"
            tabIndex={-1}
            disabled={!canRemove || disabled || areActionsDisabled}
            aria-label={`Remove ${currency.currencyCode}`}
            variant="destructive"
            className="relative size-full rounded-md border-destructive/20 p-0 focus-visible:ring-inset motion-reduce:transition-none motion-reduce:active:scale-100!"
            onClick={() => onRemove(currency)}
          >
            <motion.span
              className="absolute top-1/2 left-0 flex size-5 -translate-y-1/2 items-center justify-center"
              style={{
                x: iconX,
              }}
            >
              <Trash className="size-5" aria-hidden="true" />
            </motion.span>
          </Button>
        </motion.div>
      </div>
      {trailingControl}
    </div>
  )
}

export { SwipeableInput }
