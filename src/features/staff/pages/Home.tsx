import { useEffect, useRef, useState } from 'react'
import {
  IonToast,
  IonSkeletonText,
  IonCard,
  IonCardContent
} from '@ionic/react'
import { listOutline, arrowDownOutline, arrowUpOutline } from 'ionicons/icons'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { isConnected } from '@/shared/utils/networkCheck'
import Header from '@/shared/components/Header'
import FilterSortBar from '@/shared/components/FilterSortBar'
import FilterSortBarSkeleton from '@/shared/components/FilterSortBarSkeleton'
import type {
  FilterOption,
  SortOption
} from '@/shared/components/FilterSortBar'
import PostList from '@/shared/components/PostList'
import { refreshStaffPosts } from '@/features/posts/data/postsRefresh'
import { usePostFetching } from '@/shared/hooks/usePostFetching'
import { listPendingPosts } from '@/features/posts/data/posts'

const PostSkeleton = () => (
  <IonCard className='mb-3'>
    <IonCardContent>
      <div className='flex items-start gap-3'>
        {/* Image skeleton */}
        <div className='w-24 h-24 rounded-lg overflow-hidden flex-shrink-0'>
          <IonSkeletonText animated style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Content skeleton */}
        <div className='flex-1'>
          <IonSkeletonText
            animated
            style={{ width: '60%', height: '20px', marginBottom: '8px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '40%', height: '16px', marginBottom: '8px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '80%', height: '14px', marginBottom: '4px' }}
          />
          <IonSkeletonText animated style={{ width: '70%', height: '14px' }} />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className='flex gap-2 mt-3'>
        <IonSkeletonText
          animated
          style={{ width: '100px', height: '36px', borderRadius: '8px' }}
        />
        <IonSkeletonText
          animated
          style={{ width: '100px', height: '36px', borderRadius: '8px' }}
        />
      </div>
    </IonCardContent>
  </IonCard>
)

type ItemTypeFilter = 'all' | 'found' | 'missing'

export default function Home () {
  const PAGE_SIZE = 5
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastColor, setToastColor] = useState<
    'success' | 'danger' | 'warning'
  >('success')
  const [activeFilters, setActiveFilters] = useState<Set<ItemTypeFilter>>(
    new Set(['all'])
  )
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const { navigate } = useNavigation()

  // Use the reusable hook
  const {
    posts,
    setPosts,
    hasMore,
    fetchPosts,
    loadMorePosts,
    fetchNewPosts,
    refreshPosts,
    loadedIdsRef,
    loading
  } = usePostFetching({
    fetchFunction: listPendingPosts,
    refreshPostFunction: refreshStaffPosts,
    cacheKeys: {
      loadedKey: 'LoadedPosts:staff:home',
      cacheKey: 'CachedPublicPosts:staff:home'
    },
    pageSize: PAGE_SIZE,
    sortDirection: 'desc',
    onOffline: () => {
      setToastMessage('Offline. Showing cached posts')
      setToastColor('danger')
      setShowToast(true)
    },
    onError: error => {
      console.error(error)
      setToastMessage('Fetching posts failed')
      setToastColor('danger')
      setShowToast(true)
    }
  })

  // Filter configuration for FilterSortBar
  const filterOptions: FilterOption<ItemTypeFilter>[] = [
    { value: 'all', label: 'All Items' },
    { value: 'found', label: 'Found Items' },
    { value: 'missing', label: 'Missing Items' }
  ]

  const sortOptions: SortOption[] = [
    { value: 'desc', label: 'Newest First', icon: arrowDownOutline },
    { value: 'asc', label: 'Oldest First', icon: arrowUpOutline }
  ]

  // Filter and sort posts
  const filteredAndSortedPosts = posts
    .filter(post => {
      const filterArray = Array.from(activeFilters)
      const matchesType =
        filterArray.includes('all') ||
        activeFilters.size === 0 ||
        filterArray.includes(post.item_type as ItemTypeFilter)
      const isPending = post.post_status === 'pending'
      return matchesType && isPending
    })
    .sort((a, b) => {
      const dateA = new Date(a.submission_date || 0).getTime()
      const dateB = new Date(b.submission_date || 0).getTime()
      return sortDir === 'desc' ? dateB - dateA : dateA - dateB
    })

  const handlePostClick = (postId: string) => {
    navigate(`/staff/post-record/view/${postId}`)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // infinite scroll handler
  const handleLoadMore = async (event: CustomEvent<void>) => {
    const target = event.target as HTMLIonInfiniteScrollElement | null
    if (!target) return
    await loadMorePosts()
    target.complete()
  }

  // Pull-to-refresh: fetch new posts and refresh cache
  const handleRefresh = async (event: CustomEvent) => {
    try {
      const connected = await isConnected()
      if (!connected) {
        setToastMessage('No internet connection - Showing cached posts')
        setToastColor('danger')
        setShowToast(true)
        event.detail.complete()
        return
      }

      await fetchNewPosts()
      await refreshPosts()
    } finally {
      event.detail.complete()
    }
  }

  // scrollToTop event - fetch newest posts
  useEffect(() => {
    const handler = async (_ev?: Event) => {
      // Scroll to top immediately (don't wait for fetch)
      contentRef.current?.scrollToTop?.(300)

      // Check network status before fetching
      const connected = await isConnected()
      if (!connected) {
        setToastMessage('No internet connection - Showing cached posts')
        setToastColor('danger')
        setShowToast(true)
        return
      }

      // Fetch newest posts in background
      fetchNewPosts()
        .then(() => {
          setToastMessage('Posts updated')
          setToastColor('success')
          setShowToast(true)
        })
        .catch(() => {
          setToastMessage('Failed to fetch new posts')
          setToastColor('danger')
          setShowToast(true)
        })
    }

    window.addEventListener('app:scrollToTop', handler as EventListener)
    return () =>
      window.removeEventListener('app:scrollToTop', handler as EventListener)
  }, [fetchNewPosts])

  return (
    <>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color={toastColor}
      />
      {loading ? (
        <div className=''>
          <FilterSortBarSkeleton />
          {[...Array(3)].map((_, index) => (
            <PostSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          {/* Filter and Sort Bar */}
          <FilterSortBar
            title='Pending Posts'
            icon={listOutline}
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            filterSelectionType='single'
            filterModalTitle='Filter by Item Type'
            filterModalSubtitle='Select an item type to filter posts'
            sortOptions={sortOptions}
            activeSort={sortDir}
            onSortChange={sort => setSortDir(sort as 'asc' | 'desc')}
            sortModalTitle='Sort by Submission Date'
            breakpoints={[0.25, 0.5]}
            initialBreakpoint={0.25}
          />
          {filteredAndSortedPosts.length === 0 ? (
            <div className='flex justify-center items-center h-full text-gray-400'>
              <p>No pending posts at the moment</p>
            </div>
          ) : (
            <PostList
              posts={filteredAndSortedPosts}
              fetchPosts={fetchPosts}
              hasMore={hasMore}
              setPosts={setPosts}
              loadedIdsRef={loadedIdsRef}
              fetchNewPosts={fetchNewPosts}
              loadMorePosts={handleLoadMore}
              handleRefresh={handleRefresh}
              ref={contentRef}
              sortDirection={sortDir}
              cacheKeys={{
                loadedKey: 'LoadedPosts:staff:home',
                cacheKey: 'CachedPublicPosts:staff:home'
              }}
              onClick={handlePostClick}
              pageSize={PAGE_SIZE}
              variant='staff-pending'
            />
          )}
        </>
      )}
    </>
  )
}
