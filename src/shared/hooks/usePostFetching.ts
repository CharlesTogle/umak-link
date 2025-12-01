import { useState, useRef, useCallback } from 'react'
import { Network } from '@capacitor/network'
import { createPostCache } from '@/features/posts/data/postsCache'
import type { PublicPost } from '@/features/posts/types/post'

interface usePostFetchingConfig {
  // Core dependencies
  fetchFunction: (excludeIds: string[], limit: number) => Promise<PublicPost[]>
  refreshPostFunction: (includeIds: string[]) => Promise<PublicPost[]> // For .in() queries
  cacheKeys: { loadedKey: string; cacheKey: string }

  // Optional filters/transforms
  filterPosts?: (posts: PublicPost[]) => PublicPost[]
  // Optional custom comparator for sorting posts (used before saving to state)
  postComparator?: (a: PublicPost, b: PublicPost) => number

  // Pagination config
  pageSize?: number
  sortDirection?: 'asc' | 'desc'

  // Callbacks
  onError?: (error: Error) => void
  onOffline?: () => void
}

export function usePostFetching (config: usePostFetchingConfig) {
  const [posts, setPosts] = useState<PublicPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  const isFetchingRef = useRef(false)
  const loadedIdsRef = useRef<Set<string>>(new Set())
  const cacheRef = useRef(createPostCache(config.cacheKeys))
  const hasRefreshedCacheRef = useRef(false) // Track if we've refreshed cache on initial load

  // Reusable sort function
  const sortPosts = useCallback(
    (arr: PublicPost[]) => {
      // Use optional custom comparator if provided
      if (config.postComparator) return arr.sort(config.postComparator)

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
    [config.sortDirection, config.postComparator]
  )

  // Fetch newest posts (not loaded yet) and prepend them to the list
  const fetchNewPosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return
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

      const exclude = Array.from(loadedIdsRef.current)
      let newPosts = await config.fetchFunction(exclude, config.pageSize ?? 5)

      if (config.filterPosts) newPosts = config.filterPosts(newPosts)

      if (newPosts.length > 0) {
        let merged: PublicPost[]
        if ((config.sortDirection ?? 'desc') === 'desc') {
          // Prepend new posts for newest-first
          merged = sortPosts([...newPosts, ...posts])
        } else {
          // Append new posts for oldest-first
          merged = sortPosts([...posts, ...newPosts])
        }
        setPosts(merged)

        // Add new post IDs to loaded set
        newPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

        // Add to cache
        await cacheRef.current.addPostsToCache(newPosts)
        await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)
      }
    } catch (error) {
      console.error('Error fetching new posts:', error)
      config.onError?.(error as Error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [posts, config, sortPosts])

  // Initial load: Load cache + refresh cached posts from Supabase
  const fetchPosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // 1. Load from cache immediately for instant render
      const cachedPosts = await cacheRef.current.loadCachedPublicPosts()
      const cachedLoadedIds = await cacheRef.current.loadLoadedPostIds()

      if (cachedPosts.length > 0) {
        // Apply filter to cached posts if provided
        const filteredCache = config.filterPosts
          ? config.filterPosts(cachedPosts)
          : cachedPosts

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
      if (cachedPosts.length > 0 && !hasRefreshedCacheRef.current) {
        const cachedIds = Array.from(cachedLoadedIds)

        // Fetch fresh versions of cached posts using .in()
        let refreshedPosts = await config.refreshPostFunction(cachedIds)

        // Apply filter if provided
        if (config.filterPosts) {
          refreshedPosts = config.filterPosts(refreshedPosts)
        }

        if (refreshedPosts.length > 0) {
          // Update state with refreshed data
          setPosts(sortPosts(refreshedPosts))

          // Update loadedIds with refreshed posts
          loadedIdsRef.current.clear()
          refreshedPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

          // Clear and save updated cache
          await cacheRef.current.clearPostsCache()
          await cacheRef.current.saveCachedPublicPosts(refreshedPosts)
          await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)

          hasRefreshedCacheRef.current = true
        }
      }

      // 4. If no cached posts, fetch initial batch
      if (cachedPosts.length === 0) {
        let initialPosts = await config.fetchFunction([], config.pageSize ?? 5)
        console.log('Fetched initial posts:', initialPosts)
        // Apply filter if provided
        if (config.filterPosts) {
          initialPosts = config.filterPosts(initialPosts)
        }

        if (initialPosts.length > 0) {
          setPosts(sortPosts(initialPosts))

          // Track loaded IDs
          initialPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

          // Save to cache
          await cacheRef.current.saveCachedPublicPosts(initialPosts)
          await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)

          // Check if more posts available
          if (initialPosts.length < (config.pageSize ?? 5)) {
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
      if (posts.length === 0) {
        const cachedPosts = await cacheRef.current.loadCachedPublicPosts()
        if (cachedPosts.length > 0) {
          const filteredCache = config.filterPosts
            ? config.filterPosts(cachedPosts)
            : cachedPosts
          setPosts(sortPosts(filteredCache))
        }
      }
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [posts, config, sortPosts])

  // Load more posts - ONLY called by infinite scroll handler
  const loadMorePosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || !hasMore) return
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

      // Fetch NEW posts excluding already loaded ones
      const exclude = Array.from(loadedIdsRef.current)
      let newPosts = await config.fetchFunction(exclude, config.pageSize ?? 5)

      // Apply filter if provided
      if (config.filterPosts) {
        newPosts = config.filterPosts(newPosts)
      }

      if (newPosts.length > 0) {
        // Check if more posts available
        if (newPosts.length < (config.pageSize ?? 5)) {
          setHasMore(false)
        }

        let merged: PublicPost[]
        if ((config.sortDirection ?? 'desc') === 'desc') {
          // Append new posts for newest-first
          merged = sortPosts([...posts, ...newPosts])
        } else {
          // Prepend new posts for oldest-first
          merged = sortPosts([...newPosts, ...posts])
        }
        setPosts(merged)

        // Add new post IDs to loaded set
        newPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

        // Incrementally add to cache
        await cacheRef.current.addPostsToCache(newPosts)
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
  }, [posts, hasMore, config, sortPosts])

  // Refresh function - only updates currently loaded posts
  const refreshPosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return
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
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      // Fetch fresh versions of loaded posts using .in()
      let refreshedPosts = await config.refreshPostFunction(loadedIds)

      // Apply filter if provided
      if (config.filterPosts) {
        refreshedPosts = config.filterPosts(refreshedPosts)
      }

      if (refreshedPosts.length > 0) {
        // Replace state with refreshed data
        setPosts(sortPosts(refreshedPosts))

        // Update loadedIds (some posts might have been deleted)
        loadedIdsRef.current.clear()
        refreshedPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

        // Clear and save updated cache
        await cacheRef.current.clearPostsCache()
        await cacheRef.current.saveCachedPublicPosts(refreshedPosts)
        await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)
      } else {
        // No refreshed posts available
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
  }, [config, sortPosts])

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
