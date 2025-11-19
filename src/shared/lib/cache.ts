import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// Hybrid storage: Preferences on native, localStorage on web
const storage = {
  async get (key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key })
      return value ?? null
    }
    return localStorage.getItem(key)
  },
  async set (key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value })
      return
    }
    localStorage.setItem(key, value)
  },
  async remove (key: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key })
      return
    }
    localStorage.removeItem(key)
  }
}

export type CacheKeys = {
  loadedKey: string
  cacheKey: string
}

export type CreateCacheOptions<T> = {
  keys?: Partial<CacheKeys>
  /** function to extract the id string from a T item for merging/deduping */
  idSelector?: (item: T) => string
}

const DEFAULT_KEYS: CacheKeys = {
  loadedKey: 'LoadedItems',
  cacheKey: 'CachedItems'
}

/**
 * Generic cache factory for small JSON-backed caches. Uses Capacitor Preferences on native
 * and localStorage on web. Provides helpers for loading/saving an array cache as well as a
 * "loaded ids" set which some callers use for incremental loads.
 */
export function createCache<T> (options: CreateCacheOptions<T> = {}) {
  const keys: CacheKeys = {
    loadedKey: options.keys?.loadedKey ?? DEFAULT_KEYS.loadedKey,
    cacheKey: options.keys?.cacheKey ?? DEFAULT_KEYS.cacheKey
  }

  const idSelector = options.idSelector

  async function loadLoadedIds (): Promise<Set<string>> {
    try {
      const raw = await storage.get(keys.loadedKey)
      if (!raw) return new Set()
      const arr: string[] = JSON.parse(raw)
      return new Set(arr)
    } catch {
      return new Set()
    }
  }

  async function saveLoadedIds (ids: Set<string>): Promise<void> {
    try {
      const arr = Array.from(ids)
      await storage.set(keys.loadedKey, JSON.stringify(arr))
    } catch {
      // no-op
    }
  }

  async function loadCache (): Promise<T[]> {
    try {
      const raw = await storage.get(keys.cacheKey)
      if (!raw) return []
      const arr: T[] = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }

  async function saveCache (items: T[]): Promise<void> {
    try {
      await storage.set(keys.cacheKey, JSON.stringify(items))
    } catch {
      // no-op
    }
  }

  async function addToCache (newItems: T[]): Promise<void> {
    if (!idSelector) {
      // Without an id selector we can't dedupe reliably; append and save
      const current = await loadCache()
      await saveCache([...newItems, ...current])
      return
    }

    const current = await loadCache()
    const byId = new Map<string, T>()
    for (const p of [...newItems, ...current]) {
      byId.set(idSelector(p), p)
    }
    const merged = Array.from(byId.values())
    await saveCache(merged)
  }

  async function clearCache (): Promise<void> {
    try {
      await storage.remove(keys.loadedKey)
      await storage.remove(keys.cacheKey)
    } catch {
      // no-op
    }
  }

  return {
    keys,
    loadLoadedIds,
    saveLoadedIds,
    loadCache,
    saveCache,
    addToCache,
    clearCache
  }
}

export default createCache
