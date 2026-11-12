import {
  KeyboardEventHandler,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react"
import {
  DraggableProps,
  frame,
  Reorder,
  useComposedRefs,
  useDragControls,
  useIsPresent,
  useMotionValue,
} from "motion/react"
import { flushSync } from "react-dom"

import { Currency } from "@/types/currency"
import { cn } from "@/lib/utils"

import { LAYOUT_SPRING } from "../constants"
import { isNativeInputInteraction } from "./input-interaction"
import { itemVariants } from "./reorder-variants"

const DRAG_START_DISTANCE = 4
const HOLD_DELAY = 350
const HOLD_TOLERANCE = 8

interface DragSession {
  timer: ReturnType<typeof setTimeout> | null
  pointer: PointerEvent | null
  fromHandle: boolean
  isDragging: boolean
  suppressClick: boolean
}

interface ReorderItemProps {
  ref?: Ref<HTMLLIElement>
  focusTargetRef: RefObject<HTMLElement | null>
  dragConstraints: DraggableProps["dragConstraints"]
  value: Currency
  isLifted: boolean
  isPointerDragDisabled: boolean
  isEditing: boolean
  reducedMotion: boolean
  label: string
  onKeyDownCapture: KeyboardEventHandler<HTMLLIElement>
  onDragStateChange: (isDragging: boolean, cancelled?: boolean) => void
  children: ReactNode
}

function ReorderItem({
  ref: forwardedRef,
  focusTargetRef,
  dragConstraints,
  value,
  isLifted,
  isPointerDragDisabled,
  isEditing,
  reducedMotion,
  label,
  onKeyDownCapture,
  onDragStateChange,
  children,
}: ReorderItemProps): ReactElement {
  const dragControls = useDragControls()
  const isPresent = useIsPresent()
  const y = useMotionValue<number>(0)
  const ref = useRef<HTMLLIElement>(null)
  // popLayout measures this same DOM row before taking it out of flow.
  const composedRef = useComposedRefs(ref, forwardedRef)
  const sessionRef = useRef<DragSession>({
    timer: null,
    pointer: null,
    fromHandle: false,
    isDragging: false,
    suppressClick: false,
  })
  const effectLifetime = useRef<object | null>(null)
  const pointerDisabled = useRef<boolean>(isPointerDragDisabled)
  const sessionMode = useRef<boolean>(isEditing)
  const dragStateChangeRef =
    useRef<(isDragging: boolean, cancelled?: boolean) => void>(
      onDragStateChange
    )

  useLayoutEffect(() => {
    dragStateChangeRef.current = onDragStateChange
    pointerDisabled.current = isPointerDragDisabled
  }, [onDragStateChange, isPointerDragDisabled])

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const session = sessionRef.current
    const lifetime = {}
    effectLifetime.current = lifetime

    const clearHold = () => {
      if (session.timer !== null) {
        clearTimeout(session.timer)
        session.timer = null
      }
    }

    const finish = (cancelled = false) => {
      clearHold()
      detachPointerListeners()
      session.pointer = null

      if (session.isDragging) {
        session.isDragging = false
        dragStateChangeRef.current(false, cancelled)
      }
    }

    const cancel = () => {
      if (session.isDragging) {
        dragControls.cancel()
        // Motion resumes its paused snap animation at the end of pointercancel.
        // Reset after that handler so an older animation cannot keep the row offset.
        requestAnimationFrame(() => {
          if (!session.pointer) {
            y.jump(0)
          }
        })
      }
      finish(true)
    }

    const activate = (event: PointerEvent) => {
      if (pointerDisabled.current) {
        finish(true)
        return
      }
      clearHold()
      session.isDragging = true
      session.suppressClick = true
      // Stop swipe tracking before the vertical drag takes over.
      flushSync(() => dragStateChangeRef.current(true))
      if (isEditing) {
        // Pointer reorder and keyboard reorder share the same action's focus.
        focusTargetRef.current?.focus({ preventScroll: true })
      }
      dragControls.start(event, { distanceThreshold: 0 })
    }

    const start = (event: PointerEvent) => {
      if (pointerDisabled.current) {
        return
      }

      if (session.pointer) {
        cancel()
        return
      }

      session.suppressClick = false
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        isNativeInputInteraction(event.target, event.pointerType) ||
        (event.target instanceof Element &&
          // The move button doubles as a pointer handle; other buttons stay interactive.
          event.target.closest("button:not([data-drag-handle])"))
      ) {
        return
      }

      session.pointer = event
      session.fromHandle =
        event.target instanceof Element &&
        event.target.closest("[data-drag-handle]") !== null
      attachPointerListeners()

      if (event.pointerType !== "mouse" && !session.fromHandle) {
        // Touch needs a hold; moving first leaves the gesture to scroll/swipe.
        session.timer = setTimeout(() => activate(event), HOLD_DELAY)
      }
    }

    const move = (event: PointerEvent) => {
      if (
        !session.pointer ||
        event.pointerId !== session.pointer.pointerId ||
        session.isDragging
      ) {
        return
      }

      const dx = Math.abs(event.clientX - session.pointer.clientX)
      const dy = Math.abs(event.clientY - session.pointer.clientY)
      if (session.fromHandle) {
        // The dedicated handle starts on movement; a tap never picks up the row.
        if (Math.hypot(dx, dy) >= DRAG_START_DISTANCE) {
          event.preventDefault()
          activate(session.pointer)
        }
        return
      }
      if (session.pointer.pointerType === "mouse") {
        // A short vertical move starts reorder; horizontal movement belongs to swipe.
        if (dx >= DRAG_START_DISTANCE && dx >= dy) {
          finish()
          return
        }

        if (dy >= DRAG_START_DISTANCE && dy > dx) {
          event.preventDefault()
          activate(session.pointer)
        }
        return
      }

      if (Math.hypot(dx, dy) > HOLD_TOLERANCE) {
        finish()
      }
    }

    const end = (event: PointerEvent) => {
      const pointer = session.pointer
      if (!pointer || event.pointerId !== pointer.pointerId) {
        return
      }

      if (!session.isDragging) {
        finish()
        return
      }

      // Motion flushes the final pointer move in its next frame. Persist the
      // resulting order after its onDrag callback, including a move on release.
      frame.postRender(() => {
        if (session.pointer === pointer) {
          finish()
        }
      })
    }

    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId === session.pointer?.pointerId) {
        cancel()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        cancel()
      }
    }

    const handleAdditionalPointer = (event: PointerEvent) => {
      if (session.pointer && event.pointerId !== session.pointer.pointerId) {
        cancel()
      }
    }

    const attachPointerListeners = () => {
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", end)
      window.addEventListener("pointercancel", handlePointerCancel)
      window.addEventListener("blur", cancel)
      window.addEventListener("keydown", handleEscape, true)
      window.addEventListener("pointerdown", handleAdditionalPointer, true)
    }

    const detachPointerListeners = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", handlePointerCancel)
      window.removeEventListener("blur", cancel)
      window.removeEventListener("keydown", handleEscape, true)
      window.removeEventListener("pointerdown", handleAdditionalPointer, true)
    }

    const preventScroll = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        cancel()
      } else if (session.isDragging && event.cancelable) {
        // Preserve normal scrolling until the hold has activated reorder.
        event.preventDefault()
      }
    }

    const preventContextMenu = (event: Event) => {
      if (session.pointer || session.suppressClick) {
        event.preventDefault()
      }
    }

    const preventClick = (event: MouseEvent) => {
      if (session.suppressClick && event.detail !== 0) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    if (sessionMode.current !== isEditing) {
      // A mode change must also stop Motion's active pointer session.
      cancel()
      sessionMode.current = isEditing
    }

    element.addEventListener("pointerdown", start, true)
    element.addEventListener("touchmove", preventScroll, { passive: false })
    element.addEventListener("contextmenu", preventContextMenu)
    element.addEventListener("click", preventClick, true)

    if (session.pointer) {
      attachPointerListeners()
    }

    return () => {
      // React 19 Strict Mode replays effects when keyed rows move (#32561).
      // Keep the active session across that replay; cancel only on a real teardown.
      queueMicrotask(() => {
        if (effectLifetime.current === lifetime) {
          cancel()
        }
      })

      element.removeEventListener("pointerdown", start, true)
      element.removeEventListener("touchmove", preventScroll)
      element.removeEventListener("contextmenu", preventContextMenu)
      element.removeEventListener("click", preventClick, true)
      detachPointerListeners()
    }
  }, [dragControls, y, isEditing, focusTargetRef])

  return (
    <Reorder.Item
      ref={composedRef}
      value={value}
      dragControls={dragControls}
      dragConstraints={dragConstraints}
      dragElastic={0.2}
      dragListener={false}
      dragMomentum={false}
      layout="position"
      transition={{
        layout: reducedMotion ? { duration: 0 } : LAYOUT_SPRING,
      }}
      variants={itemVariants}
      initial="initial"
      animate="visible"
      exit="hidden"
      className={cn(
        // Also covers the plain-text drag preview; the amount input opts back in.
        "group/currency relative box-border flex min-h-min w-full shrink-0 items-center rounded-lg bg-transparent outline-none select-none [-webkit-touch-callout:none] [-webkit-user-select:none]",
        isLifted && "z-20!"
      )}
      data-currency-code={value.currencyCode}
      role="listitem"
      aria-label={label}
      tabIndex={isEditing ? undefined : -1}
      onKeyDown={(event) => {
        // Keyboard reordering belongs to the move button, not the list item.
        if (event.target === event.currentTarget && event.key === " ") {
          event.preventDefault()
        }
      }}
      onKeyDownCapture={onKeyDownCapture}
      onLayoutAnimationComplete={() => {
        const element = ref.current
        if (
          element &&
          element.contains(document.activeElement) &&
          !sessionRef.current.isDragging
        ) {
          // Keep keyboard focus visible without interfering with pointer autoscroll.
          element.scrollIntoView({ block: "nearest", inline: "nearest" })
        }
      }}
      inert={!isPresent}
      style={{ y }}
    >
      {children}
    </Reorder.Item>
  )
}

export default ReorderItem
