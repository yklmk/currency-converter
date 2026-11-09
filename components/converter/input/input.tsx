import { Currency, CurrencyCode } from "@/types/currency"

import InputContextMenu from "./context-menu"
import { DraggableInput } from "./draggable-input"
import { ReorderItem, ReorderItemProps } from "./reorderItem"

interface InputProps {
  currency: Currency
  value: string
  maxLength: number
  canRemove: boolean
  isOpen: boolean
  showControls: boolean
  dragConstraints: ReorderItemProps<Currency>["dragConstraints"]
  onValueChange: (value: string) => void
  onOpenChange: (currencyCode: CurrencyCode, isOpen: boolean) => void
  onEditModeClick: () => void
  onRemove: (currency: Currency) => void
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
  maxLength,
  onValueChange,
  onOpenChange,
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
          maxLength={maxLength}
          onValueChange={onValueChange}
          onOpenChange={onOpenChange}
          onRemoveShortcut={canRemove ? onRemove : undefined}
        />
      </div>
    </InputContextMenu>
  </ReorderItem>
)

export { Input }
