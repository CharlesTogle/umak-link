import { useState, useRef, useCallback } from 'react'
import { Network } from '@capacitor/network'
import { supabase } from '@/shared/lib/supabase'
import createCache from '@/shared/lib/cache'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import useNotifications from '@/features/user/hooks/useNotifications'

export interface FraudReportPublic {
  // fraud report
  report_id: string
  post_id: string
  report_status: string | null
  reason_for_reporting: string | null
  date_reported: string | null
  proof_image_url: string | null

  // post
  poster_id: string
  post_status: string | null
  item_id: string | null
  is_anonymous: boolean
  submitted_on_date_local: string | null
  accepted_on_date_local: string | null

  // last-seen values
  last_seen_date: string | null
  last_seen_time: string | null
  last_seen_at: string | null
  last_seen_location: string | null

  // item
  item_name: string | null
  item_description: string | null
  image_id: string | null
  item_image_url: string | null
  item_status: string | null
  item_type: string | null
  category: string | null

  // claim info
  claimer_name: string | null
  claimer_school_email: string | null
  claimer_contact_num: string | null
  claimed_at: string | null
  claim_id: string | null

  // staff who processed the claim
  claim_processed_by_name: string | null
  claim_processed_by_email: string | null
  claim_processed_by_profile_picture_url: string | null

  // users: user who reported
  reporter_id: string | null
  reporter_name: string | null
  reporter_email: string | null
  reporter_profile_picture_url: string | null

  // users: user who posted
  poster_name: string | null
  poster_email: string | null
  poster_profile_picture_url: string | null

  // users: staff who reviewed the fraud report
  fraud_reviewer_id: string | null
  fraud_reviewer_name: string | null
  fraud_reviewer_email: string | null
  fraud_reviewer_profile_picture_url: string | null
}

interface UseFraudReportsParams {
  cacheKeys: {
    loadedKey: string
    cacheKey: string
  }
  pageSize?: number
  sortDirection?: 'asc' | 'desc'
  onOffline?: () => void
}

