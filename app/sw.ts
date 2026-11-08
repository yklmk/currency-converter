/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { NetworkFirst, NetworkOnly, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const PAGES_CACHE = "pages"

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Updates are applied silently, there is no "new version" prompt.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Online users always get a fresh page, offline users the cached one.
      matcher: ({ request, sameOrigin }) =>
        sameOrigin && request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE,
        networkTimeoutSeconds: 3,
      }),
    },
    {
      // Rates are never cached here: SWR keeps the last ones in localStorage
      // for offline use. A cached copy would hide that the request failed.
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname === "/api/rates",
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
})

// The first page load happens before the service worker controls the page, so
// it never reaches the runtime cache. Cache "/" on install to make the app work
// offline after a single online visit.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES_CACHE).then((cache) => cache.add("/")))
})

serwist.addEventListeners()
