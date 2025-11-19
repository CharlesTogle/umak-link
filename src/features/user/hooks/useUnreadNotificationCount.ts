import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import createCache from '@/shared/lib/cache'

type NotificationRow = {
  notification_id: string
  sent_to: string
  is_read: boolean
  created_at: string
}

type NotificationPayload = {
  new?: NotificationRow
  old?: NotificationRow
}

type CachedCount = {
  count: number
  timestamp: number
}

const POLLING_INTERVAL = 30000 // 30 seconds fallback polling

/**
 * Hook to track unread notification count in realtime
 * @param userId - The user ID to track notifications for
 * @param initialCount - Optional initial count from cache for instant display
 * @returns object with unreadCount and error state
 */
export function useUnreadNotificationCount (
  userId: string | null | undefined,
  initialCount: number = 0
) {
  const [unreadCount, setUnreadCount] = useState<number>(initialCount)
  const [error, setError] = useState<Error | null>(null)
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const hasFetchedRef = useRef(false)

  // Update unreadCount when initialCount changes (e.g., cache loaded in parent)
  useEffect(() => {
    if (initialCount > 0 && !hasFetchedRef.current) {
      setUnreadCount(initialCount)
    }
  }, [initialCount])

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0)
      setError(null)
      setIsRealtimeActive(false)
      return
    }

    let isMounted = true

    // Helper function to save count to cache
    const saveToCache = async (count: number) => {
      try {
        const userCountCache = createCache<CachedCount>({
          keys: {
            loadedKey: `LoadedNotificationCount:${userId}`,
            cacheKey: `CachedNotificationCount:${userId}`
          },
          idSelector: () => 'count'
        })

        await userCountCache.saveCache([
          {
            count,
            timestamp: Date.now()
          }
        ])
      } catch (cacheErr) {
        console.warn('Failed to cache notification count:', cacheErr)
      }
    }

    // Load from cache immediately for instant display
    const loadFromCache = async () => {
      try {
        const userCountCache = createCache<CachedCount>({
          keys: {
            loadedKey: `LoadedNotificationCount:${userId}`,
            cacheKey: `CachedNotificationCount:${userId}`
          },
          idSelector: () => 'count'
        })

        const cached = await userCountCache.loadCache()
        if (cached.length > 0) {
          const cachedData = cached[0]

          // Use cache if it's fresh
          setUnreadCount(cachedData.count)
          return true
        }
      } catch (err) {
        console.log('No cached count available')
      }
      return false
    }

    // Fetch current count from database
    const fetchCount = async () => {
      if (!isMounted) return

      try {
        const { count, error: fetchError } = await supabase
          .from('notification_view')
          .select('notification_id', { count: 'exact', head: true })
          .eq('sent_to', userId)
          .eq('is_read', false)

        if (!isMounted) return

        if (fetchError) {
          throw new Error(
            `Failed to fetch notification count: ${fetchError.message}`
          )
        }

        const newCount = count ?? 0
        setUnreadCount(newCount)
        setError(null)
        hasFetchedRef.current = true

        // Save to cache
        await saveToCache(newCount)
      } catch (err) {
        if (!isMounted) return
        const error =
          err instanceof Error
            ? err
            : new Error('Unknown error fetching notification count')
        console.error('Error fetching notification count:', error)
        setError(error)
      }
    }

    // Setup realtime subscription
    const setupSubscription = async () => {
      if (!isMounted) return

      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      const channelName = `notifications-${userId}-${Date.now()}`
      const channel = supabase.channel(channelName)

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_table',
            filter: `sent_to=eq.${userId}`
          },
          payload => {
            if (!isMounted) return
            const typedPayload = payload as unknown as NotificationPayload

            if (typedPayload.new && !typedPayload.new.is_read) {
              setUnreadCount(prev => {
                const newCount = prev + 1
                saveToCache(newCount)
                return newCount
              })
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notification_table',
            filter: `sent_to=eq.${userId}`
          },
          payload => {
            if (!isMounted) return
            const typedPayload = payload as unknown as NotificationPayload

            if (
              typedPayload.old &&
              !typedPayload.old.is_read &&
              typedPayload.new &&
              typedPayload.new.is_read
            ) {
              setUnreadCount(prev => {
                const newCount = Math.max(0, prev - 1)
                saveToCache(newCount)
                return newCount
              })
            } else if (
              typedPayload.old &&
              typedPayload.old.is_read &&
              typedPayload.new &&
              !typedPayload.new.is_read
            ) {
              setUnreadCount(prev => {
                const newCount = prev + 1
                saveToCache(newCount)
                return newCount
              })
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notification_table',
            filter: `sent_to=eq.${userId}`
          },
          payload => {
            if (!isMounted) return
            const typedPayload = payload as unknown as NotificationPayload

            if (typedPayload.old && !typedPayload.old.is_read) {
              setUnreadCount(prev => {
                const newCount = Math.max(0, prev - 1)
                saveToCache(newCount)
                return newCount
              })
            }
          }
        )
        .subscribe(async (status, err) => {
          if (!isMounted) return
          if (status === 'SUBSCRIBED') {
            setIsRealtimeActive(true)
            retryCountRef.current = 0
            setError(null)

            // Stop polling if it was running
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }

            // Fetch fresh count after successful subscription
            // This ensures we're in sync after the subscription is active
            if (!hasFetchedRef.current) {
              await fetchCount()
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsRealtimeActive(false)
            console.error(`Subscription ${status}:`, err)
            handleSubscriptionFailure()
          } else if (status === 'CLOSED') {
            setIsRealtimeActive(false)
            console.log('Notification subscription closed')
          }
        })

      channelRef.current = channel
    }

    // Handle subscription failures with retry and fallback
    const handleSubscriptionFailure = () => {
      if (!isMounted) return

      if (retryCountRef.current < 3) {
        retryCountRef.current += 1
        const delay = 2000 * retryCountRef.current
        console.log(
          `Retrying subscription (attempt ${retryCountRef.current}/3) in ${delay}ms...`
        )

        retryTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            setupSubscription()
          }
        }, delay)
      } else {
        console.log('Max retry attempts reached. Falling back to polling.')
        setError(
          new Error(
            `Realtime connection failed. Using periodic updates instead.`
          )
        )
        startPolling()
      }
    }

    // Start polling as fallback
    const startPolling = () => {
      if (pollingIntervalRef.current) return

      console.log('Starting polling fallback...')

      pollingIntervalRef.current = setInterval(() => {
        if (isMounted && !isRealtimeActive) {
          fetchCount()
        }
      }, POLLING_INTERVAL)
    }

    // Initialize - load cache first, then fetch, then setup realtime
    const initialize = async () => {
      // 1. Load from cache immediately (instant display)
      await loadFromCache()

      // 2. Fetch fresh data in background (updates cache)
      fetchCount()

      // 3. Setup realtime subscription (runs in parallel)
      setupSubscription()
    }

    initialize()

    // Cleanup
    return () => {
      isMounted = false

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).then(() => {})
      }
    }
  }, [userId])

  return { unreadCount, error, isRealtimeActive }
}
