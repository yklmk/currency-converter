import { Currency } from "@/types/currency"

import InputContextMenu from "./context-menu"
import { DraggableInput, DraggableInputProps } from "./draggable-input"
import { ReorderItem, ReorderItemProps } from "./reorderItem"

type InputProps = DraggableInputProps &
  Omit<ReorderItemProps<Currency>, "children" | "value" | "label"> & {
    onEditModeClick: () => void
  }

const Input = ({
  currency,
  value,
  canRemove,
  isOpen,
  showControls,
  dragConstraints,
  onEditModeClick,
  onRemove,
  ...props
}: InputProps) => (
  <ReorderItem
    value={currency}
    label={`Reorder ${currency.currencyCode}`}
    showControls={showControls}
    dragConstraints={dragConstraints}
  >
    <InputContextMenu
      disabled={showControls}
      isDeleteDisabled={!canRemove}
      onEditModeClick={onEditModeClick}
      onDeleteClick={() => onRemove(currency)}
    >
      <div className="min-w-0 flex-1">
        <DraggableInput
          value={value}
          currency={currency}
          canRemove={canRemove}
          isOpen={isOpen}
          disabled={showControls}
          onRemove={onRemove}
          {...props}
        />
      </div>
    </InputContextMenu>
  </ReorderItem>
)

export { Input }
