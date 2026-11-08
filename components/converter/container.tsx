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
        "relative flex min-h-125 w-full max-w-125 flex-col rounded-[calc(var(--radius-lg)+(--spacing(2))+1px)] border border-transparent bg-background smooth-shadow-ring-md",
        className
      )}
    >
      {children}
    </div>
  )
}
