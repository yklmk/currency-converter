"use client"

import { useEffect } from "react"

// Installed PWAs (especially on iOS) are resumed from the background instead of
// being reloaded, so the browser rarely checks for a new service worker on its
// own. Check on every return to the app; the new worker activates silently.
export function ServiceWorkerUpdater() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker
          .getRegistration()
          .then((registration) => registration?.update())
          .catch(() => {
            // Offline or the check failed, try again next time.
          })
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  return null
}
