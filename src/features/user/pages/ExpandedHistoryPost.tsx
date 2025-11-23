import Post from '@/features/posts/components/Post'
import { useParams } from 'react-router-dom'
import { getPostFull } from '@/features/posts/data/posts'
import type { PostRecordDetails } from '@/features/posts/data/posts'
import { useEffect, useState } from 'react'
import PostSkeleton from '@/features/posts/components/PostSkeleton'
import Header from '@/shared/components/Header'
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/react'

import { useNavigation } from '@/shared/hooks/useNavigation'
import { usePostActions } from '../hooks/usePostActions'
import { IonLoading, IonToast } from '@ionic/react'
import { isConnected } from '@/shared/utils/networkCheck'
import { arrowBack } from 'ionicons/icons'

export default function ExpandedHistoryPost () {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<PostRecordDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showActions, setShowActions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const { navigate } = useNavigation()
  const { deletePost } = usePostActions()

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return

      const connected = await isConnected()
      if (!connected) {
        setToastMessage('Failed to load Post - No Internet Connection')
        setShowToast(true)
        setLoading(false)
        return
      }

      const fetchedPost = await getPostFull(postId as string)
      setPost(fetchedPost)
      setLoading(false)
    }
    fetchPost()
  }, [postId])

  const getRejectionReason = () => {
    if (!post || post.post_status !== 'rejected') return null
    return post.rejection_reason
  }

  const handleDelete = async () => {
    if (!postId || !post?.item_name) return
    setIsDeleting(true)
    const result = await deletePost(postId, post.item_name)
    setIsDeleting(false)
    if (result.success) {
      navigate('/user/post/history')
    }
  }

  const getMessage = () => {
    if (!post) return ''
    switch (post.post_status) {
      case 'pending':
        return "Waiting for approval. You'll be notified once reviewed."
      case 'accepted':
        return 'Your post has been accepted.'
      case 'rejected':
        return 'Your post has been rejected.'
      case 'reported':
        return "Under review. As the poster, you're not involved with the report."
      case 'fraud':
        return "Temporarily removed. As the poster, you're not involved. Will be restored after further review."
    }
  }

  const getStatusColor = () => {
    if (!post) return 'gray'
    switch (post.post_status) {
      case 'pending':
        return 'text-amber-500'
      case 'accepted':
        return 'text-green-500'
      case 'rejected':
        return 'text-umak-red'
      case 'reported':
        return 'text-umak-red'
      case 'fraud':
        return 'text-umak-red'
    }
  }

  if (!loading && !post) {
    return (
      <IonContent>
        <div className='fixed top-0 w-full'>
          <Header isProfileAndNotificationShown={true} logoShown={true} />
        </div>
        <div className='flex flex-col items-center justify-center h-full px-6'>
          <div className='text-center mb-6'>
            <p className='text-xl font-semibold text-gray-800'>No post found</p>
          </div>
          <IonButton
            onClick={() => navigate('/user/post/history', 'back')}
            fill='solid'
            style={{
              '--background': 'var(--color-umak-blue)',
              '--color': 'white'
            }}
          >
            <IonIcon slot='start' icon={arrowBack} />
            Go Back
          </IonButton>
        </div>
      </IonContent>
    )
  }

  return (
    <IonContent>
      <div className='fixed top-0 w-full'>
        <Header isProfileAndNotificationShown={true} logoShown={true} />
      </div>
      <div className='pt-15'>
        <IonCard className='my-4'>
          <IonCardContent>
            <div className='flex flex-col place-items-center text-center'>
              <div
                className={`text-xl font-bold capitalize ${getStatusColor()}`}
              >
                {post?.post_status}
              </div>
              <div className='text-base font-medium'>{getMessage()}</div>
              {getRejectionReason() && (
                <div className='text-sm text-slate-900'>
                  <span className='font-semibold'>Reason: </span>
                  {getRejectionReason()}
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>
        {loading ? (
          <PostSkeleton />
        ) : (
          <Post
            category={post?.category ?? ''}
            description={post?.item_description ?? ''}
            imageUrl={post?.item_image_url ?? ''}
            itemName={post?.is_anonymous ? 'Anonymous' : post?.item_name ?? ''}
            itemStatus={post?.item_status ?? ''}
            lastSeen={post?.last_seen_at ?? ''}
            locationLastSeenAt={post?.last_seen_location ?? ''}
            user_profile_picture_url={post?.poster_profile_picture_url ?? ''}
            username={post?.poster_name ?? ''}
            className={'min-h-[400px]!'}
            onKebabButtonClick={() => setShowActions(true)}
            actionSheetOpen={showActions}
            onActionSheetDismiss={() => setShowActions(false)}
            actionSheetButtons={(() => {
              const buttons = []
              // Edit: only for post_status 'pending'
              if (post && post.post_status === 'pending') {
                buttons.push({
                  text: 'Edit',
                  handler: () => {
                    if (postId) navigate(`/user/post/edit/${postId}`)
                  },
                  cssClass: 'edit-btn'
                })
              }
              // Delete: only for item_status 'unclaimed' or 'lost'
              if (
                post &&
                (post.item_status === 'unclaimed' ||
                  post.item_status === 'lost') &&
                post.post_status !== 'accepted'
              ) {
                buttons.push({
                  text: 'Delete',
                  role: 'destructive',
                  handler: handleDelete,
                  cssClass: 'delete-btn'
                })
              }
              buttons.push({
                text: 'Cancel',
                role: 'cancel'
              })
              return buttons
            })()}
          />
        )}
      </div>

      {/* Action Sheet now handled by Post component */}
      <IonLoading isOpen={isDeleting} message='Deleting post...' />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color='danger'
      />
    </IonContent>
  )
}
