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
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonActionSheet,
  IonFab,
  IonFabButton,
  IonIcon
} from '@ionic/react'
import { listOutline, documentTextOutline } from 'ionicons/icons'
import { Keyboard } from '@capacitor/keyboard'
import { useNavigation } from '@/shared/hooks/useNavigation'
import Header from '@/shared/components/Header'
import FilterSortBar from '@/shared/components/FilterSortBar'
import FilterSortBarSkeleton from '@/shared/components/FilterSortBarSkeleton'
import type {
  FilterCategory,
  SortOption
} from '@/shared/components/FilterSortBar'
import { listStaffPosts } from '@/features/posts/data/posts'
import { refreshStaffPosts } from '@/features/posts/data/postsRefresh'
import { usePostFetching } from '@/shared/hooks/usePostFetching'
import CatalogPost from '@/shared/components/CatalogPost'
import CatalogPostSkeleton from '@/shared/components/CatalogPostSkeleton'
import { useFilterAndSortPosts } from '@/shared/hooks/useFilterAndSortPosts'
import { type PostStatus, type SortDirection } from '@/shared/utils/postFilters'
import { sharePost } from '@/shared/utils/shareUtils'
import useNotifications from '@/features/user/hooks/useNotifications'
import { add } from 'ionicons/icons'
import { isConnected } from '@/shared/utils/networkCheck'
import { IonLoading } from '@ionic/react'
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
  const [activeFilters, setActiveFilters] = useState<Set<PostStatus | 'all'>>(
    new Set(['all'])
  )
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [showActions, setShowActions] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [isRefreshingContent, setRefreshingContent] = useState<boolean>(false)
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const { navigate } = useNavigation()
  const { sendNotification } = useNotifications()

  // Handle filter changes - clear filters when 'all' is selected
  const handleFilterChange = (filters: Set<PostStatus | 'all'>) => {
    if (filters.has('all') && !activeFilters.has('all')) {
      setActiveFilters(new Set(['all']))
    } else if (filters.has('all') && filters.size > 1) {
      const newFilters = new Set(filters)
      newFilters.delete('all')
      setActiveFilters(newFilters)
    } else if (filters.size === 0) {
      setActiveFilters(new Set(['all']))
    } else {
      setActiveFilters(filters)
    }
  }

  const handleAddPost = () => {
    navigate('/staff/post/create')
  }

  // Filter categories for FilterSortBar
  const filterCategories: FilterCategory<PostStatus | 'all'>[] = [
    {
      categoryName: '',
      options: [{ value: 'all', label: 'All' }]
    },
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
    activeFilters: activeFilters.has('all')
      ? new Set([])
      : (activeFilters as Set<PostStatus>),
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
    const handler = async (_ev?: Event) => {
      // Smooth scroll to top
      await contentRef.current?.scrollToTop?.(400)

      const connected = await isConnected()
      if (!connected) {
        setToastMessage('No internet connection - Showing cached posts')
        setToastColor('danger')
        setShowToast(true)
        return
      }

      await refreshPosts()
      setToastMessage('Post Records updated successfully')
      setToastColor('success')
      setShowToast(true)
    }

    window.addEventListener('app:scrollToTop', handler as EventListener)
    return () =>
      window.removeEventListener('app:scrollToTop', handler as EventListener)
  }, [refreshPosts])

  const handleLoadMore = async (event: CustomEvent<void>) => {
    await loadMorePosts()
    const target = event.target as HTMLIonInfiniteScrollElement | null
    if (target) target.complete()
  }

  const handleRefresh = (event: CustomEvent) => {
    setRefreshingContent(true)
    ;(async () => {
      const connected = await isConnected()
      if (!connected) {
        setToastMessage('No internet connection - Showing cached posts')
        setToastColor('danger')
        setShowToast(true)
        event.detail.complete()
        setRefreshingContent(false)
        return
      }

      await refreshPosts()
      event.detail.complete()
      setRefreshingContent(false)
    })()
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
        try {
          const post = filteredPosts.find(p => p.post_id === id)
          if (!post) {
            setToastMessage('Post not found')
            setToastColor('danger')
            setShowToast(true)
            return
          }

          await sendNotification({
            userId: post.user_id,
            title: 'Great News! A Possible Match to Your Item',
            message: `We have identified items that may possibly match your ${post.item_name}. Please proceed to the Security Office during office hours to verify if any of them belong to you.`,
            type: 'match',
            data: {
              postId: id,
              itemName: post.item_name,
              link: `/user/post/view/${id}`
            }
          })

          setToastMessage('Owner notified successfully')
          setToastColor('success')
          setShowToast(true)
        } catch (error) {
          console.error('Failed to notify owner:', error)
          setToastMessage('Failed to notify owner')
          setToastColor('danger')
          setShowToast(true)
        }
        break
      case 'claim':
        navigate(`/staff/post/claim/${id}`)
        break
    }
  }
  console.log(filteredPosts.length)

  return (
    <IonContent ref={contentRef}>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color={toastColor}
      />

      {isRefreshingContent && (
        <IonLoading isOpen message='Refreshing content...' spinner='crescent' />
      )}
      {loading ? (
        <>
          <PostRecordsHeader handleClick={handleSearchBarClick} />

          <div className=''>
            <FilterSortBarSkeleton />
            {[...Array(5)].map((_, index) => (
              <CatalogPostSkeleton key={index} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* FilterSortBar component */}
          <div className='fixed w-full z-10'>
            <PostRecordsHeader handleClick={handleSearchBarClick} />
            <FilterSortBar
              title='Post Records'
              icon={listOutline}
              filterCategories={filterCategories}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
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
          </div>
          {filteredPosts.length === 0 ? (
            <div className='flex justify-center items-center mt-15 text-gray-400 pt-40'>
              <p>No posts match the selected filters</p>
            </div>
          ) : (
            <div className='bg-default-bg pt-40'>
              <div className='mb-5'>
                {!loading && (
                  <IonRefresher slot='fixed' onIonRefresh={handleRefresh}>
                    <IonRefresherContent />
                  </IonRefresher>
                )}

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
                      category={post.category || 'others'}
                      submittedOn={post.submission_date ?? ''}
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
              </div>
            </div>
          )}
        </>
      )}

      <IonFab
        slot='fixed'
        vertical='bottom'
        horizontal='end'
        className='mb-10   mr-2'
      >
        <IonFabButton
          style={{
            '--background': 'var(--color-umak-blue)'
          }}
          onClick={handleAddPost}
        >
          <IonIcon icon={add}></IonIcon>
        </IonFabButton>
      </IonFab>

      {/* Custom Action Sheet for Post Records */}
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        buttons={(() => {
          const post = filteredPosts.find(p => p.post_id === selectedPostId)
          const buttons = []

          // View details: always available
          buttons.push({
            text: 'View details',
            handler: () => handleActionSheetClick('view')
          })

          // Share: always available
          buttons.push({
            text: 'Share',
            handler: () => handleActionSheetClick('share')
          })

          // Notify the owner: only for missing items with status 'lost'
          if (
            post &&
            post.item_type === 'missing' &&
            post.item_status === 'lost'
          ) {
            buttons.push({
              text: 'Notify the owner',
              handler: () => handleActionSheetClick('notify')
            })
          }
          console.log(post)
          if (
            post &&
            post.item_type === 'found' &&
            post.item_status === 'unclaimed'
          ) {
            buttons.push({
              text: 'Claim Item',
              handler: () => handleActionSheetClick('claim')
            })
          }

          // Cancel: always available
          buttons.push({
            text: 'Cancel',
            role: 'cancel'
          })

          console.log(post)
          if (
            post?.item_type === 'missing' &&
            post?.post_status === 'accepted' &&
            post?.item_status === 'lost' &&
            post
          ) {
            buttons.push({
              text: 'Copy Item ID',
              handler: async () => {
                console.log(post.item_id)
                if (post.item_id) {
                  try {
                    await navigator.clipboard.writeText(post.item_id)
                    setToastMessage('Item ID copied to clipboard')
                    setToastColor('success')
                    setShowToast(true)
                  } catch (err) {
                    console.error('Failed to copy item ID:', err)
                    setToastMessage('Failed to copy Item ID')
                    setToastColor('danger')
                    setShowToast(true)
                  }
                }
              }
            })
          }

          return buttons
        })()}
      />
    </IonContent>
  )
}
