import {
  useState,
  useEffect,
  useRef,
  type MouseEventHandler,
  memo
} from 'react'
import {
  IonSearchbar,
  IonToast,
  IonContent,
  IonCard,
  IonCardContent,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonActionSheet
} from '@ionic/react'
import { listOutline, documentTextOutline } from 'ionicons/icons'
import { Keyboard } from '@capacitor/keyboard'
import { useNavigation } from '@/shared/hooks/useNavigation'
import Header from '@/shared/components/Header'
import FilterSortBar from '@/shared/components/FilterSortBar'
import type {
  FilterCategory,
  SortOption
} from '@/shared/components/FilterSortBar'
import { listStaffPosts } from '@/features/posts/data/posts'
import { refreshStaffPosts } from '@/features/posts/data/postsRefresh'
import { usePostFetching } from '@/shared/hooks/usePostFetching'
import CatalogPost from '@/shared/components/CatalogPost'
import { useFilterAndSortPosts } from '@/shared/hooks/useFilterAndSortPosts'
import { type PostStatus, type SortDirection } from '@/shared/utils/postFilters'
import { sharePost } from '@/shared/utils/shareUtils'

// Header Component
const PostRecordsHeader = memo(
  ({ handleClick }: { handleClick: MouseEventHandler }) => {
    const searchRef = useRef<HTMLIonSearchbarElement>(null)
    return (
      <Header logoShown={true}>
        <IonSearchbar
          ref={searchRef}
          onClick={handleClick}
          placeholder='Search'
          showClearButton='never'
          style={
            {
              ['--border-radius']: '0.5rem'
            } as React.CSSProperties
          }
        />
      </Header>
    )
  }
)

