import React, { lazy, memo, useState } from 'react'
const LazyImage = lazy(() => import('@/shared/components/LazyImage'))
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
  IonToast,
  IonSpinner
} from '@ionic/react'
import { ellipsisVertical, personCircle } from 'ionicons/icons'
import { usePostActions } from '@/features/user/hooks/usePostActions'
import { formatTimestamp } from '@/shared/utils/formatTimeStamp'
import { ChoiceModal } from './ChoiceModal'

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
  variant?: 'user' | 'staff' | 'search' | 'postRecords'
  is_anonymous?: boolean
  showAnonIndicator?: boolean
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
  showAnonIndicator = false
}) => {
  const normalizedStatus = (itemStatus || '').toLowerCase()
  const statusColorClass =
    normalizedStatus === 'unclaimed'
      ? 'text-red-600'
      : normalizedStatus === 'claimed'
      ? 'text-green-600'
      : ''

  const { acceptPost, rejectPost } = usePostActions()
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    color: string
  }>({
    show: false,
    message: '',
    color: 'success'
  })
  const [showChoiceModal, setShowChoiceModal] = useState(false)

  const rejectChoices = [
    'Item is not identified in storage.',
    "Details don't match the item in question.",
    'This is a spam or malicious post.',
    'There is more than 1 instance of this post.'
  ]

  // Staff action handlers
  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!postId || isProcessing) return
    // Open choice modal to select rejection reason
    setShowChoiceModal(true)
  }

  const handleRejectSubmit = async (choice: string) => {
    if (!postId || isProcessing) return
    setShowChoiceModal(false)
    setIsProcessing(true)
    const result = await rejectPost(postId, itemName, choice)
    setIsProcessing(false)
    if (result.success) {
      setToast({
        show: true,
        message: 'Post rejected successfully',
        color: 'success'
      })
      // Dispatch custom event for post status change and include reason
      window.dispatchEvent(
        new CustomEvent('post:statusChanged', {
          detail: { postId, newStatus: 'rejected', reason: choice }
        })
      )
    } else {
      setToast({
        show: true,
        message: result.error || 'Failed to reject post',
        color: 'danger'
      })
    }
  }

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!postId || isProcessing) return

    setIsProcessing(true)
    const result = await acceptPost(postId, itemName)
    setIsProcessing(false)
    if (result.success) {
      setToast({
        show: true,
        message: 'Post accepted successfully',
        color: 'success'
      })
      // Dispatch custom event for post status change
      window.dispatchEvent(
        new CustomEvent('post:statusChanged', {
          detail: { postId, newStatus: 'accepted' }
        })
      )
    } else {
      setToast({
        show: true,
        message: result.error || 'Failed to accept post',
        color: 'danger'
      })
    }
  }

  return (
    <>
      <IonCard
        className={`shadow-md border border-gray-200 font-default-font overflow-hidden px-2 ${className}`}
        onClick={postId ? () => onClick?.(postId) : undefined}
      >
        {/* Header with avatar + username + kebab menu */}
        <IonItem lines='none' className='py-2 -mx-2'>
          <IonAvatar slot='start'>
            {!is_anonymous && user_profile_picture_url ? (
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
              <p>{is_anonymous ? 'Anonymous' : username}</p>
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
            <span className={`text-sm ${statusColorClass}`}>
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

          {/* Staff Action Buttons */}
          {variant === 'staff' && (
            <div className='flex justify-between h-7 w-full gap-4 mt-4 font-default-font'>
              <button
                onClick={handleReject}
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
                onClick={handleAccept}
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
        </IonCardContent>
      </IonCard>
      <IonToast
        isOpen={toast.show}
        onDidDismiss={() => setToast({ ...toast, show: false })}
        message={toast.message}
        duration={2000}
        color={toast.color}
      />
      <ChoiceModal
        isOpen={showChoiceModal}
        header='Reject Post'
        subheading1='Select a reason to reject the post.'
        subheading2='Uploader will be notified upon submission.'
        choices={rejectChoices}
        onSubmit={handleRejectSubmit}
        onDidDismiss={() => setShowChoiceModal(false)}
      />
    </>
  )
}

// Action sheet rendered inside the component's JSX via state

export default memo(CatalogPost)
