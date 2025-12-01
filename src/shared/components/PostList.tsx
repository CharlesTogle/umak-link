import type { PublicPost } from '@/features/posts/types/post'
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLoading,
  IonActionSheet,
  IonToast,
  IonModal,
  IonChip,
  IonLabel,
  IonButton
} from '@ionic/react'
import { useState, useEffect, useRef } from 'react'
import CatalogPost from '@/shared/components/CatalogPost'
import CatalogPostSkeleton from '@/shared/components/CatalogPostSkeleton'
import { useCallback } from 'react'
import { type PostCacheKeys } from '@/features/posts/data/postsCache'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { sharePost, getPostShareUrl } from '@/shared/utils/shareUtils'
import { Share } from '@capacitor/share'
import { isConnected } from '@/shared/utils/networkCheck'
import { supabase } from '@/shared/lib/supabase'
import { usePostActionsStaffServices } from '@/features/staff/hooks/usePostStaffServices'
import { ChoiceModal } from '@/shared/components/ChoiceModal'
import { rejectReasons } from '@/features/staff/utils/catalogPostHandlers'
import { useUser, type User } from '@/features/auth/contexts/UserContext'

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
  variant?: 'user' | 'staff' | 'search' | 'staff-pending' | 'postRecords'
  handleRefresh?: (event: CustomEvent) => Promise<void>
  viewDetailsPath?: string // Optional custom path for "View details" action, defaults to /user/post/view/:postId
  marginBottom?: string
  enableReportForClaimed?: boolean // Only show Report action for claimed items (user homepage)
  withDelete?: boolean // Enable delete action for posts
  customLoading?: boolean | undefined // Use custom loading state instead of internal
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
  withDelete = false,
  customLoading = undefined
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

  const { updatePostStatusWithNotification, updateItemStatus } =
    usePostActionsStaffServices()

  // Status change modal state (used only for postRecords variant)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedItemStatus, setSelectedItemStatus] = useState<string | null>(
    null
  )
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const statusChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        const currUser = await getUser()
        if (currUser) {
          setUser(currUser)
        } else {
          window.location.href = '/auth'
        }
      }
    }
    fetchUser()
  }, [])

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

  // Helpers for status modal (used when variant === 'postRecords')
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return '#16a34a'
      case 'rejected':
        return '#C1272D'
      case 'pending':
        return '#d97706'
      case 'claimed':
      case 'returned':
        return '#16a34a'
      case 'unclaimed':
      case 'lost':
        return '#d97706'
      case 'fraud':
        return '#b91c1c'
      case 'discarded':
        return '#C1272D'
      default:
        return '#f59e0b'
    }
  }

  const getStatusOptions = () => ['pending', 'accepted', 'rejected']

  const getItemStatusOptions = (post?: PublicPost) => {
    if (!post) return []
    if (post.item_type === 'found') return ['claimed', 'unclaimed', 'discarded']
    return ['returned', 'lost']
  }

  const isItemStatusAllowed = (itemStatus: string) => {
    if (!selectedStatus) return true
    switch (selectedStatus) {
      case 'pending':
        return itemStatus === 'unclaimed'
      case 'accepted':
        return true
      case 'rejected':
        return itemStatus === 'unclaimed' || itemStatus === 'discarded'
      default:
        return true
    }
  }

  const isPostStatusAllowed = (postStatus: string) => {
    if (!selectedItemStatus) return true
    switch (selectedItemStatus) {
      case 'claimed':
      case 'returned':
        return postStatus === 'accepted'
      case 'unclaimed':
      case 'lost':
        return true
      case 'discarded':
        return postStatus === 'rejected' || postStatus === 'accepted'
      default:
        return true
    }
  }

  const isStatusActive = (status: string) => selectedStatus === status
  const isItemStatusActive = (status: string) => selectedItemStatus === status

  const handleApplyStatusChange = async () => {
    if (!activePostId) return

    const post = posts.find(p => p.post_id === activePostId)
    if (!post) return

    if (statusChangeTimeoutRef.current) {
      setToastMessage(
        'This post and item status was just changed a second ago, please wait a few seconds before changing it again'
      )
      setToastColor('danger')
      setShowToast(true)
      return
    }

    if (!selectedStatus && !selectedItemStatus) {
      setToastMessage('Please select at least one status to change')
      setToastColor('danger')
      setShowToast(true)
      return
    }

    if (selectedItemStatus === 'claimed' && post.item_status !== 'claimed') {
      setShowStatusModal(false)
      setSelectedStatus(null)
      setSelectedItemStatus(null)
      navigate(`/staff/post/claim/${activePostId}`)
      return
    }

    if (selectedStatus === 'rejected') {
      setShowStatusModal(false)
      setShowRejectionModal(true)
      return
    }

    setIsSubmittingStatus(true)
    statusChangeTimeoutRef.current = setTimeout(async () => {
      try {
        if (selectedStatus && selectedStatus !== post.post_status) {
          const res = await updatePostStatusWithNotification(
            activePostId,
            selectedStatus as 'accepted' | 'rejected' | 'pending'
          )
          if (!res.success) {
            setToastMessage(res.error || 'Failed to update post status')
            setToastColor('danger')
            setShowToast(true)
            setIsSubmittingStatus(false)
            return
          }
        }

        if (selectedItemStatus && selectedItemStatus !== post.item_status) {
          const itemRes = await updateItemStatus(
            activePostId,
            selectedItemStatus as
              | 'claimed'
              | 'unclaimed'
              | 'discarded'
              | 'returned'
              | 'lost'
          )
          if (!itemRes.success) {
            setToastMessage(itemRes.error || 'Failed to update item status')
            setToastColor('danger')
            setShowToast(true)
            setIsSubmittingStatus(false)
            return
          }
        }

        setToastMessage('Status updated successfully')
        setToastColor('success')
        setShowToast(true)

        await fetchPosts()
      } catch (err) {
        console.error('Error applying status change', err)
        setToastMessage('Failed to apply status change')
        setToastColor('danger')
        setShowToast(true)
      } finally {
        setIsSubmittingStatus(false)
        setShowStatusModal(false)
        setSelectedStatus(null)
        setSelectedItemStatus(null)
        if (statusChangeTimeoutRef.current) {
          clearTimeout(statusChangeTimeoutRef.current)
          statusChangeTimeoutRef.current = null
        }
      }
    }, 1000)
  }

  const handleRejectWithReason = async (choice: string) => {
    if (!activePostId || !choice.trim()) {
      setToastMessage('Please select a rejection reason')
      setToastColor('danger')
      setShowToast(true)
      return
    }

    setShowRejectionModal(false)
    setIsSubmittingStatus(true)
    const result = await updatePostStatusWithNotification(
      activePostId,
      'rejected',
      choice.trim()
    )

    if (result.success) {
      setToastMessage('Post rejected successfully')
      setToastColor('success')
      setShowToast(true)
      await fetchPosts()
    } else {
      setToastMessage(result.error || 'Failed to reject post')
      setToastColor('danger')
      setShowToast(true)
    }

    setIsSubmittingStatus(false)
    setSelectedStatus(null)
  }

  useEffect(() => {
    return () => {
      if (statusChangeTimeoutRef.current) {
        clearTimeout(statusChangeTimeoutRef.current)
        statusChangeTimeoutRef.current = null
      }
    }
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

        {(customLoading !== undefined ? customLoading : loading) ? (
          <div className='flex flex-col gap-4 animate-pulse'>
            {[...Array(2)].map((_, index) => (
              <CatalogPostSkeleton className='w-full' key={index} />
            ))}
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {(() => {
              // Deduplicate posts by post_id while preserving order
              const seen = new Set<string>()
              const uniquePosts = [] as typeof posts
              for (const p of posts) {
                if (!p || p.post_id == null) continue
                const id = String(p.post_id)
                if (seen.has(id)) continue
                seen.add(id)
                uniquePosts.push(p)
              }
              return uniquePosts.map((post, idx) => {
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
                    key={String(post.post_id)}
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
                    currentUserId={user?.user_id}
                    submittedOn={
                      post.submission_date ?? 'MM/DD/YYYY 00:00 AM/PM'
                    }
                    onShowToast={(message, color) => {
                      setToastMessage(message)
                      setToastColor(color)
                      setShowToast(true)
                    }}
                  />
                )
              })
            })()}
          </div>
        )}

        {hasMore ? (
          <IonInfiniteScroll threshold='100px' onIonInfinite={loadMorePosts}>
            <div className='pt-5 bg-white!'>
              <IonInfiniteScrollContent
                loadingSpinner='crescent'
                loadingText='Loading more posts...'
              />
            </div>
          </IonInfiniteScroll>
        ) : (
          !loading &&
          !hasMore && (
            <p className='mb-10 py-4 flex justify-center items-center text-gray-400 bg-white!'>
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
          // View details: always (handle postRecords specially)
          buttons.push({
            text: 'View details',
            handler: () => {
              if (activePostId) {
                let path: string
                if (viewDetailsPath) {
                  path = viewDetailsPath.replace(':postId', activePostId)
                } else if (
                  variant === 'staff-pending' ||
                  variant === 'postRecords'
                ) {
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
              const domain =
                variant === 'postRecords'
                  ? 'user'
                  : variant === 'staff'
                  ? 'staff'
                  : 'user'
              const shareUrl = getPostShareUrl(activePostId, domain)

              // Prefer Capacitor Share on native platforms; fall back to web sharePost util
              try {
                const platform = (window as any).Capacitor?.getPlatform?.()
                if (platform && platform !== 'web') {
                  try {
                    await Share.share({
                      title: 'Check out this post',
                      text: 'Found this interesting post on UMak LINK',
                      url: shareUrl
                    })
                    // Optionally show a success toast for native share
                    setToastMessage('Share sheet opened')
                    setToastColor('success')
                    setShowToast(true)
                    return
                  } catch (e) {
                    console.warn(
                      'Capacitor Share failed, falling back to web share',
                      e
                    )
                    // fall through to web fallback
                  }
                }

                // Web fallback: use existing share utility (uses navigator.share or clipboard)
                const result = await sharePost(activePostId, domain)
                if (result.success) {
                  if (result.method === 'clipboard') {
                    setToastMessage('Link copied to clipboard')
                    setToastColor('success')
                    setShowToast(true)
                  }
                } else {
                  setToastMessage('Shared post cancelled')
                  setToastColor('danger')
                  setShowToast(true)
                }
              } catch (err) {
                console.error('Share action failed', err)
                setToastMessage('Failed to share post')
                setToastColor('danger')
                setShowToast(true)
              }
            }
          })
          // Additional staff/postRecords actions
          if (variant === 'staff') {
            // Change Status: open inline status modal for staff
            buttons.push({
              text: 'Change Status',
              handler: () => {
                const p = posts.find(p => p.post_id === activePostId)
                if (!activePostId || !p) return
                setSelectedStatus(p.post_status)
                setSelectedItemStatus(p.item_status)
                setShowActions(false)
                setShowStatusModal(true)
              }
            })
          }
          if (variant === 'postRecords') {
            const post = posts.find(p => p.post_id === activePostId)

            // Notify the owner: only for missing items with status 'lost'
            if (
              post &&
              post.item_type === 'missing' &&
              post.item_status === 'lost'
            ) {
              buttons.push({
                text: 'Notify the owner',
                handler: () => {
                  if (activePostId)
                    navigate(`/staff/post-record/view/${activePostId}`) // open record where notify can be sent
                }
              })
            }

            // Claim Item: allowed for found/unclaimed/accepted
            if (
              post &&
              post.item_type === 'found' &&
              post.item_status === 'unclaimed' &&
              post.post_status === 'accepted'
            ) {
              buttons.push({
                text: 'Claim Item',
                handler: () => {
                  if (activePostId)
                    navigate(`/staff/post/claim/${activePostId}`)
                }
              })
            }
          }
          // Only show "Report" if enableReportForClaimed is true, item is claimed, and not owned by current user
          if (
            enableReportForClaimed &&
            post &&
            post.item_status === 'claimed'
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
          if (
            post?.item_type === 'missing' &&
            post?.post_status === 'accepted' &&
            post?.item_status === 'lost' &&
            post
          ) {
            buttons.push({
              text: 'Copy Item ID',
              handler: async () => {
                try {
                  if (post.item_id) {
                    await navigator.clipboard.writeText(post.item_id)
                    setToastMessage('Item ID copied to clipboard')
                    setToastColor('success')
                    setShowToast(true)
                  } else {
                    setToastMessage('Item ID not available')
                    setToastColor('danger')
                    setShowToast(true)
                  }
                } catch (err) {
                  console.error('Failed to copy item ID:', err)
                  setToastMessage('Failed to copy Item ID')
                  setToastColor('danger')
                  setShowToast(true)
                }
              }
            })
          }
          return buttons
        })()}
      />

      {/* Status Change Modal (for staff variant) */}
      {variant === 'staff' && (
        <>
          <IonModal
            isOpen={showStatusModal}
            onDidDismiss={() => {
              setShowStatusModal(false)
              setSelectedStatus(null)
              setSelectedItemStatus(null)
            }}
            backdropDismiss={true}
            initialBreakpoint={0.4}
            breakpoints={[0.4, 0.6]}
            className='font-default-font'
            style={{ '--border-radius': '2rem' }}
          >
            <div className='flex flex-col items-center pb-4'>
              <div className='text-center'>
                <p className='text-base! font-medium! mt-5'>
                  Update Post Status
                </p>
                <p className='mt-1 mb-2 text-sm text-gray-500'>
                  Select a status to change the post status.
                </p>
              </div>

              <div className='w-full pt-4 px-4'>
                <div className='w-full bg-black h-px' />
                <h3 className='text-xs! font-semibold! text-black! uppercase! tracking-wide! mb-3!'>
                  Post Status
                </h3>
                <div className='flex flex-wrap gap-2 mb-4'>
                  {getStatusOptions().map(status => {
                    const isAllowed = isPostStatusAllowed(status)
                    const isActive = isStatusActive(status)
                    return (
                      <IonChip
                        key={status}
                        onClick={() => {
                          if (isAllowed) setSelectedStatus(status)
                        }}
                        outline={!isActive}
                        className='px-4'
                        disabled={!isAllowed}
                        style={{
                          '--background': isActive
                            ? getStatusColor(status)
                            : 'transparent',
                          '--color': isActive
                            ? 'white'
                            : getStatusColor(status),
                          border: `2px solid ${getStatusColor(status)}`,
                          opacity: isAllowed ? 1 : 0.4,
                          cursor: isAllowed ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <IonLabel className='capitalize'>{status}</IonLabel>
                      </IonChip>
                    )
                  })}
                </div>

                <div className='w-full bg-black h-px mt-4' />
                <h3 className='text-xs! font-semibold! text-black! uppercase! tracking-wide! mb-3!'>
                  Item Status
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {getItemStatusOptions(
                    posts.find(p => p.post_id === activePostId)
                  ).map(status => {
                    const isAllowed = isItemStatusAllowed(status)
                    const isActive = isItemStatusActive(status)
                    return (
                      <IonChip
                        key={status}
                        onClick={() => {
                          if (isAllowed) setSelectedItemStatus(status)
                        }}
                        outline={!isActive}
                        className='px-4'
                        disabled={!isAllowed}
                        style={{
                          '--background': isActive
                            ? getStatusColor(status)
                            : 'transparent',
                          '--color': isActive
                            ? 'white'
                            : getStatusColor(status),
                          border: `2px solid ${getStatusColor(status)}`,
                          opacity: isAllowed ? 1 : 0.4,
                          cursor: isAllowed ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <IonLabel className='capitalize'>{status}</IonLabel>
                      </IonChip>
                    )
                  })}
                </div>
              </div>

              <div className='flex justify-end gap-3 mt-6 px-4 w-full'>
                <IonButton
                  fill='clear'
                  onClick={() => {
                    setShowStatusModal(false)
                    setSelectedStatus(null)
                    setSelectedItemStatus(null)
                  }}
                  className='flex text-umak-blue'
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand='block'
                  onClick={handleApplyStatusChange}
                  disabled={
                    (!selectedStatus && !selectedItemStatus) ||
                    isSubmittingStatus
                  }
                  style={{ '--background': 'var(--color-umak-blue)' }}
                >
                  {isSubmittingStatus ? 'Updating...' : 'Apply Changes'}
                </IonButton>
              </div>
            </div>
          </IonModal>

          <ChoiceModal
            isOpen={showRejectionModal}
            header='Reject Post'
            subheading1='Select a reason to reject the post.'
            subheading2='Uploader will be notified upon submission.'
            choices={Array.from(rejectReasons)}
            onSubmit={handleRejectWithReason}
            onDidDismiss={() => {
              setShowRejectionModal(false)
              setSelectedStatus(null)
              setSelectedItemStatus(null)
            }}
          />
        </>
      )}

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
