import { useParams } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import type { PublicPost } from '@/features/posts/types/post'
import { getPost } from '../data/posts'
import Post from '@/features/posts/components/Post'
import PostSkeleton from '../components/PostSkeleton'
import { HeaderWithBackButton } from '@/shared/components/HeaderVariants'
import {
  IonContent,
  IonActionSheet,
  IonToast,
  IonButton,
  IonIcon
} from '@ionic/react'
import { Share } from '@capacitor/share'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { isConnected } from '@/shared/utils/networkCheck'
import { arrowBack } from 'ionicons/icons'

export default function ExpandedPost () {
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()

  const [post, setPost] = useState<PublicPost | null>()
  const [loading, setLoading] = useState<boolean>(true)
  const [actionSheetOpen, setActionSheetOpen] = useState<boolean>(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const getCurrentPost = async () => {
      if (!postId) return
      setLoading(true)
      setPost(undefined)

      const connected = await isConnected()
      if (!connected) {
        setOffline(true)
        setToastMessage('Failed to load Post - No Internet Connection')
        setShowToast(true)
        setLoading(false)
        setPost(null)
        return
      }

      const fetchedPost = await getPost(postId as string)
      setPost(fetchedPost)
      setLoading(false)
    }
    getCurrentPost()
  }, [postId])

  const handleOpenActions = useCallback(() => {
    setActionSheetOpen(true)
  }, [])

  const handleShare = useCallback(async () => {
    if (!postId) return
    try {
      await Share.share({
        title: post?.item_name || 'Check this post',
        text: post?.item_description || '',
        url: `${window.location.origin}/user/post/view/${postId}`,
        dialogTitle: 'Share post'
      })
    } catch (e) {
      // No-op if user cancels or Share isn't available
      console.debug('Share cancelled/unavailable', e)
    }
  }, [postId, post?.item_name, post?.item_description])

  const handleReport = useCallback(() => {
    if (!postId) return
    navigate(`/user/post/report/${postId}`)
  }, [navigate, postId])

  if (!loading && offline && post === null) {
    return (
      <IonContent>
        <HeaderWithBackButton onBack={() => window.history.back()} />
        <div className='flex flex-col items-center justify-center h-full px-6 pt-20'>
          <div className='text-center mb-6'>
            <p className='text-xl font-semibold text-gray-800 mb-2'>
              Failed to load Post
            </p>
            <p className='text-base text-gray-600'>No Internet Connection</p>
          </div>
          <IonButton
            onClick={() => window.history.back()}
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

  if (!loading && post === null) {
    return (
      <IonContent>
        <HeaderWithBackButton onBack={() => window.history.back()} />
        <div className='flex flex-col items-center justify-center h-full px-6 pt-20'>
          <div className='text-center mb-6'>
            <p className='text-xl font-semibold text-gray-800'>No post found</p>
          </div>
          <IonButton
            onClick={() => window.history.back()}
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
      <div className='fixed top-0 w-full z-10'>
        <HeaderWithBackButton onBack={() => window.history.back()} />
      </div>

      <div className='mt-16'>
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
            user_profile_picture_url={
              post?.is_anonymous ? null : post?.profilepicture_url ?? ''
            }
            username={post?.is_anonymous ? 'Anonymous' : post?.username ?? ''}
            onKebabButtonClick={handleOpenActions}
            claimedByName={post?.claimed_by_name ?? null}
            claimedAt={post?.claimed_at ?? null}
          />
        )}
      </div>

      <IonActionSheet
        isOpen={actionSheetOpen}
        onDidDismiss={() => setActionSheetOpen(false)}
        header='Post actions'
        buttons={[
          {
            text: 'Report',
            role: 'destructive',
            handler: handleReport,
            cssClass: 'report-btn'
          },
          {
            text: 'Share',
            handler: handleShare
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />

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
