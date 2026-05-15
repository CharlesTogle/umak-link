import { useState, useRef, useCallback } from 'react'
import { Network } from '@capacitor/network'
import { createPostCache } from '@/features/posts/data/postsCache'
import { listOwnPosts } from '@/features/posts/data/posts'
import { refreshOwnPosts } from '@/features/posts/data/postsRefresh'
import type { PublicPost } from '@/features/posts/types/post'

interface UseOwnPostsFetchingConfig {
  // Core dependency
  userId: string | null

  // Optional filters/transforms
  filterPosts?: (posts: PublicPost[]) => PublicPost[]

  // Pagination config
  pageSize?: number
  sortDirection?: 'asc' | 'desc'

  // Callbacks
  onError?: (error: Error) => void
  onOffline?: () => void
}

export function useOwnPostsFetching (config: UseOwnPostsFetchingConfig) {
  const [posts, setPosts] = useState<PublicPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const pageSize = config.pageSize ?? 5

  const isFetchingRef = useRef(false)
  const loadedIdsRef = useRef<Set<string>>(new Set())
  const cacheRef = useRef(
    createPostCache({
      loadedKey: 'LoadedPosts:history',
      cacheKey: 'CachedPublicPosts:history'
    })
  )
  const hasRefreshedCacheRef = useRef(false)

  // Reusable sort function
  const sortPosts = useCallback(
    (arr: PublicPost[]) => {
      return arr.sort((a, b) => {
        const A = a.submission_date ?? ''
        const B = b.submission_date ?? ''
        if (!A && !B) return 0
        if (!A) return 1
        if (!B) return -1
        const dir = config.sortDirection ?? 'desc'
        return dir === 'desc' ? B.localeCompare(A) : A.localeCompare(B)
      })
    },
    [config.sortDirection]
  )

  const applyFilter = useCallback(
    (incomingPosts: PublicPost[]) =>
      config.filterPosts ? config.filterPosts(incomingPosts) : incomingPosts,
    [config.filterPosts]
  )

  const mergeUniquePosts = useCallback(
    (incomingPosts: PublicPost[], existingPosts: PublicPost[]) => {
      const byId = new Map<string, PublicPost>()

      for (const post of [...incomingPosts, ...existingPosts]) {
        byId.set(post.post_id, post)
      }

      return sortPosts(Array.from(byId.values()))
    },
    [sortPosts]
  )

  const fetchOwnPostsPage = useCallback(
    async (excludeIds: string[]): Promise<PublicPost[]> => {
      if (!config.userId) return []

      const { posts: fetchedPosts } = await listOwnPosts({
        userId: config.userId,
        excludeIds,
        limit: pageSize
      })

      return applyFilter(fetchedPosts)
    },
    [applyFilter, config.userId, pageSize]
  )

  // Fetch newest posts (not loaded yet) and prepend them to the list
  const fetchNewPosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || !config.userId) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      const status = await Network.getStatus()
      if (!status.connected) {
        config.onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      const filteredPosts = await fetchOwnPostsPage(
        Array.from(loadedIdsRef.current)
      )

      if (filteredPosts.length > 0) {
        // Use functional update to avoid stale closure
        setPosts(prevPosts => {
          return mergeUniquePosts(filteredPosts, prevPosts)
        })

        // Add new post IDs to loaded set
        filteredPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

        // Add to cache
        await cacheRef.current.addPostsToCache(filteredPosts)
        await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)
      }
    } catch (error) {
      console.error('Error fetching new posts:', error)
      config.onError?.(error as Error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [config.onError, config.onOffline, config.userId, fetchOwnPostsPage, mergeUniquePosts])

  // Initial load: Load cache + refresh cached posts from Supabase
  const fetchPosts = useCallback(async (): Promise<void> => {
    console.log('Starting initial fetch of own posts...')
    if (isFetchingRef.current || !config.userId) {
      return
    }
    isFetchingRef.current = true
    setIsFetching(true)
    console.log('Fetching posts for user:', config.userId)
    try {
      // 1. Load from cache immediately for instant render
      const cachedPosts = await cacheRef.current.loadCachedPublicPosts()
      const cachedLoadedIds = await cacheRef.current.loadLoadedPostIds()

      if (cachedPosts.length > 0) {
        const filteredCache = applyFilter(cachedPosts)
        setPosts(sortPosts(filteredCache))
        loadedIdsRef.current = cachedLoadedIds
      }

      // 2. Check network status
      const status = await Network.getStatus()
      if (!status.connected) {
        // Use cache if offline
        setHasMore(false)
        config.onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      // 3. If we have cached posts and haven't refreshed them yet, refresh them
      if (
        cachedPosts.length > 0 &&
        !hasRefreshedCacheRef.current &&
        config.userId
      ) {
        const cachedIds = Array.from(cachedLoadedIds)

        // Refresh cached posts, then fetch any unseen posts beyond the cache.
        const refreshedPosts = applyFilter(
          await refreshOwnPosts(config.userId, cachedIds)
        )
        const unseenPosts = await fetchOwnPostsPage(
          refreshedPosts.map(post => post.post_id)
        )
        const mergedPosts = mergeUniquePosts(unseenPosts, refreshedPosts)

        if (mergedPosts.length > 0) {
          setPosts(mergedPosts)

          loadedIdsRef.current.clear()
          mergedPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

          await cacheRef.current.clearPostsCache()
          await cacheRef.current.saveCachedPublicPosts(mergedPosts)
          await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)

          hasRefreshedCacheRef.current = true
        } else {
          await cacheRef.current.clearPostsCache()
          loadedIdsRef.current.clear()
          setPosts(sortPosts([]))
        }
      }

      // 4. If there is no valid loaded cache, fetch the latest initial batch.
      if (loadedIdsRef.current.size === 0 && config.userId) {
        const filteredPosts = await fetchOwnPostsPage([])
        if (filteredPosts.length > 0) {
          setPosts(sortPosts(filteredPosts))

          // Track loaded IDs
          filteredPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

          // Save to cache
          await cacheRef.current.saveCachedPublicPosts(filteredPosts)
          await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)

          // Check if more posts available
          if (filteredPosts.length < pageSize) {
            setHasMore(false)
          }
        } else {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      config.onError?.(error as Error)

      // On error, use cache if available
      const cachedPosts = await cacheRef.current.loadCachedPublicPosts()
      if (cachedPosts.length > 0) {
        const filteredCache = applyFilter(cachedPosts)
        setPosts(sortPosts(filteredCache))
      }
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [applyFilter, config.onError, config.onOffline, config.userId, fetchOwnPostsPage, mergeUniquePosts, pageSize, sortPosts])

  // Load more posts - ONLY called by infinite scroll handler
  const loadMorePosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || !hasMore || !config.userId) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // Check network status
      const status = await Network.getStatus()
      if (!status.connected) {
        config.onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      const filteredPosts = await fetchOwnPostsPage(
        Array.from(loadedIdsRef.current)
      )

      if (filteredPosts.length > 0) {
        // Check if more posts available
        if (filteredPosts.length < pageSize) {
          setHasMore(false)
        }

        // Use functional update to avoid stale closure
        setPosts(prevPosts => {
          let merged: PublicPost[]
          if ((config.sortDirection ?? 'desc') === 'desc') {
            // Append new posts for newest-first
            merged = sortPosts([...prevPosts, ...filteredPosts])
          } else {
            // Prepend new posts for oldest-first
            merged = sortPosts([...filteredPosts, ...prevPosts])
          }
          return merged
        })

        // Add new post IDs to loaded set
        filteredPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

        // Incrementally add to cache
        await cacheRef.current.addPostsToCache(filteredPosts)
        await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)
      } else {
        // No more posts available
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more posts:', error)
      config.onError?.(error as Error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [config.onError, config.onOffline, config.userId, fetchOwnPostsPage, hasMore, pageSize, sortPosts])

  // Refresh function - only updates currently loaded posts
  const refreshPosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || !config.userId) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // Check network status
      const status = await Network.getStatus()
      if (!status.connected) {
        config.onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      // Refresh only currently loaded posts
      const loadedIds = Array.from(loadedIdsRef.current)

      if (loadedIds.length === 0) {
        const initialPosts = await fetchOwnPostsPage([])

        if (initialPosts.length > 0) {
          setPosts(sortPosts(initialPosts))
          loadedIdsRef.current.clear()
          initialPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

          await cacheRef.current.clearPostsCache()
          await cacheRef.current.saveCachedPublicPosts(initialPosts)
          await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)
          setHasMore(initialPosts.length >= pageSize)
        } else {
          await cacheRef.current.clearPostsCache()
          loadedIdsRef.current.clear()
          setPosts(sortPosts([]))
          setHasMore(false)
        }

        return
      }

      // Refresh current posts, then fetch unseen newest posts to avoid stale caches.
      const refreshedPosts = applyFilter(
        await refreshOwnPosts(config.userId, loadedIds)
      )
      const unseenPosts = await fetchOwnPostsPage(
        refreshedPosts.map(post => post.post_id)
      )
      const mergedPosts = mergeUniquePosts(unseenPosts, refreshedPosts)

      if (mergedPosts.length > 0) {
        setPosts(mergedPosts)

        loadedIdsRef.current.clear()
        mergedPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

        await cacheRef.current.clearPostsCache()
        await cacheRef.current.saveCachedPublicPosts(mergedPosts)
        await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)
      } else {
        await cacheRef.current.clearPostsCache()
        loadedIdsRef.current.clear()
        setPosts(sortPosts([]))
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error refreshing posts:', error)
      config.onError?.(error as Error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [applyFilter, config.onError, config.onOffline, config.userId, fetchOwnPostsPage, mergeUniquePosts, pageSize, sortPosts])

  // Calculate loading: true if fetching and no posts loaded yet
  const isLoading = posts.length === 0 && isFetching

  return {
    posts,
    setPosts,
    hasMore,
    fetchPosts, // Initial load: cache + refresh cached posts
    loadMorePosts, // Infinite scroll: fetch NEW posts only
    fetchNewPosts, // Fetch newest posts (used for pull-to-refresh / toolbar)
    refreshPosts, // Pull-to-refresh: update currently loaded posts
    loadedIdsRef,
    loading: isLoading
  }
}
