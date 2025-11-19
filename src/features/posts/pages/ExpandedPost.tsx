import { useParams } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import type { PublicPost } from '@/features/posts/types/post'
import { getPost } from '../data/posts'
import Post from '@/features/posts/components/Post'
import PostSkeleton from '../components/PostSkeleton'
import Header from '@/shared/components/Header'
import { IonContent, IonActionSheet } from '@ionic/react'
import { Share } from '@capacitor/share'
import { useNavigation } from '@/shared/hooks/useNavigation'

export default function ExpandedPost () {
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()

  const [post, setPost] = useState<PublicPost | null>()
  const [loading, setLoading] = useState<boolean>(true)
  const [actionSheetOpen, setActionSheetOpen] = useState<boolean>(false)

  useEffect(() => {
    const getCurrentPost = async () => {
      if (!postId) return
      setLoading(true)
      setPost(undefined)
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

  if (!loading && post === null) {
    return <div>No post found.</div>
  }

  return (
    <IonContent>
      <Header isProfileAndNotificationShown={true} logoShown={true} />

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
        />
      )}

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
    </IonContent>
  )
}
