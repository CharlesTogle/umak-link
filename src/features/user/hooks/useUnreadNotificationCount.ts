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

const POLLING_INTERVAL = 30000 // 30 seconds
const MAX_CACHE_AGE = 5 * 60 * 1000 // 5 minutes
const MAX_RETRY_ATTEMPTS = 3
const INITIAL_RETRY_DELAY = 2000

/**
 * Hook to track unread notification count in realtime
 * @param userId - The user ID to track notifications for
 * @returns object with unreadCount, error state, and realtime status
 */
export function useUnreadNotificationCount (userId: string | null | undefined) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [error, setError] = useState<Error | null>(null)
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false)

  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const hasFetchedRef = useRef(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    if (!userId) {
      setUnreadCount(0)
      setError(null)
      setIsRealtimeActive(false)
      return
    }

    // Create cache instance for this user
    const userCountCache = createCache<CachedCount>({
      keys: {
        loadedKey: `LoadedNotificationCount:${userId}`,
        cacheKey: `CachedNotificationCount:${userId}`
      },
      idSelector: () => 'count'
    })

    // Helper: Save count to cache
    const saveToCache = async (count: number) => {
      try {
        await userCountCache.saveCache([
          {
            count,
            timestamp: Date.now()
          }
        ])
      } catch (err) {
        console.warn('Failed to cache notification count:', err)
      }
    }

    // Helper: Load from cache with freshness check
    const loadFromCache = async (): Promise<boolean> => {
      try {
        const cached = await userCountCache.loadCache()

        if (cached.length > 0) {
          const cachedData = cached[0]
          const age = Date.now() - cachedData.timestamp

          // Only use cache if it's fresh
          if (age < MAX_CACHE_AGE) {
            setUnreadCount(cachedData.count)
            return true
          }
        }
      } catch (err) {
        console.log('No cached count available:', err)
      }
      return false
    }

    // Helper: Fetch current count from database
    const fetchCount = async () => {
      if (!isMountedRef.current) return

      try {
        const { count, error: fetchError } = await supabase
          .from('notification_view')
          .select('notification_id', { count: 'exact', head: true })
          .eq('sent_to', userId)
          .eq('is_read', false)

        if (!isMountedRef.current) return

        if (fetchError) {
          throw new Error(
            `Failed to fetch notification count: ${fetchError.message}`
          )
        }

        const newCount = count ?? 0
        setUnreadCount(newCount)
        setError(null)
        hasFetchedRef.current = true

        await saveToCache(newCount)
      } catch (err) {
        if (!isMountedRef.current) return

        const error =
          err instanceof Error
            ? err
            : new Error('Unknown error fetching notification count')

        console.error('Error fetching notification count:', error)
        setError(error)
      }
    }

    // Helper: Handle realtime payload updates
    const handleInsert = (payload: NotificationPayload) => {
      try {
        if (!isMountedRef.current) return

        if (payload.new && !payload.new.is_read) {
          setUnreadCount(prev => {
            const newCount = prev + 1
            saveToCache(newCount)
            return newCount
          })
        }
      } catch (err) {
        console.error('Error handling INSERT:', err)
      }
    }

    const handleUpdate = (payload: NotificationPayload) => {
      try {
        if (!isMountedRef.current) return

        const wasUnread = payload.old && !payload.old.is_read
        const isNowRead = payload.new && payload.new.is_read
        const wasRead = payload.old && payload.old.is_read
        const isNowUnread = payload.new && !payload.new.is_read

        if (wasUnread && isNowRead) {
          // Marked as read
          setUnreadCount(prev => {
            const newCount = Math.max(0, prev - 1)
            saveToCache(newCount)
            return newCount
          })
        } else if (wasRead && isNowUnread) {
          // Marked as unread
          setUnreadCount(prev => {
            const newCount = prev + 1
            saveToCache(newCount)
            return newCount
          })
        }
      } catch (err) {
        console.error('Error handling UPDATE:', err)
      }
    }

    const handleDelete = (payload: NotificationPayload) => {
      try {
        if (!isMountedRef.current) return

        if (payload.old && !payload.old.is_read) {
          setUnreadCount(prev => {
            const newCount = Math.max(0, prev - 1)
            saveToCache(newCount)
            return newCount
          })
        }
      } catch (err) {
        console.error('Error handling DELETE:', err)
      }
    }

    // Helper: Stop polling
    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }

    // Helper: Start polling as fallback
    const startPolling = () => {
      if (pollingIntervalRef.current) return

      console.log('Starting polling fallback...')

      pollingIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchCount()
        }
      }, POLLING_INTERVAL)
    }

    // Helper: Clean up existing subscription
    const cleanupSubscription = async () => {
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }

    // Helper: Setup realtime subscription
    const setupSubscription = async () => {
      if (!isMountedRef.current) return

      // Clean up any existing resources
      await cleanupSubscription()
      stopPolling()

      const channelName = `notifications-${userId}-${Date.now()}`
      const channel = supabase.channel(channelName)

      // Store channel reference immediately before subscribing
      channelRef.current = channel

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_table',
            filter: `sent_to=eq.${userId}`
          },
          payload => handleInsert(payload as unknown as NotificationPayload)
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notification_table',
            filter: `sent_to=eq.${userId}`
          },
          payload => handleUpdate(payload as unknown as NotificationPayload)
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notification_table',
            filter: `sent_to=eq.${userId}`
          },
          payload => handleDelete(payload as unknown as NotificationPayload)
        )
        .subscribe(async (status, err) => {
          if (!isMountedRef.current) {
            // Component unmounted during subscription, clean up immediately
            if (channelRef.current) {
              await supabase.removeChannel(channelRef.current).catch(() => {})
              channelRef.current = null
            }
            return
          }

          if (status === 'SUBSCRIBED') {
            setIsRealtimeActive(true)
            retryCountRef.current = 0
            setError(null)

            // Fetch fresh count after successful subscription to ensure sync
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
    }

    // Helper: Handle subscription failures with retry
    const handleSubscriptionFailure = () => {
      if (!isMountedRef.current) return

      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current += 1
        const delay = INITIAL_RETRY_DELAY * retryCountRef.current

        console.log(
          `Retrying subscription (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}) in ${delay}ms...`
        )

        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setupSubscription()
          }
        }, delay)
      } else {
        console.log('Max retry attempts reached. Falling back to polling.')
        setError(
          new Error(
            'Realtime connection failed. Using periodic updates instead.'
          )
        )
        startPolling()
      }
    }

    // Initialize: Cache → Fetch → Realtime
    const initialize = async () => {
      // 1. Try loading from cache first for instant display
      const hadValidCache = await loadFromCache()

      // 2. Fetch fresh data from database
      if (hadValidCache) {
        // If we had cache, fetch in background after short delay
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchCount()
          }
        }, 1000)
      } else {
        // No cache, fetch immediately
        await fetchCount()
      }

      // 3. Setup realtime subscription
      setupSubscription()
    }

    initialize()

    // Cleanup function
    return () => {
      isMountedRef.current = false

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }

      stopPolling()

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(err => {
          console.error('Error removing channel:', err)
        })
      }
    }
  }, [userId])

  return { unreadCount, error, isRealtimeActive }
}
