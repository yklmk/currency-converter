import {
  KeyboardEventHandler,
  ReactElement,
  Ref,
  useLayoutEffect,
  useRef,
} from "react"
import { GripVertical, X } from "lucide-react"
import { DraggableProps, motion } from "motion/react"
import { flushSync } from "react-dom"

import { Currency, CurrencyCode } from "@/types/currency"
import { CurrencyAmount } from "@/lib/convert"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { LAYOUT_SPRING } from "../constants"
import ReorderItem from "./reorder-item"
import { SwipeableInput } from "./swipeable-input"

export type DragInput = "pointer" | "keyboard"

// Shared by the grip and the remove badge; each sets its own exit duration.
// Both stay mounted so CSS can reverse an unfinished transition, and will-change
// keeps their layers alive: without it iOS Safari drops the exit fade.
const EDIT_ACTION_CLASSES =
  "pointer-events-none text-muted-foreground opacity-0 ease-(--ease-out-quad) will-change-[transform,opacity] after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-1/2 active:scale-100 data-[visible=true]:pointer-events-auto data-[visible=true]:opacity-100 data-[visible=true]:duration-(--duration-enter)"

interface CurrencyRowProps {
  ref?: Ref<HTMLLIElement>
  currency: Currency
  position: number
  registerFocusTarget: (code: CurrencyCode, element: HTMLElement) => () => void
  onNavigate: (code: CurrencyCode, direction: -1 | 1) => void
  onKeyboardMove: (code: CurrencyCode, direction: -1 | 1) => void
  value: string
  maxLength: number
  canRemove: boolean
  isEditing: boolean
  reducedMotion: boolean
  isOpen: boolean
  isPointerDragging: boolean
  isKeyboardDragging: boolean
  isReorderActive: boolean
  dragConstraints: DraggableProps["dragConstraints"]
  onValueChange: (input: CurrencyAmount) => void
  onOpenChange: (currencyCode: CurrencyCode, isOpen: boolean) => void
  onRemove: (currency: Currency) => void
  instructionsId: string
  onDragStateChange: (
    currencyCode: CurrencyCode,
    input: DragInput,
    isDragging: boolean,
    cancelled?: boolean
  ) => void
}

