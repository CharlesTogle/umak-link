import type { PublicPost } from '@/features/posts/types/post'
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLoading,
  IonActionSheet,
  IonToast
} from '@ionic/react'
import { useState, useEffect } from 'react'
import CatalogPost from '@/shared/components/CatalogPost'
import CatalogPostSkeleton from '@/shared/components/CatalogPostSkeleton'
import { useCallback } from 'react'
import { type PostCacheKeys } from '@/features/posts/data/postsCache'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { sharePost } from '@/shared/utils/shareUtils'
import { useUser } from '@/features/auth/contexts/UserContext'
import { isConnected } from '@/shared/utils/networkCheck'
import { supabase } from '@/shared/lib/supabase'

interface PostListProps {
  ref?: React.RefObject<HTMLIonContentElement | null>
  posts: PublicPost[]
  children?: React.ReactNode
  fetchPosts: () => Promise<void>
  fetchNewPosts?: () => Promise<void>
  hasMore: boolean
  setPosts: React.Dispatch<React.SetStateAction<PublicPost[]>>
  loadedIdsRef: React.RefObject<Set<string>>
  loadMorePosts: (event: CustomEvent<void>) => Promise<void>
  ionFabButton?: React.ReactNode
  cacheKeys?: Partial<PostCacheKeys>
  sortDirection?: 'asc' | 'desc'
  pageSize: number
  onClick?: (postId: string) => void | undefined
  variant?: 'user' | 'staff' | 'search' | 'staff-pending' 
  handleRefresh?: (event: CustomEvent) => Promise<void>
  viewDetailsPath?: string // Optional custom path for "View details" action, defaults to /user/post/view/:postId
  marginBottom?: string
  enableReportForClaimed?: boolean // Only show Report action for claimed items (user homepage)
  withDelete?: boolean // Enable delete action for posts
}