export default function PostRecords () {
  const PAGE_SIZE = 5
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success')
  const [activeFilters, setActiveFilters] = useState<Set<PostStatus>>(
    new Set(['Accepted', 'Found'])
  )
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [showActions, setShowActions] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const { navigate } = useNavigation()

  // Filter categories for FilterSortBar
  const filterCategories: FilterCategory<PostStatus>[] = [
    {
      categoryName: 'Post Status',
      options: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Accepted', label: 'Accepted' },
        { value: 'Rejected', label: 'Rejected' },
        { value: 'Fraud', label: 'Fraud' }
      ]
    },
    {
      categoryName: 'Item Status',
      options: [
        { value: 'Claimed', label: 'Claimed' },
        { value: 'Unclaimed', label: 'Unclaimed' },
        { value: 'Lost', label: 'Lost' },
        { value: 'Returned', label: 'Returned' }
      ]
    },
    {
      categoryName: 'Item Type',
      options: [
        { value: 'Missing', label: 'Missing' },
        { value: 'Found', label: 'Found' }
      ]
    }
  ]

  const sortOptions: SortOption[] = [
    {
      value: 'desc',
      label: 'Latest Upload (Desc)',
      icon: documentTextOutline
    },
    {
      value: 'asc',
      label: 'Oldest Upload (Asc)',
      icon: documentTextOutline
    }
  ]

  // Use the reusable hook
  const { posts, hasMore, fetchPosts, loadMorePosts, refreshPosts, loading } =
    usePostFetching({
      fetchFunction: listStaffPosts,
      refreshPostFunction: refreshStaffPosts,
      cacheKeys: {
        loadedKey: 'LoadedPosts:staff:records',
        cacheKey: 'CachedPublicPosts:staff:records'
      },
      pageSize: PAGE_SIZE,
      sortDirection: sortDir,
      onOffline: () => {
        setToastMessage(
          'Getting updated posts failed — not connected to the internet'
        )
        setToastColor('danger')
        setShowToast(true)
      }
    })

  // Use custom hook for filtering and sorting
  const filteredPosts = useFilterAndSortPosts({
    posts,
    activeFilters,
    sortDirection: sortDir,
    filterMode: 'intersection'
  })

  // Fetch more posts if filtered results are less than page size
  useEffect(() => {
    if (filteredPosts.length < PAGE_SIZE && hasMore && !loading) {
      loadMorePosts().catch(err => {
        console.error('Error loading more posts after filter:', err)
      })
    }
  }, [filteredPosts.length, hasMore, loading, loadMorePosts])

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    const handler = (_ev?: Event) => {
      contentRef.current?.scrollToTop?.(300)
    }

    window.addEventListener('app:scrollToTop', handler as EventListener)
    return () =>
      window.removeEventListener('app:scrollToTop', handler as EventListener)
  }, [])

  const handleLoadMore = async (event: CustomEvent<void>) => {
    await loadMorePosts()
    const target = event.target as HTMLIonInfiniteScrollElement | null
    if (target) target.complete()
  }

  const handleRefresh = async (event: CustomEvent) => {
    await refreshPosts()
    event.detail.complete()
  }

  const handleSearchBarClick = () => {
    Keyboard.hide()
    navigate('/staff/search')
  }

  const handlePostClick = (postId: string) => {
    navigate(`/staff/post-record/view/${postId}`)
  }

  const handleActionSheetClick = async (
    action: string,
    postId?: string | null
  ) => {
    setShowActions(false)
    const id = postId ?? selectedPostId
    if (!id) return

    switch (action) {
      case 'view':
        navigate(`/staff/post-record/view/${id}`)
        break
      case 'share':
        const result = await sharePost(id, 'user')
        if (result.success) {
          if (result.method === 'clipboard') {
            setToastMessage('Link copied to clipboard')
            setToastColor('success')
            setShowToast(true)
          }
        } else {
          setToastMessage('Failed to share post')
          setToastColor('danger')
          setShowToast(true)
        }
        break
      case 'notify':
        // TODO: Implement notify owner
        setToastMessage('Notify owner functionality coming soon')
        setToastColor('success')
        setShowToast(true)
        break
      case 'claim':
        navigate(`/staff/post/claim/${id}`)
        break
    }
  }

  // Skeleton component
  const PostSkeleton = () => (
    <IonCard className='mb-3'>
      <IonCardContent>
        <div className='flex items-start gap-3'>
          {/* Image skeleton */}
          <div className='w-24 h-24 rounded-lg overflow-hidden flex-shrink-0'>
            <IonSkeletonText
              animated
              style={{ width: '100%', height: '100%' }}
            />
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
            <IonSkeletonText
              animated
              style={{ width: '70%', height: '14px' }}
            />
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  )

  return (
    <>
      <PostRecordsHeader handleClick={handleSearchBarClick} />
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
          <div>
            {/* Top action row skeleton */}
            <IonCard className='px-4 mb-3'>
              <IonCardContent className='flex items-center justify-between gap-3'>
                <div className='flex items-center mb-2 gap-2'>
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
                    style={{ width: '120px', height: '20px' }}
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
                      width: '140px',
                      height: '36px',
                      borderRadius: '20px'
                    }}
                  />
                </div>
              </IonCardContent>
            </IonCard>

            {/* Post skeletons */}
            {[...Array(3)].map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        </IonContent>
      ) : (
        <>
          {/* FilterSortBar component */}
          <FilterSortBar
            title='Post Records'
            icon={listOutline}
            filterCategories={filterCategories}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            filterSelectionType='single-per-category'
            filterModalTitle='Filter Posts'
            filterModalSubtitle='Select multiple post statuses to be displayed.'
            hasFilterClear={true}
            hasFilterEnter={true}
            sortOptions={sortOptions}
            activeSort={sortDir}
            onSortChange={value => setSortDir(value as SortDirection)}
            sortModalTitle='Sort display order by'
            sortButtonLabel={
              sortDir === 'desc' ? 'Recent Upload' : 'Oldest Upload'
            }
          />
          <IonContent ref={contentRef} className='bg-default-bg'>
            <div className={`${hasMore ? 'mb-35' : 'mb-45'}`}>
              {!loading && (
                <IonRefresher slot='fixed' onIonRefresh={handleRefresh}>
                  <IonRefresherContent />
                </IonRefresher>
              )}
              {filteredPosts.length === 0 ? (
                <div className='flex justify-center items-center h-64 text-gray-400'>
                  <p>No posts match the selected filters</p>
                </div>
              ) : (
                <>
                  {/* Posts */}
                  {filteredPosts.map(post => (
                    <div className='w-full h-full mb-4' key={post.post_id}>
                      <CatalogPost
                        postId={post.post_id}
                        username={post.username}
                        user_profile_picture_url={post.profilepicture_url}
                        itemName={post.item_name}
                        description={post.item_description || ''}
                        lastSeen={post.submission_date || ''}
                        imageUrl={post.item_image_url || ''}
                        locationLastSeenAt={post.last_seen_location || ''}
                        itemStatus={post.item_status}
                        onClick={() => handlePostClick(post.post_id)}
                        onKebabButtonClick={() => {
                          setSelectedPostId(post.post_id)
                          setShowActions(true)
                        }}
                        variant='postRecords'
                        showAnonIndicator={post.is_anonymous}
                      />
                    </div>
                  ))}

                  {hasMore && (
                    <IonInfiniteScroll
                      onIonInfinite={handleLoadMore}
                      threshold='100px'
                      className='my-2'
                    >
                      <IonInfiniteScrollContent loadingSpinner='crescent' />
                    </IonInfiniteScroll>
                  )}

                  {!hasMore && !loading && filteredPosts.length > 0 && (
                    <div className='text-center text-gray-500 '>
                      You're all caught up!
                    </div>
                  )}
                </>
              )}
            </div>
          </IonContent>
        </>
      )}

      {/* Custom Action Sheet for Post Records */}
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        buttons={[
          {
            text: 'View details',
            handler: () => handleActionSheetClick('view')
          },
          {
            text: 'Share',
            handler: () => handleActionSheetClick('share')
          },
          {
            text: 'Notify the owner',
            handler: () => handleActionSheetClick('notify')
          },
          {
            text: 'Claim Item',
            handler: () => handleActionSheetClick('claim')
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />
    </>
  )
}
