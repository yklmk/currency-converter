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
          className="cursor-pointer gap-2 p-3 text-sm select-none md:px-2 md:py-1.5"
          onClick={onEditModeClick}
        >
          <span className="flex w-full items-center gap-2">
            <ArrowUpDown size={16} />
            Reorder
          </span>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={isDeleteDisabled}
          className="cursor-pointer gap-5 p-3 text-sm text-destructive select-none focus:text-destructive md:px-2 md:py-1.5"
          onClick={onDeleteClick}
        >
          <span className="flex w-full items-center gap-2">
            <Trash size={16} />
            Delete
          </span>
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
