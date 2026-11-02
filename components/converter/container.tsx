import { PropsWithChildren } from "react"

import { cn } from "@/lib/utils"

interface ContainerProps {
  className?: string
}

export default function Container({
  className,
  children,
}: PropsWithChildren<ContainerProps>) {
  return (
    <div
      className={cn(
        "relative flex min-h-[500px] w-full max-w-[500px] flex-col rounded-xl border bg-background shadow-md",
        className
      )}
    >
      {children}
    </div>
  )
}
