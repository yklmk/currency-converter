import { useOnlineStatus } from "@/hooks/use-online-status"
import { Indicator } from "@/components/ui/indicator"

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

interface RatesStatusProps {
  updatedAt: string
  isStale: boolean
  isUpdating: boolean
}

export function RatesStatus({
  updatedAt,
  isStale,
  isUpdating,
}: RatesStatusProps) {
  const isOnline = useOnlineStatus()

  if (isOnline && !isStale) {
    return null
  }

  const date = dateFormat.format(new Date(updatedAt))

  // Fresh rates are on their way, don't alarm the user with the outdated date.
  if (isOnline && isUpdating) {
    return (
      <div role="status" className="text-muted-foreground pl-2">
        <Indicator state="default" loading>
          Updating rates…
        </Indicator>
      </div>
    )
  }

  return (
    <div role="status" className="text-muted-foreground pl-2">
      <Indicator state={isStale ? "error" : "warning"}>
        {isOnline ? `Rates from ${date}` : `Offline · rates from ${date}`}
      </Indicator>
    </div>
  )
}
