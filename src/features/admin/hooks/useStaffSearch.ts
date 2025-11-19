import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useUser } from '@/features/auth/contexts/UserContext'

interface SearchResult {
  user_id: string
  user_name: string
  email: string
  profile_picture_url: string | null
  user_type: string
}

interface UseStaffSearchReturn {
  results: SearchResult[]
  loading: boolean
  error: string | null
  search: (query: string) => void
  clearResults: () => void
}

// In-memory cache with TTL
interface CacheEntry {
  data: SearchResult[]
  timestamp: number
}

const searchCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MIN_QUERY_LENGTH = 2
const DEBOUNCE_DELAY = 300 // ms

/**
 * Custom hook for searching users in the database
 *
 * Features:
 * - Debounced search (300ms)
 * - In-memory caching (5-minute TTL)
 * - Rate limiting (handled by backend)
 * - Request cancellation on new search
 * - Admin-only access verification
 *
 * @returns {UseStaffSearchReturn} Search results, loading state, error, and control functions
 *
 * @example
 * ```tsx
 * const { results, loading, error, search, clearResults } = useStaffSearch()
 *
 * const handleSearch = (e: CustomEvent) => {
 *   const query = e.detail.value || ''
 *   search(query)
 * }
 * ```
 */
export function useStaffSearch (): UseStaffSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getUser } = useUser()

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Search for users with debouncing and caching
   * @param query - Search query string (min 2 characters)
   */
  const search = useCallback(
    async (query: string) => {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Validate query
      const trimmedQuery = query.trim()
      if (trimmedQuery.length < MIN_QUERY_LENGTH) {
        setResults([])
        setError(null)
        setLoading(false)
        return
      }

      // Security check - verify admin access
      const currentUser = await getUser()
      const isAllowed =
        currentUser?.user_type === 'Admin' || currentUser?.user_type === 'Staff'
      const isAdmin = currentUser?.user_type === 'Admin'

      if (!isAllowed) {
        setError('Unauthorized: Only admins can search users')
        setResults([])
        setLoading(false)
        return
      }

      // Check cache first
      const cacheKey = trimmedQuery.toLowerCase()
      const cached = searchCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[useStaffSearch] Cache hit for:', cacheKey)
        setResults(cached.data)
        setLoading(false)
        setError(null)
        return
      }

      // Debounce the search
      debounceTimerRef.current = setTimeout(async () => {
        setLoading(true)
        setError(null)

        // Create new abort controller
        abortControllerRef.current = new AbortController()

        try {
          console.log('[useStaffSearch] Searching for:', trimmedQuery)

          console.log(trimmedQuery)
          let data: any
          let rpcError: any

          if (isAdmin) {
            const result = await supabase.rpc('search_users_secure', {
              search_query: trimmedQuery,
              search_limit: 10
            })
            data = result.data
            rpcError = result.error
          } else {
            const result = await supabase.rpc('search_users_secure_staff', {
              search_query: trimmedQuery,
              search_limit: 10
            })
            data = result.data
            rpcError = result.error
          }

          // Check if request was aborted
          if (abortControllerRef.current.signal.aborted) {
            return
          }

          if (rpcError) {
            console.error('[useStaffSearch] RPC Error:', rpcError)

            // Handle specific error codes
            if (rpcError.code === 'P0001') {
              throw new Error('Unauthorized: Only admins can search users')
            } else if (rpcError.code === 'P0002') {
              throw new Error(
                'Rate limit exceeded. Please wait a moment before searching again.'
              )
            } else if (rpcError.code === 'P0003') {
              throw new Error(
                'System is currently in lockdown mode. Please contact support.'
              )
            } else if (rpcError.message) {
              throw new Error(rpcError.message)
            } else {
              throw new Error('Search failed. Please try again.')
            }
          }

          // Map the out_ prefixed fields to the expected interface
          const searchResults = (data || []).map((item: any) => ({
            user_id: item.out_user_id,
            user_name: item.out_user_name,
            email: item.out_email,
            profile_picture_url: item.out_profile_picture_url,
            user_type: item.out_user_type
          })) as SearchResult[]

          console.log(
            `[useStaffSearch] Found ${searchResults.length} results for:`,
            trimmedQuery
          )

          // Update cache
          searchCache.set(cacheKey, {
            data: searchResults,
            timestamp: Date.now()
          })

          // Clean old cache entries if cache is getting large
          if (searchCache.size > 50) {
            const now = Date.now()
            for (const [key, entry] of searchCache.entries()) {
              if (now - entry.timestamp > CACHE_TTL) {
                searchCache.delete(key)
              }
            }
            console.log(
              `[useStaffSearch] Cache cleaned. New size: ${searchCache.size}`
            )
          }

          setResults(searchResults)
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // Request was cancelled, ignore
            console.log('[useStaffSearch] Request aborted')
            return
          }

          console.error('[useStaffSearch] Search error:', err)
          setError(err.message || 'Search failed. Please try again.')
          setResults([])
        } finally {
          setLoading(false)
        }
      }, DEBOUNCE_DELAY)
    },
    [getUser]
  )

  /**
   * Clear search results and reset state
   */
  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
    setLoading(false)

    // Clear pending timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Cancel ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clearResults
  }
}
