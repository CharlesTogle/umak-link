import { useState } from 'react'
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/react'
import {
  checkmarkOutline,
  closeOutline,
  gitCompareOutline,
  trashOutline
} from 'ionicons/icons'
import type { PublicPost } from '@/features/posts/types/post'

interface StaffPostCardProps {
  post: PublicPost
  onAccept?: (postId: string) => Promise<boolean>
  onReject?: (postId: string) => Promise<boolean>
  onMatch?: (postId: string) => Promise<void>
  onDelete?: (postId: string) => Promise<boolean>
  onClick?: (postId: string) => void
}

export default function StaffPostCard ({
  post,
  onAccept,
  onReject,
  onMatch,
  onDelete,
  onClick
}: StaffPostCardProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (
    action: 'accept' | 'reject' | 'match' | 'delete',
    handler?: ((postId: string) => Promise<boolean | void>) | undefined
  ) => {
    if (!handler) return

    setLoading(action)
    try {
      await handler(post.post_id)
    } catch (error) {
      console.error(`Error during ${action}:`, error)
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isFoundItem = post.item_type === 'found'
  const isMissingItem = post.item_type === 'lost'

  return (
    <IonCard
      className='mb-3 cursor-pointer'
      onClick={() => onClick?.(post.post_id)}
    >
      <IonCardContent>
        <div className='flex items-start gap-3'>
          {/* Image */}
          {post.item_image_url && (
            <div className='w-24 h-24 rounded-lg overflow-hidden flex-shrink-0'>
              <img
                src={post.item_image_url}
                alt={post.item_name}
                className='w-full h-full object-cover'
              />
            </div>
          )}

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <h3 className='font-semibold text-base text-gray-900 truncate'>
              {post.item_name}
            </h3>
            <p className='text-sm text-gray-600'>
              {post.username} {post.is_anonymous && '(Anonymous)'}
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              Category: {post.category || 'N/A'}
            </p>
            <p className='text-xs text-gray-500'>
              Last seen: {post.last_seen_location || 'N/A'}
            </p>
            <p className='text-xs text-gray-500'>
              Date: {formatDate(post.last_seen_at || post.submission_date)}
            </p>
            {post.item_description && (
              <p className='text-sm text-gray-700 mt-2 line-clamp-2'>
                {post.item_description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 mt-4'>
          {isFoundItem && (
            <>
              {/* Accept Button */}
              <IonButton
                expand='block'
                color='success'
                onClick={e => {
                  e.stopPropagation()
                  handleAction('accept', onAccept)
                }}
                disabled={loading !== null}
                className='flex-1'
              >
                {loading === 'accept' ? (
                  <IonSpinner name='crescent' />
                ) : (
                  <>
                    <IonIcon icon={checkmarkOutline} slot='start' />
                    Accept
                  </>
                )}
              </IonButton>

              {/* Reject Button */}
              <IonButton
                expand='block'
                color='danger'
                onClick={e => {
                  e.stopPropagation()
                  handleAction('reject', onReject)
                }}
                disabled={loading !== null}
                className='flex-1'
              >
                {loading === 'reject' ? (
                  <IonSpinner name='crescent' />
                ) : (
                  <>
                    <IonIcon icon={closeOutline} slot='start' />
                    Reject
                  </>
                )}
              </IonButton>
            </>
          )}

          {isMissingItem && (
            <>
              {/* Match Button */}
              <IonButton
                expand='block'
                color='primary'
                onClick={e => {
                  e.stopPropagation()
                  handleAction('match', onMatch)
                }}
                disabled={loading !== null}
                className='flex-1'
              >
                {loading === 'match' ? (
                  <IonSpinner name='crescent' />
                ) : (
                  <>
                    <IonIcon icon={gitCompareOutline} slot='start' />
                    Match
                  </>
                )}
              </IonButton>

              {/* Delete Button */}
              <IonButton
                expand='block'
                color='danger'
                onClick={e => {
                  e.stopPropagation()
                  handleAction('delete', onDelete)
                }}
                disabled={loading !== null}
                className='flex-1'
              >
                {loading === 'delete' ? (
                  <IonSpinner name='crescent' />
                ) : (
                  <>
                    <IonIcon icon={trashOutline} slot='start' />
                    Delete
                  </>
                )}
              </IonButton>
            </>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  )
}
