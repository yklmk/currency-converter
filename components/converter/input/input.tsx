import { MotionProps } from "motion/react"

import { DraggableInput, DraggableInputProps } from "./draggable-input"
import { ReorderItem, ReorderItemProps } from "./reorderItem"

type InputProps<T> = DraggableInputProps &
  Omit<ReorderItemProps<T>, "children"> & {}

const Input = <T,>({
  currency,
  value,
  draggable,
  isDragged,
  showControls,
  dragConstraints,
  ...props
}: InputProps<T>) => {
  const motionProps: MotionProps = {
    animate: {
      width: showControls ? "90%" : "100%",
    },
  }

  return (
    <ReorderItem
      value={currency}
      showControls={showControls}
      dragConstraints={dragConstraints}
    >
      <DraggableInput
        value={value}
        currency={currency}
        draggable={draggable && !showControls}
        isDragged={isDragged}
        disabled={showControls || isDragged}
        motionProps={motionProps}
        {...props}
      />
    </ReorderItem>
  )
}

export { Input }