export function useFraudReports ({
  cacheKeys,
  pageSize = 10,
  sortDirection = 'desc',
  onOffline
}: UseFraudReportsParams) {
  const [reports, setReports] = useState<FraudReportPublic[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const isFetchingRef = useRef(false)
  const loadedIdsRef = useRef<Set<string>>(new Set())
  const hasRefreshedCacheRef = useRef(false)
  const { insertAuditLog } = useAuditLogs()
  const { sendNotification } = useNotifications()

  // Create cache instance with idSelector
  const cache = useRef(
    createCache<FraudReportPublic>({
      keys: cacheKeys,
      idSelector: report => report.report_id
    })
  ).current

  // Reusable sort function
  const sortReports = useCallback(
    (arr: FraudReportPublic[]) => {
      return arr.sort((a, b) => {
        const A = a.date_reported ?? ''
        const B = b.date_reported ?? ''
        if (!A && !B) return 0
        if (!A) return 1
        if (!B) return -1
        return sortDirection === 'desc'
          ? B.localeCompare(A)
          : A.localeCompare(B)
      })
    },
    [sortDirection]
  )

  // Fetch newest reports (not loaded yet) and prepend them to the list
  const fetchNewReports = useCallback(async (): Promise<void> => {
    cache.clearCache()
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      const status = await Network.getStatus()
      if (!navigator.onLine || !status.connected) {
        onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      const exclude = Array.from(loadedIdsRef.current)

      // Fetch all reports not in the exclude list
      let query = supabase
        .from('fraud_reports_public_v')
        .select('*')
        .order('date_reported', { ascending: sortDirection === 'asc' })
        .limit(pageSize)

      if (exclude.length > 0) {
        query = query.not('report_id', 'in', `(${exclude.join(',')})`)
      }

      const { data, error } = await query

      if (error) throw error

      const newReports = (data || []) as FraudReportPublic[]

      if (newReports.length > 0) {
        // Prepend new reports so newest appear first
        const merged = sortReports([...newReports, ...reports])
        setReports(merged)

        // Add new report IDs to loaded set
        newReports.forEach(r => loadedIdsRef.current.add(r.report_id))

        // Add to cache
        await cache.saveCache(merged)
        await cache.saveLoadedIds(loadedIdsRef.current)
      }
    } catch (error) {
      console.error('Error fetching new reports:', error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [reports, pageSize, sortDirection, cache, onOffline, sortReports])

  // Initial load: Load cache + refresh cached reports from Supabase
  const fetchReports = useCallback(async (): Promise<void> => {
    cache.clearCache()
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // 1. Load from cache immediately for instant render
      const cachedReports = await cache.loadCache()
      const cachedLoadedIds = await cache.loadLoadedIds()

      if (cachedReports.length > 0) {
        setReports(sortReports(cachedReports))
        loadedIdsRef.current = cachedLoadedIds
      }

      // 2. Check network status
      const status = await Network.getStatus()
      if (!navigator.onLine || !status.connected) {
        setHasMore(false)
        onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      // 3. If we have cached reports and haven't refreshed them yet, refresh them
      if (cachedReports.length > 0 && !hasRefreshedCacheRef.current) {
        const cachedIds = Array.from(cachedLoadedIds)

        // Fetch fresh versions of cached reports
        const { data, error } = await supabase
          .from('fraud_reports_public_v')
          .select('*')
          .in('report_id', cachedIds)

        if (error) throw error

        const refreshedReports = (data || []) as FraudReportPublic[]

        if (refreshedReports.length > 0) {
          // Update state with refreshed data
          setReports(sortReports(refreshedReports))

          // Update loadedIds with refreshed reports
          loadedIdsRef.current.clear()
          refreshedReports.forEach(r => loadedIdsRef.current.add(r.report_id))

          // Clear and save updated cache
          await cache.clearCache()
          await cache.saveCache(refreshedReports)
          await cache.saveLoadedIds(loadedIdsRef.current)

          hasRefreshedCacheRef.current = true
        }
      }

      // 4. If no cached reports, fetch initial batch
      if (cachedReports.length === 0) {
        const { data, error } = await supabase
          .from('fraud_reports_public_v')
          .select('*')
          .order('date_reported', { ascending: sortDirection === 'asc' })
          .limit(pageSize)

        if (error) throw error

        const initialReports = (data || []) as FraudReportPublic[]

        if (initialReports.length > 0) {
          setReports(sortReports(initialReports))

          // Track loaded IDs
          initialReports.forEach(r => loadedIdsRef.current.add(r.report_id))

          // Save to cache
          await cache.saveCache(initialReports)
          await cache.saveLoadedIds(loadedIdsRef.current)

          // Check if more reports available
          if (initialReports.length < pageSize) {
            setHasMore(false)
          }
        } else {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error)

      // On error, use cache if available
      if (reports.length === 0) {
        const cachedReports = await cache.loadCache()
        if (cachedReports.length > 0) {
          setReports(sortReports(cachedReports))
        }
      }
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [reports, pageSize, sortDirection, cache, onOffline, sortReports])

  // Load more reports - ONLY called by infinite scroll handler
  const loadMoreReports = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || !hasMore) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // Check network status
      const status = await Network.getStatus()
      if (!navigator.onLine || !status.connected) {
        onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      // Fetch older reports excluding already loaded ones
      const exclude = Array.from(loadedIdsRef.current)

      let query = supabase
        .from('fraud_reports_public_v')
        .select('*')
        .order('date_reported', { ascending: sortDirection === 'asc' })
        .limit(pageSize)

      if (exclude.length > 0) {
        query = query.not('report_id', 'in', `(${exclude.join(',')})`)
      }

      const { data, error } = await query

      if (error) throw error

      const newReports = (data || []) as FraudReportPublic[]

      if (newReports.length > 0) {
        // Check if more reports available
        if (newReports.length < pageSize) {
          setHasMore(false)
        }

        // Append new reports to existing reports
        const merged = sortReports([...reports, ...newReports])
        setReports(merged)

        // Add new report IDs to loaded set
        newReports.forEach(r => loadedIdsRef.current.add(r.report_id))

        // Incrementally add to cache
        await cache.saveCache(merged)
        await cache.saveLoadedIds(loadedIdsRef.current)
      } else {
        // No more reports available
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more reports:', error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [reports, hasMore, pageSize, sortDirection, cache, onOffline, sortReports])

  // Refresh function - only updates currently loaded reports
  const refreshReports = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsFetching(true)

    try {
      // Check network status
      const status = await Network.getStatus()
      if (!navigator.onLine || !status.connected) {
        onOffline?.()
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      // Refresh only currently loaded reports
      const loadedIds = Array.from(loadedIdsRef.current)

      if (loadedIds.length === 0) {
        isFetchingRef.current = false
        setIsFetching(false)
        return
      }

      // Fetch fresh versions of loaded reports
      const { data, error } = await supabase
        .from('fraud_reports_public_v')
        .select('*')
        .in('report_id', loadedIds)

      if (error) throw error

      const refreshedReports = (data || []) as FraudReportPublic[]

      if (refreshedReports.length > 0) {
        // Replace state with refreshed data
        setReports(sortReports(refreshedReports))

        // Update loadedIds (some reports might have been deleted)
        loadedIdsRef.current.clear()
        refreshedReports.forEach(r => loadedIdsRef.current.add(r.report_id))

        // Clear and save updated cache
        await cache.clearCache()
        await cache.saveCache(refreshedReports)
        await cache.saveLoadedIds(loadedIdsRef.current)
      }
    } catch (error) {
      console.error('Error refreshing reports:', error)
    } finally {
      isFetchingRef.current = false
      setIsFetching(false)
    }
  }, [cache, onOffline, sortReports])

  // Fetch a single report by id (cache-first then server)
  const getSingleReport = useCallback(
    async (reportId: string) => {
      if (!reportId) return null

      try {
        // Check cache first
        const cached = await cache.loadCache()
        const found = cached.find(r => r.report_id === reportId)
        if (found) return found

        // If not found in cache, query server
        const { data, error } = await supabase
          .from('fraud_reports_public_v')
          .select('*')
          .eq('report_id', reportId)
          .limit(1)

        if (error) {
          console.error('Error fetching single fraud report:', error)
          return null
        }

        if (!data || data.length === 0) return null

        const report = data[0] as FraudReportPublic

        // Merge into local state + cache (best-effort)
        setReports(prev => {
          const exists = prev.find(r => r.report_id === report.report_id)
          if (exists) return prev
          const updated = [...prev, report]
          // save cache in background
          ;(async () => {
            try {
              await cache.saveCache(updated)
            } catch (e) {}
          })()
          return updated
        })

        return report
      } catch (err) {
        console.error('Unexpected error fetching single fraud report:', err)
        return null
      }
    },
    [cache]
  )

  const acceptReport = async ({
    reportId,
    postTitle,
    reporterId
  }: {
    reportId: string
    postTitle: string
    reporterId?: string | null
  }) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user details for audit log
      const { data: userData, error: userError } = await supabase
        .from('user_table')
        .select('user_name')
        .eq('user_id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
      }

      // Get old report status before update
      const { data: reportData, error: reportFetchError } = await supabase
        .from('fraud_reports_table')
        .select('report_status')
        .eq('report_id', reportId)
        .single()

      if (reportFetchError) {
        console.error('Error fetching report status:', reportFetchError)
      }

      const oldStatus = reportData?.report_status || 'under_review'

      const { error: reportError } = await supabase
        .from('fraud_reports_table')
        .update({
          report_status: 'open',
          processed_by_staff_id: user.id
        })
        .eq('report_id', reportId)

      if (reportError) throw reportError

      // Add audit trail with correct structure

      await insertAuditLog({
        user_id: user.id,
        action_type: 'verified_report',
        details: {
          message: `${
            userData?.user_name || 'Staff'
          } set the status of report on ${postTitle} as Open`,
          post_title: postTitle,
          old_status: oldStatus,
          new_status: 'open'
        }
      })

      // Send notification to reporter if reporter ID is provided
      if (reporterId) {
        await sendNotification({
          userId: reporterId,
          title: 'Fraud Report Opened',
          message: `Your report on "${postTitle}" has been opened and is being investigated. Thank you for helping keep UMatch safe.`,
          data: { link: `/user/reports` },
          type: 'acceptance'
        })
      }

      // Email notification removed - resend implementation deleted

      // Update local state - change report status to open
      setReports(prev => {
        const updated = prev.map(report =>
          report.report_id === reportId
            ? { ...report, report_status: 'open' }
            : report
        )
        // Update cache in background
        ;(async () => {
          try {
            await cache.saveCache(updated)
          } catch (e) {
            console.error('Failed to update cache after accept:', e)
          }
        })()
        return updated
      })

      return { success: true }
    } catch (error) {
      console.error('Error accepting fraud report:', error)
      return { success: false, error }
    }
  }

  const rejectReport = async ({
    reporterId,
    reportId,
    postId,
    postTitle,
    reason
  }: {
    reporterId: string | null
    reportId: string
    postId: string
    postTitle: string
    reason: string
  }) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user details for audit log
      const { data: userData, error: userError } = await supabase
        .from('user_table')
        .select('user_name')
        .eq('user_id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
      }

      // Get old report status before update
      const { data: reportData, error: reportFetchError } = await supabase
        .from('fraud_reports_table')
        .select('report_status')
        .eq('report_id', reportId)
        .single()

      if (reportFetchError) {
        console.error('Error fetching report status:', reportFetchError)
      }

      const oldStatus = reportData?.report_status || 'under_review'

      // Update report status to rejected
      const { error: reportError } = await supabase
        .from('fraud_reports_table')
        .update({
          report_status: 'rejected',
          processed_by_staff_id: user.id
        })
        .eq('report_id', reportId)

      const { error: updateStatusError } = await supabase
        .from('post_table')
        .update({ status: 'accepted' })
        .eq('post_id', postId)

      if (updateStatusError) throw updateStatusError

      if (reportError) throw reportError

      // Add audit trail with correct structure
      await insertAuditLog({
        user_id: user.id,
        action_type: 'rejected_report',
        details: {
          message: `${
            userData?.user_name || 'Staff'
          } set the status of report on ${postTitle} as Rejected`,
          post_title: postTitle,
          old_status: oldStatus,
          new_status: 'rejected',
          reason_for_rejecting: reason
        }
      })

      console.log('Reporter ID:', reporterId)
      if (reporterId) {
        await sendNotification({
          userId: reporterId,
          title: 'Fraud Report Rejected',
          message: `Your report on "${postTitle}" has been rejected. Reason: ${reason}`,
          data: { link: `/user/reports` },
          type: 'rejection'
        })
      }

      // Update local state - change report status to rejected
      setReports(prev => {
        const updated = prev.map(report =>
          report.report_id === reportId
            ? { ...report, report_status: 'rejected' }
            : report
        )
        // Update cache in background
        ;(async () => {
          try {
            await cache.saveCache(updated)
          } catch (e) {
            console.error('Failed to update cache after reject:', e)
          }
        })()
        return updated
      })

      return { success: true }
    } catch (error) {
      console.error('Error rejecting fraud report:', error)
      return { success: false, error }
    }
  }

  const closeReport = async ({
    reportId,
    postTitle,
    deleteClaim = false,
    itemId
  }: {
    reportId: string
    postTitle: string
    deleteClaim?: boolean
    itemId?: string | null
  }) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user details for audit log
      const { data: userData, error: userError } = await supabase
        .from('user_table')
        .select('user_name')
        .eq('user_id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
      }

      // Get claim_id from the report to delete it
      const { data: reportData, error: reportFetchError } = await supabase
        .from('fraud_reports_public_v')
        .select('claim_id')
        .eq('report_id', reportId)
        .single()

      if (reportFetchError) {
        console.error('Error fetching report claim_id:', reportFetchError)
      }

      // Delete claim record and update item status if deleteClaim is true
      if (deleteClaim && reportData?.claim_id) {
        // Delete claim record
        const { error: claimDeleteError } = await supabase
          .from('claim_table')
          .delete()
          .eq('claim_id', reportData.claim_id)

        if (claimDeleteError) {
          console.error('Error deleting claim record:', claimDeleteError)
          throw claimDeleteError
        }

        // Update item status to unclaimed
        if (itemId) {
          const { error: itemUpdateError } = await supabase
            .from('item_table')
            .update({ status: 'unclaimed' })
            .eq('item_id', itemId)

          if (itemUpdateError) {
            console.error('Error updating item status:', itemUpdateError)
            throw itemUpdateError
          }
        }
      }

      // Update report status to resolved
      const { error: reportError } = await supabase
        .from('fraud_reports_table')
        .update({ report_status: 'resolved' })
        .eq('report_id', reportId)

      if (reportError) throw reportError

      // Add audit trail
      await insertAuditLog({
        user_id: user.id,
        action_type: 'closed_report',
        details: {
          message: `${
            userData?.user_name || 'Staff'
          } closed the report on ${postTitle}`,
          post_title: postTitle,
          old_status: 'verified',
          new_status: 'resolved'
        }
      })

      // Update local state - change report status to resolved
      setReports(prev => {
        const updated = prev.map(report =>
          report.report_id === reportId
            ? { ...report, report_status: 'resolved' }
            : report
        )
        // Update cache in background
        ;(async () => {
          try {
            await cache.saveCache(updated)
          } catch (e) {
            console.error('Failed to update cache after close:', e)
          }
        })()
        return updated
      })

      return { success: true }
    } catch (error) {
      console.error('Error closing fraud report:', error)
      return { success: false, error }
    }
  }

  const isLoading = reports.length === 0 && isFetching

  return {
    reports,
    setReports,
    hasMore,
    fetchReports, // Initial load: cache + refresh cached reports
    loadMoreReports, // Infinite scroll: fetch older reports only
    fetchNewReports, // Fetch newest reports (used for pull-to-refresh / toolbar)
    refreshReports, // Pull-to-refresh: update currently loaded reports
    loadedIdsRef,
    loading: isLoading,
    getSingleReport,
    acceptReport,
    rejectReport,
    closeReport
  }
}
