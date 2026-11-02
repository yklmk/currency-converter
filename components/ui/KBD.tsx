import { ComponentType, PropsWithChildren } from "react"

interface Props {}

const KBD: ComponentType<PropsWithChildren<Props>> = ({ children }) => {
  return (
    <kbd className="inline-flex h-5 w-auto min-w-4 shrink-0 select-none items-center justify-center whitespace-nowrap rounded-sm bg-kbd p-1 font-sans text-xs text-foreground">
      {children}
    </kbd>
  )
}

export default KBD
