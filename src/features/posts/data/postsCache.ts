import type { PublicPost } from '@/features/posts/types/post'
import createCache, { type CacheKeys } from '@/shared/lib/cache'

export type PostCacheKeys = {
  loadedKey: string
  cacheKey: string
}

const DEFAULT_KEYS: PostCacheKeys = {
  loadedKey: 'LoadedPosts',
  cacheKey: 'CachedPublicPosts'
}

// default scoped cache instance used by convenience functions below
const defaultPostsCache = createCache<PublicPost>({
  keys: { loadedKey: DEFAULT_KEYS.loadedKey, cacheKey: DEFAULT_KEYS.cacheKey },
  idSelector: p => p.post_id
})

// Backwards-compatible wrappers that accept optional keys (like the original API)
export async function loadLoadedPostIds (
  keys: PostCacheKeys = DEFAULT_KEYS
): Promise<Set<string>> {
  if (
    keys.loadedKey === DEFAULT_KEYS.loadedKey &&
    keys.cacheKey === DEFAULT_KEYS.cacheKey
  ) {
    return defaultPostsCache.loadLoadedIds()
  }
  const c = createCache<PublicPost>({
    keys: keys as CacheKeys,
    idSelector: p => p.post_id
  })
  return c.loadLoadedIds()
}

export async function saveLoadedPostIds (
  ids: Set<string>,
  keys: PostCacheKeys = DEFAULT_KEYS
): Promise<void> {
  if (
    keys.loadedKey === DEFAULT_KEYS.loadedKey &&
    keys.cacheKey === DEFAULT_KEYS.cacheKey
  ) {
    return defaultPostsCache.saveLoadedIds(ids)
  }
  const c = createCache<PublicPost>({
    keys: keys as CacheKeys,
    idSelector: p => p.post_id
  })
  return c.saveLoadedIds(ids)
}

export async function loadCachedPublicPosts (
  keys: PostCacheKeys = DEFAULT_KEYS
): Promise<PublicPost[]> {
  if (
    keys.loadedKey === DEFAULT_KEYS.loadedKey &&
    keys.cacheKey === DEFAULT_KEYS.cacheKey
  ) {
    return defaultPostsCache.loadCache()
  }
  const c = createCache<PublicPost>({
    keys: keys as CacheKeys,
    idSelector: p => p.post_id
  })
  return c.loadCache()
}

export async function saveCachedPublicPosts (
  posts: PublicPost[],
  keys: PostCacheKeys = DEFAULT_KEYS
): Promise<void> {
  if (
    keys.loadedKey === DEFAULT_KEYS.loadedKey &&
    keys.cacheKey === DEFAULT_KEYS.cacheKey
  ) {
    return defaultPostsCache.saveCache(posts)
  }
  const c = createCache<PublicPost>({
    keys: keys as CacheKeys,
    idSelector: p => p.post_id
  })
  return c.saveCache(posts)
}

export async function addPostsToCache (
  newPosts: PublicPost[],
  keys: PostCacheKeys = DEFAULT_KEYS
): Promise<void> {
  if (
    keys.loadedKey === DEFAULT_KEYS.loadedKey &&
    keys.cacheKey === DEFAULT_KEYS.cacheKey
  ) {
    return defaultPostsCache.addToCache(newPosts)
  }
  const c = createCache<PublicPost>({
    keys: keys as CacheKeys,
    idSelector: p => p.post_id
  })
  return c.addToCache(newPosts)
}

export async function clearPostsCache (
  keys: PostCacheKeys = DEFAULT_KEYS
): Promise<void> {
  if (
    keys.loadedKey === DEFAULT_KEYS.loadedKey &&
    keys.cacheKey === DEFAULT_KEYS.cacheKey
  ) {
    return defaultPostsCache.clearCache()
  }
  const c = createCache<PublicPost>({
    keys: keys as CacheKeys,
    idSelector: p => p.post_id
  })
  return c.clearCache()
}

// Convenience factory to create a scoped cache instance with custom keys
export function createPostCache (customKeys: Partial<PostCacheKeys> = {}) {
  const keys: PostCacheKeys = {
    loadedKey: customKeys.loadedKey ?? DEFAULT_KEYS.loadedKey,
    cacheKey: customKeys.cacheKey ?? DEFAULT_KEYS.cacheKey
  }
  const c = createCache<PublicPost>({
    keys: keys as CacheKeys,
    idSelector: p => p.post_id
  })

  // return the old API shape
  return {
    loadLoadedPostIds: () => c.loadLoadedIds(),
    saveLoadedPostIds: (ids: Set<string>) => c.saveLoadedIds(ids),
    loadCachedPublicPosts: () => c.loadCache(),
    saveCachedPublicPosts: (posts: PublicPost[]) => c.saveCache(posts),
    addPostsToCache: (newPosts: PublicPost[]) => c.addToCache(newPosts),
    clearPostsCache: () => c.clearCache()
  }
}
