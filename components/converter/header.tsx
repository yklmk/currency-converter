import { ReactElement, RefObject, useLayoutEffect } from "react"
import { Check, Pencil, Plus } from "lucide-react"
import { useSpring } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MotionButton } from "@/components/ui/motion-button"
import { ThemeToggle } from "@/components/theme-toggle"

const HEADER_BUTTON_CLASSES =
  "relative after:absolute after:top-1/2 after:left-1/2 after:h-11 after:w-full after:min-w-11 after:-translate-1/2 motion-reduce:active:scale-100!"

const HEADER_MORPH_SPRING = {
  // useSpring's generator takes milliseconds, unlike Motion transition props.
  duration: 260,
  bounce: 0,
}

interface ConverterHeaderProps {
  isEditing: boolean
  reducedMotion: boolean
  canAddCurrency: boolean
  addButtonRef: RefObject<HTMLButtonElement | null>
  onToggleEditing: () => void
  onAddCurrency: () => void
}

export function ConverterHeader({
  isEditing,
  reducedMotion,
  canAddCurrency,
  addButtonRef,
  onToggleEditing,
  onAddCurrency,
}: ConverterHeaderProps): ReactElement {
  const headerWidth = useSpring(32, HEADER_MORPH_SPRING)

  useLayoutEffect(() => {
    const target = isEditing ? 76 : 32
    if (reducedMotion) {
      headerWidth.jump(target)
    } else {
      headerWidth.set(target)
    }
  }, [headerWidth, isEditing, reducedMotion])

  return (
    <div className="flex items-center justify-between border-b p-2">
      <ThemeToggle className={HEADER_BUTTON_CLASSES} />
      <div
        data-editing={isEditing}
        // Reserve both slots so the rest of the header stays still.
        className="group/actions relative h-8 w-19 contain-layout"
      >
        <MotionButton
          variant="outline"
          size="icon"
          initial={false}
          style={{ width: headerWidth }}
          aria-label={isEditing ? "Done editing currencies" : "Edit currencies"}
          onClick={onToggleEditing}
          // Keep the same focus target and avoid a competing CSS press scale.
          className={cn(
            HEADER_BUTTON_CLASSES,
            "absolute top-0 left-0 z-10 rounded-[8px] active:scale-100!"
          )}
        >
          {/* Clip the labels, keeping the extended hit area outside.
              Delay the incoming label so both aren't readable at once. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          >
            {/* Keep the opacity delay separate from the pencil's movement. */}
            <span className="absolute top-1/2 left-0 flex -translate-y-1/2 transform-[translateX(7px)] transition-transform duration-(--duration-enter) ease-(--ease-out-quad) will-change-transform group-data-[editing=true]/actions:transform-[translateX(29px)] motion-reduce:transition-none">
              <Pencil className="opacity-100 transition-opacity delay-50 duration-(--duration-enter) ease-(--ease-out-quad) will-change-[opacity] group-data-[editing=true]/actions:opacity-0 group-data-[editing=true]/actions:delay-0 group-data-[editing=true]/actions:duration-(--duration-exit)" />
            </span>
            <span className="absolute top-1/2 left-2.25 flex -translate-y-1/2 transform-[translateX(-4px)] items-center gap-1.5 opacity-0 transition-[opacity,transform] duration-(--duration-exit) ease-(--ease-out-quad) will-change-[transform,opacity] group-data-[editing=true]/actions:transform-[translateX(0)] group-data-[editing=true]/actions:opacity-100 group-data-[editing=true]/actions:delay-30 group-data-[editing=true]/actions:duration-(--duration-enter) motion-reduce:transform-none">
              <Check />
              Done
            </span>
          </span>
        </MotionButton>
        <Button
          ref={addButtonRef}
          variant="outline"
          size="icon"
          disabled={isEditing || !canAddCurrency}
          aria-label="Add currency"
          aria-hidden={isEditing}
          inert={isEditing}
          className={cn(
            HEADER_BUTTON_CLASSES,
            "absolute top-0 right-0 transform-[translateX(0)] opacity-100 transition-[opacity,transform,scale,color,background-color,border-color,box-shadow] duration-(--duration-enter) ease-(--ease-out-quad) group-data-[editing=true]/actions:pointer-events-none group-data-[editing=true]/actions:transform-[translateX(-12px)] group-data-[editing=true]/actions:opacity-0! motion-reduce:transform-none! motion-reduce:transition-[opacity,color,background-color,border-color,box-shadow]"
          )}
          onClick={onAddCurrency}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
