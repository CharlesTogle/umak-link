import React, { lazy, memo, useState, useRef, useEffect } from 'react'
const LazyImage = lazy(() => import('@/shared/components/LazyImage'))
import type { PublicPost } from '@/features/posts/types/post'
import {
  IonCard,
  IonCardContent,
  IonItem,
  IonAvatar,
  IonLabel,
  IonIcon,
  IonButtons,
  IonButton,
  IonText,
  IonSpinner
} from '@ionic/react'
import { ellipsisVertical, personCircle } from 'ionicons/icons'
import { formatTimestamp } from '@/shared/utils/formatTimeStamp'
import { ChoiceModal } from './ChoiceModal'
import {
  handleMatch as performMatch,
  handleRejectSubmit,
  handleAccept,
  rejectReasons
} from '@/features/staff/utils/catalogPostHandlers'
import { staffCustodyApiService } from '@/shared/services'

export type CatalogPostProps = {
  username?: string
  user_profile_picture_url?: string | null
  itemName?: string
  description?: string
  lastSeen?: string
  imageUrl?: string
  locationLastSeenAt?: string
  className?: string
  onKebabButtonClick?: () => void | undefined
  itemStatus?: string | null
  onClick?: (postId: string) => void | undefined
  postId?: string
  variant?: 'user' | 'staff' | 'search' | 'postRecords' | 'staff-pending'
  is_anonymous?: boolean
  showAnonIndicator?: boolean
  item_type?: string | null
  custody_status?: string | null
  setPosts?: React.Dispatch<React.SetStateAction<PublicPost[]>>
  user_id?: string
  category?: string
  submittedOn?: string | null
  claimedAt?: string | null
  currentUserId?: string
  onShowToast?: (message: string, color: 'success' | 'danger') => void
  showSecurityQuestionDetails?: boolean
}

