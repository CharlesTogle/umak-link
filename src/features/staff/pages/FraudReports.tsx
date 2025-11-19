import { useState, useEffect, useRef, useCallback } from 'react'
import {
  IonContent,
  IonSkeletonText,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/react'
import { shieldCheckmarkOutline, documentTextOutline } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useFraudReports } from '@/features/staff/hooks/useFraudReports'
import type { FraudReportPublic } from '@/features/staff/hooks/useFraudReports'
import FraudReportCard from '@/features/staff/components/FraudReportCard'
import FraudReportSkeleton from '@/features/staff/components/FraudReportSkeleton'
import {
  applyFiltersAndSort,
  type ReportStatus,
  type SortDirection
} from '@/features/staff/utils/fraudReportFilters'
import FilterSortBar, {
  type FilterOption,
  type SortOption
} from '@/shared/components/FilterSortBar'

const FILTER_OPTIONS: FilterOption<ReportStatus>[] = [
  { value: 'All', label: 'All' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Rejected', label: 'Rejected' }
]

const SORT_OPTIONS: SortOption[] = [
  { value: 'desc', label: 'Most Recent', icon: documentTextOutline },
  { value: 'asc', label: 'Oldest First', icon: documentTextOutline }
]

export default function FraudReport () {
  const PAGE_SIZE = 5
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success')
  const [activeFilters, setActiveFilters] = useState<Set<ReportStatus>>(
    new Set(['All'])
  )
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [allReports, setAllReports] = useState<FraudReportPublic[]>([])
  const [filteredReports, setFilteredReports] = useState<FraudReportPublic[]>(
    []
  )
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const { navigate } = useNavigation()

  const {
    reports,
    hasMore,
    fetchReports,
    loadMoreReports,
    fetchNewReports,
    loading
  } = useFraudReports({
    cacheKeys: {
      loadedKey: 'LoadedReports:staff:fraud',
      cacheKey: 'CachedFraudReports:staff'
    },
    pageSize: PAGE_SIZE,
    sortDirection: sortDir,
    onOffline: () => {
      setToastMessage(
        'Getting updated reports failed — not connected to the internet'
      )
      setToastColor('danger')
      setShowToast(true)
    }
  })

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    const uniqueReports = Array.from(
      new Map(reports.map(report => [report.report_id, report])).values()
    )
    setAllReports(uniqueReports)
  }, [reports])

  const updateFilteredReports = useCallback(() => {
    const filtered = applyFiltersAndSort(allReports, activeFilters, sortDir)
    setFilteredReports(filtered)
  }, [activeFilters, sortDir, allReports])

  useEffect(() => {
    updateFilteredReports()
  }, [updateFilteredReports])

  // Fetch more reports if filtered results are less than page size
  useEffect(() => {
    if (
      filteredReports.length >= 0 &&
      !loading &&
      filteredReports.length < PAGE_SIZE &&
      hasMore
    ) {
      fetchNewReports().catch(err => {
        console.error('Error fetching new reports after filter:', err)
      })
    }
  }, [filteredReports, hasMore, loading, fetchNewReports])

  useEffect(() => {
    const handler = (_ev?: Event) => {
      // Scroll to top immediately (don't wait for fetch)
      contentRef.current?.scrollToTop?.(300)

      // Fetch newest reports in background
      fetchNewReports()
        .then(() => {
          setToastMessage('Reports updated')
          setToastColor('success')
          setShowToast(true)
        })
        .catch(() => {
          setToastMessage('Failed to fetch new reports')
          setToastColor('danger')
          setShowToast(true)
        })
    }

    window.addEventListener('app:scrollToTop', handler as EventListener)
    return () =>
      window.removeEventListener('app:scrollToTop', handler as EventListener)
  }, [fetchNewReports])

  const handleLoadMore = async (event: CustomEvent<void>) => {
    const target = event.target as HTMLIonInfiniteScrollElement | null
    if (!target) return
    await loadMoreReports()
    target.complete()
  }

  const handleRefresh = async (event: CustomEvent) => {
    await fetchNewReports()
    event.detail.complete()
  }

  const handleReportClick = (reportId: string) => {
    navigate(`/staff/fraud-report/view/${reportId}`)
  }

  const handleSortChange = (sortValue: string) => {
    setSortDir(sortValue as SortDirection)
  }

  return (
    <>
      <Header logoShown={true} />
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color={toastColor}
      />
      {loading ? (
        <IonContent ref={contentRef} className='mb-16 bg-default-bg'>
          <div className='p-4'>
            <div className='mb-3 p-4 bg-white rounded-lg shadow-sm'>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  <IonSkeletonText
                    animated
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%'
                    }}
                  />
                  <IonSkeletonText
                    animated
                    style={{ width: '150px', height: '20px' }}
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <IonSkeletonText
                    animated
                    style={{
                      width: '100px',
                      height: '36px',
                      borderRadius: '20px'
                    }}
                  />
                  <IonSkeletonText
                    animated
                    style={{
                      width: '120px',
                      height: '36px',
                      borderRadius: '20px'
                    }}
                  />
                </div>
              </div>
            </div>
            {[...Array(3)].map((_, index) => (
              <FraudReportSkeleton key={index} />
            ))}
          </div>
        </IonContent>
      ) : filteredReports.length === 0 ? (
        <IonContent ref={contentRef} className='mb-16 bg-default-bg'>
          <div className='p-4'>
            <FilterSortBar
              title='Fraud Reports'
              icon={shieldCheckmarkOutline}
              filterOptions={FILTER_OPTIONS}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              filterSelectionType='single'
              filterModalTitle='Filter Reports'
              filterModalSubtitle='Select a report status'
              hasFilterClear={false}
              hasFilterEnter={false}
              sortOptions={SORT_OPTIONS}
              activeSort={sortDir}
              onSortChange={handleSortChange}
              sortModalTitle='Sort by date reported'
              sortButtonLabel={sortDir === 'desc' ? 'Recent' : 'Oldest'}
            />

            <div className='flex justify-center items-center h-64 text-gray-400'>
              <p>No fraud reports match the selected filters</p>
            </div>
          </div>
        </IonContent>
      ) : (
        <IonContent ref={contentRef} className='mb-16 bg-default-bg'>
          <IonRefresher slot='fixed' onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          <div>
            <FilterSortBar
              title='Fraud Reports'
              icon={shieldCheckmarkOutline}
              filterOptions={FILTER_OPTIONS}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              filterSelectionType='single'
              filterModalTitle='Filter Reports'
              filterModalSubtitle='Select a report status'
              hasFilterClear={false}
              hasFilterEnter={false}
              sortOptions={SORT_OPTIONS}
              activeSort={sortDir}
              onSortChange={handleSortChange}
              sortModalTitle='Sort by date reported'
              sortButtonLabel={sortDir === 'desc' ? 'Recent' : 'Oldest'}
            />

            {filteredReports.map(report => (
              <FraudReportCard
                key={report.report_id}
                reportId={report.report_id}
                posterName={report.poster_name || undefined}
                posterProfilePictureUrl={report.poster_profile_picture_url}
                reporterName={report.reporter_name || undefined}
                reporterProfilePictureUrl={report.reporter_profile_picture_url}
                itemName={report.item_name || undefined}
                itemDescription={report.item_description || undefined}
                lastSeenAt={report.last_seen_at || undefined}
                reasonForReporting={report.reason_for_reporting || undefined}
                dateReported={report.date_reported || undefined}
                itemImageUrl={report.item_image_url || undefined}
                reportStatus={report.report_status}
                onClick={handleReportClick}
              />
            ))}

            {hasMore && (
              <IonInfiniteScroll
                onIonInfinite={handleLoadMore}
                threshold='100px'
              >
                <IonInfiniteScrollContent loadingText='Loading more reports...' />
              </IonInfiniteScroll>
            )}

            {!hasMore && filteredReports.length > 0 && (
              <div className='text-center text-gray-500 pb-16'>
                You're all caught up!
              </div>
            )}
          </div>
        </IonContent>
      )}
    </>
  )
}