function CurrencyRow({
  ref,
  currency,
  position,
  registerFocusTarget,
  onNavigate,
  onKeyboardMove,
  value,
  maxLength,
  canRemove,
  isEditing,
  reducedMotion,
  isOpen,
  isKeyboardDragging,
  isReorderActive,
  dragConstraints,
  onValueChange,
  onOpenChange,
  onRemove,
  onDragStateChange,
  instructionsId,
  isPointerDragging,
}: CurrencyRowProps): ReactElement {
  const isLifted = isKeyboardDragging || isPointerDragging
  const showHandle = isEditing && (!isReorderActive || isLifted)
  const showDelete = isEditing && canRemove && !isReorderActive
  const code = currency.currencyCode
  const inputRef = useRef<HTMLInputElement>(null)
  const moveButtonRef = useRef<HTMLButtonElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    // Register after child refs attach, and switch the target with the mode.
    const target = isEditing ? moveButtonRef.current : inputRef.current
    if (target) {
      return registerFocusTarget(code, target)
    }
  }, [code, isEditing, registerFocusTarget])

  useLayoutEffect(() => {
    if (isKeyboardDragging) {
      // Moving a row can blur its child button; restore focus before paint.
      moveButtonRef.current?.focus()
    }
  }, [isKeyboardDragging, position])

  const handleKeyDownCapture: KeyboardEventHandler<HTMLLIElement> = (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      (event.target !== moveButtonRef.current &&
        event.target !== deleteButtonRef.current &&
        event.target !== inputRef.current)
    ) {
      return
    }

    // Idle arrows navigate the active controls; a grabbed handle owns the arrows.
    if (!isReorderActive && ["ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault()
      onNavigate(code, event.key === "ArrowUp" ? -1 : 1)
    }
  }

  const handleMoveKeyDown: KeyboardEventHandler<HTMLButtonElement> = (
    event
  ) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return
    }

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      if (!event.repeat && (!isReorderActive || isKeyboardDragging)) {
        onDragStateChange(code, "keyboard", !isKeyboardDragging)
      }
      return
    }

    if (!isKeyboardDragging) {
      return
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault()
      onKeyboardMove(code, event.key === "ArrowUp" ? -1 : 1)
    } else if (event.key === "Escape") {
      event.preventDefault()
      onDragStateChange(code, "keyboard", false, true)
    } else if (event.key === "Tab") {
      // Restore controls before the browser chooses the native Tab/Shift+Tab target.
      flushSync(() => onDragStateChange(code, "keyboard", false, true))
    }
  }

  return (
    <ReorderItem
      ref={ref}
      focusTargetRef={isEditing ? moveButtonRef : inputRef}
      value={currency}
      // Motion's constraint observer resets transforms when the list height changes.
      // Enable bounds only for the pointer drag that actually needs them.
      dragConstraints={isPointerDragging ? dragConstraints : undefined}
      isLifted={isLifted}
      isPointerDragDisabled={isReorderActive && !isPointerDragging}
      isEditing={isEditing}
      reducedMotion={reducedMotion}
      label={`${code}, ${value || "0"}`}
      onKeyDownCapture={handleKeyDownCapture}
      onDragStateChange={(isDragging, cancelled) =>
        onDragStateChange(code, "pointer", isDragging, cancelled)
      }
    >
      {/* Lift the surface without changing the row's measured height. */}
      <motion.div
        data-lifted={isLifted}
        className={cn(
          "relative min-w-0 flex-1 rounded-lg outline-2 outline-offset-2 outline-transparent outline-solid has-[input:focus-visible]:outline-ring/50",
          // Keep the shadow outside Skullet's DOM reveal animations.
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:shadow-[0_16px_32px_-8px_rgb(0_0_0/0.28),0_4px_10px_-3px_rgb(0_0_0/0.18)] before:transition-opacity before:duration-220 before:ease-(--ease-out-quad) before:content-[''] data-[lifted=true]:before:opacity-100 data-[lifted=true]:before:duration-140 motion-reduce:before:transition-none",
          isPointerDragging ? "cursor-grabbing" : "cursor-grab",
          isLifted && "z-10"
        )}
        animate={{
          y: isLifted && !reducedMotion ? -6 : 0,
          scale: isLifted && !reducedMotion ? 1.025 : 1,
        }}
        transition={reducedMotion ? { duration: 0 } : LAYOUT_SPRING}
      >
        <SwipeableInput
          inputRef={inputRef}
          value={value}
          currency={currency}
          canRemove={canRemove}
          isOpen={isOpen}
          onRemove={onRemove}
          maxLength={maxLength}
          onValueChange={(value) =>
            onValueChange({ currencyCode: code, value })
          }
          onOpenChange={onOpenChange}
          areActionsDisabled={isReorderActive}
          isReordering={isPointerDragging}
          reducedMotion={reducedMotion}
          disabled={isEditing}
          hasTrailingControl={isEditing}
          trailingControl={
            <Button
              ref={moveButtonRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              skullet-ignore=""
              data-drag-handle=""
              data-visible={showHandle}
              aria-label={`Move ${code}`}
              aria-describedby={instructionsId}
              aria-pressed={isKeyboardDragging}
              aria-hidden={!showHandle}
              inert={!showHandle}
              tabIndex={showHandle ? 0 : -1}
              // Balance the visible button background against the amount; keep the 44px target.
              className={cn(
                EDIT_ACTION_CLASSES,
                "absolute top-1/2 right-3.25 z-20 w-8 transform-[translate(6px,-50%)] cursor-grab! touch-none transition-[opacity,transform] duration-(--duration-exit) data-[visible=true]:transform-[translate(0,-50%)] motion-reduce:transform-[translate(0,-50%)] motion-reduce:transition-opacity",
                isLifted && "cursor-grabbing!"
              )}
              onKeyDown={handleMoveKeyDown}
              onBlur={() => {
                if (isKeyboardDragging) {
                  onDragStateChange(code, "keyboard", false, true)
                }
              }}
            >
              <GripVertical className="size-3.5" aria-hidden="true" />
            </Button>
          }
        />

        <Button
          ref={deleteButtonRef}
          type="button"
          variant="secondary"
          size="icon-xs"
          skullet-ignore=""
          data-visible={showDelete}
          aria-label={`Remove ${code}`}
          aria-hidden={!showDelete}
          inert={!showDelete}
          tabIndex={showDelete ? 0 : -1}
          // Nothing moves into the badge's place, so its exit can stay readable longer.
          className={cn(
            EDIT_ACTION_CLASSES,
            "absolute -top-2 -left-2 z-30 size-5 transform-[scale(0.6)] rounded-full border-border transition-[opacity,transform,background-color] duration-180 data-[visible=true]:transform-[scale(1)] motion-reduce:transform-none motion-reduce:transition-[opacity,background-color]"
          )}
          onClick={() => onRemove(currency)}
        >
          <X className="size-2.5" aria-hidden="true" />
        </Button>
      </motion.div>
    </ReorderItem>
  )
}

export { CurrencyRow }
