import { FC, MouseEventHandler, ReactNode } from "react"
import Bowser from "bowser"
import { ArrowUpDown, Trash } from "lucide-react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import KBD from "@/components/ui/KBD"

interface InputContextMenuProps {
  disabled: boolean
  isDeleteDisabled?: boolean
  onEditModeClick: MouseEventHandler<HTMLDivElement>
  onDeleteClick: MouseEventHandler<HTMLDivElement>
  children: ReactNode
}

const InputContextMenu: FC<InputContextMenuProps> = ({
  disabled,
  isDeleteDisabled,
  onEditModeClick,
  onDeleteClick,
  children,
}) => {
  // Rows are rendered on the server too, where there is no user agent. The menu
  // content renders only once opened, so it never differs on hydration.
  const parser =
    typeof window === "undefined"
      ? null
      : Bowser.getParser(window.navigator.userAgent)
  const isDesktop = parser?.getPlatformType() === "desktop"
  const isMac = parser?.getOSName() === "macOS"

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={disabled}>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-40">
        <ContextMenuItem
          className="cursor-pointer max-md:p-3"
          onClick={onEditModeClick}
        >
          <ArrowUpDown />
          Reorder
        </ContextMenuItem>
        <ContextMenuItem
          variant="destructive"
          disabled={isDeleteDisabled}
          className="cursor-pointer max-md:p-3"
          onClick={onDeleteClick}
        >
          <Trash />
          Delete
          {isDesktop ? (
            <div className="ml-auto flex gap-1">
              <KBD>{isMac ? "⌘" : "CTRL"}</KBD>
              <KBD>Shift</KBD>
              <KBD>⌫</KBD>
            </div>
          ) : null}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default InputContextMenu
