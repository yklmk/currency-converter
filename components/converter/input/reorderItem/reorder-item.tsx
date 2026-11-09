import { ReactNode } from "react"
import { GripVertical } from "lucide-react"
import {
  AnimatePresence,
  DraggableProps,
  motion,
  Reorder,
  useDragControls,
  useIsPresent,
  useReducedMotion,
} from "motion/react"

import { Button } from "@/components/ui/button"

import { buttonVariants, itemVariants, reducedItemVariants } from "./variants"

export interface ReorderItemProps<T> {
  value: T
  dragConstraints: DraggableProps["dragConstraints"]
  showControls: boolean
  label: string
  children: ReactNode
}

const ReorderItem = <T,>({
  dragConstraints,
  value,
  showControls,
  label,
  children,
}: ReorderItemProps<T>) => {
  const controls = useDragControls()
  const isPresent = useIsPresent()
  const reducedMotion = useReducedMotion()

  return (
    <Reorder.Item
      dragConstraints={dragConstraints}
      dragElastic={0.2}
      whileDrag={{ scale: reducedMotion ? 1 : 1.03 }}
      value={value}
      dragControls={controls}
      dragListener={false}
      variants={reducedMotion ? reducedItemVariants : itemVariants}
      initial="initial"
      animate="visible"
      exit="hidden"
      className="relative mb-2 box-border flex w-full items-center gap-2 rounded-lg bg-transparent last:mb-0!"
      role="listitem"
      tabIndex={-1}
      inert={!isPresent}
    >
      {children}
      <AnimatePresence initial={false}>
        {showControls && (
          <Button
            asChild
            size="icon"
            variant="ghost"
            className={
              "h-auto w-6 shrink-0 cursor-grab touch-none self-stretch text-border transition-colors hover:bg-transparent hover:text-ring dark:hover:bg-transparent"
            }
            aria-label={label}
            onPointerDown={(e) => {
              e.currentTarget.style.cursor = "grabbing"
              controls.start(e, { snapToCursor: true })
            }}
            onPointerUp={(e) => (e.currentTarget.style.cursor = "grab")}
          >
            <motion.button
              variants={buttonVariants}
              initial="initial"
              animate="visible"
              exit="hidden"
            >
              <GripVertical className="size-6" />
            </motion.button>
          </Button>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

export default ReorderItem
