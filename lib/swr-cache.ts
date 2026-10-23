import type { Cache, State } from "swr"

const STORAGE_KEY = "swr-cache"

const persist = (map: Map<string, State>) => {
  // Only data is worth keeping: errors and loading flags belong to the session.
  const entries = [...map]
    .filter(([, state]) => state.data !== undefined)
    .map(([key, state]) => [key, { data: state.data }])

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage is full or unavailable, the in-memory cache still works.
  }
}

// SWR cache backed by localStorage, so fetched data survives reloads and is
// available offline. Writes go through on every change instead of waiting for
// beforeunload, which mobile browsers and installed PWAs often never fire.
export function localStorageProvider(): Cache {
  if (typeof window === "undefined") {
    return new Map()
  }

  let entries: [string, State][] = []

  try {
    entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    // Corrupted cache, start from scratch.
  }

  const map = new Map<string, State>(entries)

  return {
    keys: () => map.keys(),
    get: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value)
      persist(map)
    },
    delete: (key) => {
      map.delete(key)
      persist(map)
    },
  }
}