export default function PostList ({
  posts,
  children,
  ref,
  fetchPosts,
  hasMore,
  loadMorePosts,
  ionFabButton,
  fetchNewPosts,
  onClick,
  variant = 'user',
  handleRefresh: customHandleRefresh,
  setPosts,
  viewDetailsPath,
  marginBottom,
  enableReportForClaimed = false,
  withDelete = false
}: PostListProps) {
  const [isRefreshingContent, setRefreshingContent] = useState<boolean>(false)
  const [showActions, setShowActions] = useState(false)
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success')
  const [isDeleting, setIsDeleting] = useState(false)

  const { navigate } = useNavigation()
  const { getUser } = useUser()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const u = await getUser()
        if (mounted && u) setCurrentUserId(u.user_id)
      } catch (err) {
        console.warn('PostList: failed to get current user', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [getUser])
  const handleActionSheetClick = (postId: string) => {
    console.log('Handling action sheet click for post ID:', postId)
    setActivePostId(postId)
    setShowActions(true)
  }

  const handleDeletePost = async (postId: string) => {
    setIsDeleting(true)
    try {
      const connected = await isConnected()
      if (!connected) {
        setToastMessage('No internet connection - Cannot delete post')
        setToastColor('danger')
        setShowToast(true)
        setIsDeleting(false)
        return
      }

      const { error } = await supabase.rpc('delete_post_by_id', {
        p_post_id: parseInt(postId)
      })

      if (error) {
        console.error('Error deleting post:', error)
        setToastMessage('Failed to delete post')
        setToastColor('danger')
        setShowToast(true)
      } else {
        // Remove post from local state
        setPosts(prevPosts => prevPosts.filter(p => p.post_id !== postId))
        setToastMessage('Post deleted successfully')
        setToastColor('success')
        setShowToast(true)
      }
    } catch (err) {
      console.error('Unexpected error deleting post:', err)
      setToastMessage('Failed to delete post')
      setToastColor('danger')
      setShowToast(true)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    const loadInitialPosts = async () => {
      setLoading(true)
      await fetchPosts()
      await fetchNewPosts?.()
      setLoading(false)
    }
    loadInitialPosts()
  }, [])

  const handleRefresh = useCallback(
    (event: CustomEvent) => {
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

        if (customHandleRefresh) {
          await customHandleRefresh(event)
        } else {
          await fetchPosts()
          event.detail.complete()
        }
        setRefreshingContent(false)
      })()
    },
    [customHandleRefresh, fetchPosts]
  )

  return (
    <IonContent ref={ref} className='bg-default-bg'>
      <div
        className={`pb-6 ${hasMore ? 'mb-16' : 'mb-25 '} ${
          marginBottom ? `mb-${marginBottom}!` : ''
        }`}
      >
        <IonRefresher slot='fixed' onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {typeof children !== 'undefined' ? children : null}

        {loading ? (
          <div className='flex flex-col gap-4 animate-pulse'>
            {[...Array(2)].map((_, index) => (
              <CatalogPostSkeleton className='w-full' key={index} />
            ))}
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {posts.map((post, idx) => {
              let displayUsername = post.username
              let showAnonIndicator = false
              if (post.is_anonymous) {
                if (variant === 'staff' || variant === 'staff-pending') {
                  // Staff: show real username + anon indicator
                  showAnonIndicator = true
                } else {
                  // User: show only 'Anonymous'
                  displayUsername = 'Anonymous'
                }
              }
              return (
                <CatalogPost
                  key={post.post_id}
                  itemName={post.item_name}
                  description={post.item_description || ''}
                  lastSeen={post.last_seen_at || ''}
                  imageUrl={post.item_image_url || ''}
                  locationLastSeenAt={post.last_seen_location || ''}
                  user_profile_picture_url={post.profilepicture_url}
                  username={displayUsername}
                  className={!hasMore && idx === posts.length - 1 ? '' : ''}
                  onKebabButtonClick={() =>
                    handleActionSheetClick(post.post_id)
                  }
                  itemStatus={
                    variant === 'staff-pending'
                      ? post.item_type
                      : post.item_status
                  }
                  onClick={() => onClick?.(post.post_id)}
                  postId={post.post_id}
                  variant={variant}
                  is_anonymous={post.is_anonymous}
                  showAnonIndicator={showAnonIndicator}
                  item_type={post.item_type}
                  setPosts={setPosts}
                  user_id={post.user_id}
                  category={post.category ?? 'others'}
                  submittedOn={post.submission_date ?? 'MM/DD/YYYY 00:00 AM/PM'}
                />
              )
            })}
          </div>
        )}

        {hasMore ? (
          <IonInfiniteScroll threshold='100px' onIonInfinite={loadMorePosts}>
            <div className='pt-5'>
              <IonInfiniteScrollContent
                loadingSpinner='crescent'
                loadingText='Loading more posts...'
              />
            </div>
          </IonInfiniteScroll>
        ) : (
          !loading &&
          !hasMore && (
            <p className='mb-10 py-4 flex justify-center items-center text-gray-400'>
              You're all caught up!
            </p>
          )
        )}
      </div>

      {isRefreshingContent && (
        <IonLoading isOpen message='Refreshing content...' spinner='crescent' />
      )}

      {isDeleting && (
        <IonLoading isOpen message='Deleting post...' spinner='crescent' />
      )}

      {ionFabButton}

      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        header='Post actions'
        buttons={(() => {
          const post = posts.find(p => p.post_id === activePostId)
          const buttons = []

          // Delete: only if withDelete is true AND (item_status 'unclaimed'/'lost' OR post_status 'rejected'/'pending')
          if (
            withDelete &&
            post &&
            (post.item_status === 'unclaimed' ||
              post.item_status === 'lost' ||
              post.post_status === 'rejected' ||
              post.post_status === 'pending')
          ) {
            buttons.push({
              text: 'Delete',
              role: 'destructive',
              handler: () => {
                if (activePostId) handleDeletePost(activePostId)
              },
              cssClass: 'delete-btn'
            })
          }
          // Edit: only for post_status 'pending'
          if (post && post.post_status === 'pending') {
            buttons.push({
              text: 'Edit',
              handler: () => {
                if (activePostId) navigate(`/user/post/edit/${activePostId}`)
              },
              cssClass: 'edit-btn'
            })
          }
          // View details: always
          buttons.push({
            text: 'View details',
            handler: () => {
              if (activePostId) {
                let path: string
                if (viewDetailsPath) {
                  path = viewDetailsPath.replace(':postId', activePostId)
                } else if (variant === 'staff-pending') {
                  path = `/staff/post-record/view/${activePostId}`
                } else {
                  path = `/user/post/view/${activePostId}`
                }
                navigate(path)
              }
            }
          })
          // Share and Report (existing logic)
          buttons.push({
            text: 'Share',
            handler: async () => {
              if (!activePostId) return
              const result = await sharePost(
                activePostId,
                variant === 'staff' ? 'staff' : 'user'
              )
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
            }
          })
          // Only show "Report" if enableReportForClaimed is true, item is claimed, and not owned by current user
          if (
            enableReportForClaimed &&
            post &&
            post.item_status === 'claimed' &&
            !(post.user_id && currentUserId && post.user_id === currentUserId)
          ) {
            buttons.push({
              text: 'Report',
              role: 'destructive',
              handler: () => {
                if (activePostId) navigate(`/user/post/report/${activePostId}`)
              },
              cssClass: 'report-btn'
            })
          }
          buttons.push({
            text: 'Cancel',
            role: 'cancel'
          })
          return buttons
        })()}
      />

      {/* Toast for share feedback */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position='top'
        color={toastColor}
      />
    </IonContent>
  )
}
