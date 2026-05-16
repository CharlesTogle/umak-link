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
  const {
    fetchFunction,
    refreshPostFunction,
    cacheKeys,
    filterPosts,
    postComparator,
    pageSize = 5,
    sortDirection = 'desc',
    onError,
    onOffline
  } = config
  const [posts, setPosts] = useState<PublicPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  const isFetchingRef = useRef(false)
  const loadedIdsRef = useRef<Set<string>>(new Set())
  const cacheRef = useRef(createPostCache(cacheKeys))

  // Reusable sort function
  const sortPosts = useCallback(
    (arr: PublicPost[]) => {
      // Use optional custom comparator if provided
      if (postComparator) return arr.sort(postComparator)

      return arr.sort((a, b) => {
        const A = a.submission_date ?? ''
        const B = b.submission_date ?? ''
        if (!A && !B) return 0
        if (!A) return 1
        if (!B) return -1
        const dir = sortDirection
        return dir === 'desc' ? B.localeCompare(A) : A.localeCompare(B)
      })
    },
    [postComparator, sortDirection]
  )

  const applyFilter = useCallback(
    (incomingPosts: PublicPost[]) =>
      filterPosts ? filterPosts(incomingPosts) : incomingPosts,
    [filterPosts]
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

  // Fetch newest posts (not loaded yet) and prepend them to the list
  const fetchNewPosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      const status = await Network.getStatus()
      if (!status.connected) {
        onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      const exclude = Array.from(loadedIdsRef.current)
      const newPosts = applyFilter(await fetchFunction(exclude, pageSize))

      if (newPosts.length > 0) {
        setPosts(prevPosts => mergeUniquePosts(newPosts, prevPosts))

        // Add new post IDs to loaded set
        newPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

        // Add to cache
        await cacheRef.current.addPostsToCache(newPosts)
        await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)
      }
    } catch (error) {
      console.error('Error fetching new posts:', error)
      onError?.(error as Error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [applyFilter, fetchFunction, mergeUniquePosts, onError, onOffline, pageSize])

  // Initial load / reload: paint cache immediately, then replace it with the latest server window
  const fetchPosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // 1. Load from cache immediately for instant render
      const cachedPosts = await cacheRef.current.loadCachedPublicPosts()
      const cachedLoadedIds = await cacheRef.current.loadLoadedPostIds()

      if (cachedPosts.length > 0) {
        setPosts(sortPosts(applyFilter(cachedPosts)))
        loadedIdsRef.current = cachedLoadedIds
      }

      const status = await Network.getStatus()
      if (!status.connected) {
        setHasMore(false)
        onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      const latestLimit = Math.max(cachedLoadedIds.size, pageSize)
      const latestPosts = applyFilter(await fetchFunction([], latestLimit))

      if (latestPosts.length > 0) {
        const sortedLatestPosts = sortPosts(latestPosts)

        setPosts(sortedLatestPosts)

        loadedIdsRef.current.clear()
        sortedLatestPosts.forEach(p => loadedIdsRef.current.add(p.post_id))

        await cacheRef.current.clearPostsCache()
        await cacheRef.current.saveCachedPublicPosts(sortedLatestPosts)
        await cacheRef.current.saveLoadedPostIds(loadedIdsRef.current)

        setHasMore(sortedLatestPosts.length >= latestLimit)
      } else {
        await cacheRef.current.clearPostsCache()
        loadedIdsRef.current.clear()
        setPosts(sortPosts([]))
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      onError?.(error as Error)

      // On error, use cache if available
      if (posts.length === 0) {
        const cachedPosts = await cacheRef.current.loadCachedPublicPosts()
        if (cachedPosts.length > 0) {
          setPosts(sortPosts(applyFilter(cachedPosts)))
        }
      }
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [applyFilter, fetchFunction, onError, onOffline, pageSize, posts.length, sortPosts])

  // Load more posts - ONLY called by infinite scroll handler
  const loadMorePosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || !hasMore) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // Check network status
      const status = await Network.getStatus()
      if (!status.connected) {
        onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      // Fetch NEW posts excluding already loaded ones
      const exclude = Array.from(loadedIdsRef.current)
      const newPosts = applyFilter(await fetchFunction(exclude, pageSize))

      if (newPosts.length > 0) {
        // Check if more posts available
        if (newPosts.length < pageSize) {
          setHasMore(false)
        }

        setPosts(prevPosts => mergeUniquePosts(newPosts, prevPosts))

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
      onError?.(error as Error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [applyFilter, fetchFunction, hasMore, mergeUniquePosts, onError, onOffline, pageSize])

  // Refresh function - only updates currently loaded posts
  const refreshPosts = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // Check network status
      const status = await Network.getStatus()
      if (!status.connected) {
        onOffline?.()
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
      const refreshedPosts = applyFilter(await refreshPostFunction(loadedIds))

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
      onError?.(error as Error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [applyFilter, onError, onOffline, refreshPostFunction, sortPosts])

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