const CatalogPost: React.FC<CatalogPostProps> = ({
  username = 'Profile Picture and Username',
  user_profile_picture_url = null,
  itemName = 'Item Name',
  description = 'Some really really really really long description that should be truncated.',
  lastSeen = 'MM/DD/YYYY 00:00 AM/PM',
  imageUrl,
  className = '',
  locationLastSeenAt = 'Location where item was last seen',
  onKebabButtonClick = undefined,
  itemStatus = null,
  onClick,
  postId,
  variant = 'user',
  is_anonymous = false,
  showAnonIndicator = false,
  item_type = null,
  custody_status = null,
  setPosts,
  user_id,
  category,
  submittedOn = null,
  claimedAt = null,
  currentUserId,
  onShowToast,
  showSecurityQuestionDetails = true
}) => {
  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'text-[#16a34a]' // green-600
      case 'rejected':
        return 'text-[#C1272D]' // umak-red
      case 'pending':
        return 'text-[#d97706]' // amber-600
      case 'claimed':
      case 'returned':
        return 'text-[#16a34a]' // green-600
      case 'unclaimed':
      case 'lost':
        return 'text-[#d97706]' // amber-600
      case 'fraud':
        return 'text-[#b91c1c]' // red-700
      case 'discarded':
        return 'text-[#C1272D]' // umak-red
      default:
        return 'text-[#f59e0b]' // amber-500
    }
  }

  const normalizedStatus = (itemStatus || '').toLowerCase()
  const normalizedCustodyStatus = (custody_status || '').toLowerCase()
  const statusColorClass = getStatusColorClass(normalizedStatus)
  const canApproveFoundPending =
    item_type === 'found' && normalizedCustodyStatus === 'in_security_office'
  const canMarkReceivedFoundPending =
    item_type === 'found' &&
    (normalizedCustodyStatus === 'with_guard' ||
      normalizedCustodyStatus === 'under_investigation')

  const [isProcessing, setIsProcessing] = useState(false)
  const rejectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const acceptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const matchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const receiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)

  // Staff action handlers

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!postId || isProcessing) return
    setShowRejectModal(true)
  }

  const handleRejectChoice = async (choice: string) => {
    if (!postId || isProcessing || !user_id || !currentUserId) return
    setShowRejectModal(false)

    if (rejectTimeoutRef.current) {
      clearTimeout(rejectTimeoutRef.current)
    }

    rejectTimeoutRef.current = setTimeout(async () => {
      setIsProcessing(true)

      const result = await handleRejectSubmit(
        postId,
        user_id,
        itemName,
        choice
      )

      setIsProcessing(false)
      if (result.success) {
        if (setPosts) {
          setPosts(prev => prev.filter(p => p.post_id !== postId))
        }
        onShowToast?.('Post rejected successfully', 'success')
      } else {
        onShowToast?.(result.error || 'Failed to reject post', 'danger')
      }

      if (rejectTimeoutRef.current) {
        clearTimeout(rejectTimeoutRef.current)
        rejectTimeoutRef.current = null
      }
    }, 500)
  }

  const handleAcceptClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!postId || isProcessing || !user_id || !currentUserId) return

    if (acceptTimeoutRef.current) {
      clearTimeout(acceptTimeoutRef.current)
    }

    acceptTimeoutRef.current = setTimeout(async () => {
      setIsProcessing(true)
      const result = await handleAccept(
        postId,
        user_id,
        itemName,
        description,
        imageUrl || null,
        currentUserId
      )
      setIsProcessing(false)

      if (result.success) {
        if (setPosts) {
          setPosts(prev => prev.filter(p => p.post_id !== postId))
        }
        onShowToast?.('Post accepted successfully', 'success')
      } else {
        onShowToast?.(result.error || 'Failed to accept post', 'danger')
      }

      if (acceptTimeoutRef.current) {
        clearTimeout(acceptTimeoutRef.current)
        acceptTimeoutRef.current = null
      }
    }, 500)
  }

  // Staff-pending variant handlers for Match and Delete
  const handleMatchClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!postId || isProcessing || !user_id) return

    if (matchTimeoutRef.current) {
      clearTimeout(matchTimeoutRef.current)
    }

    matchTimeoutRef.current = setTimeout(async () => {
      setIsProcessing(true)
      const result = await performMatch(
        postId,
        itemName,
        description,
        imageUrl || null,
        user_id
      )
      setIsProcessing(false)

      if (result.success) {
        // Remove post from home page immediately
        if (setPosts) {
          setPosts(prev => prev.filter(p => p.post_id !== postId))
        }
        onShowToast?.(
          "Finding Similar Items in progress, we'll notify the owner once it has found similar items",
          'success'
        )
      } else {
        onShowToast?.(result.error || 'Failed to schedule matching', 'danger')
      }

      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current)
        matchTimeoutRef.current = null
      }
    }, 500)
  }

  const handleReceiveClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!postId || isProcessing || item_type !== 'found') return

    if (receiveTimeoutRef.current) {
      clearTimeout(receiveTimeoutRef.current)
    }

    receiveTimeoutRef.current = setTimeout(async () => {
      setIsProcessing(true)

      try {
        await staffCustodyApiService.receiveInSecurityOffice(Number(postId))

        if (setPosts) {
          setPosts(prev =>
            prev.map(post =>
              post.post_id === postId
                ? { ...post, custody_status: 'in_security_office' }
                : post
            )
          )
        }

        onShowToast?.(
          'Item marked as received in the Security Office',
          'success'
        )
      } catch (error) {
        onShowToast?.(
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : 'Failed to mark item as received in the Security Office',
          'danger'
        )
      } finally {
        setIsProcessing(false)

        if (receiveTimeoutRef.current) {
          clearTimeout(receiveTimeoutRef.current)
          receiveTimeoutRef.current = null
        }
      }
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (rejectTimeoutRef.current) {
        clearTimeout(rejectTimeoutRef.current)
        rejectTimeoutRef.current = null
      }
      if (acceptTimeoutRef.current) {
        clearTimeout(acceptTimeoutRef.current)
        acceptTimeoutRef.current = null
      }
      if (matchTimeoutRef.current) {
        clearTimeout(matchTimeoutRef.current)
        matchTimeoutRef.current = null
      }
      if (receiveTimeoutRef.current) {
        clearTimeout(receiveTimeoutRef.current)
        receiveTimeoutRef.current = null
      }
    }
  }, [])

  return (
    <>
      <IonCard
        className={`shadow-md border border-gray-200 font-default-font overflow-hidden px-2 ${className}`}
        onClick={postId ? () => onClick?.(postId) : undefined}
      >
        {/* Header with avatar + username + kebab menu */}
        <IonItem lines='none' className='py-2 -mx-2'>
          <IonAvatar slot='start'>
            {user_profile_picture_url &&
            (!is_anonymous || showAnonIndicator) ? (
              <img
                src={user_profile_picture_url}
                alt={username}
                className='w-full h-full object-cover'
              />
            ) : (
              <IonIcon
                icon={personCircle}
                className='w-full h-full text-gray-400'
              />
            )}
          </IonAvatar>
          <IonLabel>
            <div className='font-semibold text-umak-blue pl-3 flex items-center gap-2'>
              <p>
                {is_anonymous && !showAnonIndicator ? 'Anonymous' : username}
              </p>
              {showAnonIndicator && (
                <span className='text-xs font-normal bg-gray-200 text-gray-700 px-2 py-0.5 rounded'>
                  Anonymous
                </span>
              )}
            </div>
          </IonLabel>
          <IonButtons slot='end'>
            <IonButton
              fill='clear'
              color='medium'
              aria-label='More options'
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                onKebabButtonClick?.()
              }}
            >
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonItem>
        <div className='h-px bg-black mx-3'></div>

        <IonCardContent className='-mt-2'>
          <div className='text-xl font-bold text-gray-900 flex justify-between items-center'>
            <span>{itemName}</span>{' '}
            <span className={`text-sm ${statusColorClass} font-semibold`}>
              {itemStatus
                ? itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1)
                : null}
            </span>
          </div>
          <p className='text-gray-700 pb-2 leading-snug line-clamp-2'>
            {description}
          </p>
          <React.Suspense
            fallback={
              <div className='h-56 bg-gray-50 border border-gray-200 rounded-xl animate-pulse' />
            }
          >
            <LazyImage
              src={imageUrl}
              alt={itemName}
              className='h-56 rounded-xl'
            />
          </React.Suspense>

          <div className='flex items-center gap-2 mt-3 text-xs text-gray-500'>
            <IonText>
              <strong>Category:</strong>
            </IonText>
            <IonText>{category}</IonText>
          </div>

          {submittedOn && (
            <div className='flex items-center gap-2 mt-3 text-xs text-gray-500'>
              <IonText>
                <strong>Submission Date:</strong>
              </IonText>
              <IonText>{formatTimestamp(submittedOn)}</IonText>
            </div>
          )}

          {normalizedStatus === 'claimed' && claimedAt && (
            <div className='flex items-center gap-2 mt-3 text-xs text-gray-500'>
              <IonText>
                <strong>Claim Date:</strong>
              </IonText>
              <IonText>{formatTimestamp(claimedAt)}</IonText>
            </div>
          )}

          {showSecurityQuestionDetails && (
            <>
              <div className='flex items-center gap-2 mt-3 text-xs text-gray-500'>
                <IonText>
                  <strong>Last seen:</strong>
                </IonText>
                <IonText>{formatTimestamp(lastSeen)}</IonText>
              </div>

              <div className='flex items-start gap-2 mt-3 text-xs text-gray-500'>
                <IonText>
                  <strong>Location:</strong>
                </IonText>
                <IonText>{locationLastSeenAt}</IonText>
              </div>
            </>
          )}
          {/* Staff Action Buttons */}
          {variant === 'staff' && (
            <div className='flex justify-between h-7 w-full gap-4 mt-4 font-default-font'>
              <button
                onClick={handleRejectClick}
                disabled={isProcessing}
                className='h-full flex-1 bg-[var(--color-umak-red)] text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
              >
                {isProcessing ? (
                  <IonSpinner name='crescent' className='w-5 h-5' />
                ) : (
                  'REJECT'
                )}
              </button>
              <button
                onClick={handleAcceptClick}
                disabled={isProcessing}
                className='flex-1 bg-green-500 text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
              >
                {isProcessing ? (
                  <IonSpinner name='crescent' className='w-5 h-5' />
                ) : (
                  'ACCEPT'
                )}
              </button>
            </div>
          )}

          {/* Staff-Pending Variant - Different buttons based on item_type */}
          {variant === 'staff-pending' && (
            <div className='flex justify-between h-7 w-full gap-4 mt-4 font-default-font'>
              {item_type === 'found' ? (
                canApproveFoundPending ? (
                  <>
                    <button
                      onClick={handleRejectClick}
                      disabled={isProcessing}
                      className='h-full flex-1 bg-[var(--color-umak-red)] text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                    >
                      {isProcessing ? (
                        <IonSpinner name='crescent' className='w-5 h-5' />
                      ) : (
                        'REJECT'
                      )}
                    </button>
                    <button
                      onClick={handleAcceptClick}
                      disabled={isProcessing}
                      className='flex-1 bg-green-500 text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                    >
                      {isProcessing ? (
                        <IonSpinner name='crescent' className='w-5 h-5' />
                      ) : (
                        'ACCEPT'
                      )}
                    </button>
                  </>
                ) : canMarkReceivedFoundPending ? (
                  <button
                    onClick={handleReceiveClick}
                    disabled={isProcessing}
                    className='h-full flex-1 bg-sky-600 text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                  >
                    {isProcessing ? (
                      <IonSpinner name='crescent' className='w-5 h-5' />
                    ) : (
                      'MARK RECEIVED'
                    )}
                  </button>
                ) : null
              ) : (
                // Missing items: Reject and Match
                <>
                  <button
                    onClick={handleRejectClick}
                    disabled={isProcessing}
                    className='flex-1 bg-[var(--color-umak-red)] text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                  >
                    {isProcessing ? (
                      <IonSpinner name='crescent' className='w-5 h-5' />
                    ) : (
                      'REJECT'
                    )}
                  </button>
                  <button
                    onClick={handleMatchClick}
                    disabled={isProcessing}
                    className='h-full flex-1 bg-blue-500 text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                  >
                    {isProcessing ? (
                      <IonSpinner name='crescent' className='w-5 h-5' />
                    ) : (
                      'MATCH'
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Reject Modal */}
      <ChoiceModal
        isOpen={showRejectModal}
        header='Reject Post'
        subheading1='Select a reason to reject the post.'
        subheading2='Uploader will be notified upon submission.'
        choices={Array.from(rejectReasons)}
        onSubmit={handleRejectChoice}
        onDidDismiss={() => setShowRejectModal(false)}
      />
    </>
  )
}

// Action sheet rendered inside the component's JSX via state

export default memo(CatalogPost)
