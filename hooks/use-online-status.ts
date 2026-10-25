"use client"

import { useSyncExternalStore } from "react"

const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)

  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

// navigator.onLine can report "online" without a working connection, but
// "offline" is reliable, which is all the offline indicator needs.
export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  )
}
