import { useRef, useState, useEffect } from 'react'
import { IonToast } from '@ionic/react'
import Header from '@/shared/components/Header'
import PostList from '@/shared/components/PostList'
import { useNotificationContext } from '@/shared/contexts/NotificationContext'
import {
  listMatchedPosts,
  refreshMatchedPosts
} from '@/features/user/data/matchedPosts'
import type { PublicPost } from '@/features/posts/types/post'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { usePostFetching } from '@/shared/hooks/usePostFetching'
import {
  getPostFull,
  type PostRecordDetails
} from '@/features/posts/data/posts'
import PostCard from '@/features/posts/components/PostCard'
import { IonCard, IonCardContent } from '@ionic/react'
export default function Matches () {
  const { matchedPostIds, lostItemPostId } = useNotificationContext()
  const { navigate } = useNavigation()
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [lostItemPost, setLostItemPost] = useState<PostRecordDetails | null>(
    null
  )

  // Fetch lost item post details
  useEffect(() => {
    const fetchLostItemPost = async () => {
      if (!lostItemPostId) {
        setLostItemPost(null)
        return
      }

      try {
        const post = await getPostFull(lostItemPostId)
        console.log(post)
        setLostItemPost(post)
      } catch (error) {
        console.error('Error fetching lost item post:', error)
      }
    }

    fetchLostItemPost()
  }, [lostItemPostId])

  // Custom comparator to sort by accepted_on_date
  const postComparator = (a: PublicPost, b: PublicPost): number => {
    const aAccepted = a.accepted_on_date
    const bAccepted = b.accepted_on_date

    if (aAccepted && bAccepted) {
      return bAccepted.localeCompare(aAccepted)
    }
    return aAccepted ? -1 : 1
  }

  const {
    posts,
    setPosts,
    hasMore,
    fetchPosts,
    loadMorePosts,
    fetchNewPosts,
    refreshPosts,
    loadedIdsRef
  } = usePostFetching({
    fetchFunction: (excludeIds, limit) =>
      listMatchedPosts(matchedPostIds, excludeIds, limit),
    refreshPostFunction: includeIds => refreshMatchedPosts(includeIds),
    cacheKeys: {
      loadedKey: 'LoadedMatchedPosts',
      cacheKey: 'CachedMatchedPosts'
    },
    filterPosts: posts =>
      posts.filter(
        p =>
          p.post_status &&
          ['accepted'].includes(p.post_status) &&
          p.item_type === 'found'
      ),
    postComparator,
    pageSize: 5,
    onOffline: () => {
      setToastMessage(
        'Getting updated posts failed — not connected to the internet'
      )
      setShowToast(true)
    }
  })

  const handleLoadMore = async (event: CustomEvent<void>) => {
    const target = event.target as HTMLIonInfiniteScrollElement | null
    if (!target) return
    await loadMorePosts()
    target.complete()
  }

  const handleRefresh = async (event: CustomEvent) => {
    try {
      await fetchNewPosts()
      await refreshPosts()
    } finally {
      event.detail.complete()
    }
  }

  const handlePostClick = (postId: string) => {
    navigate(`/user/post/view/${postId}`)
  }

  console.log(posts)
  return (
    <>
      <Header
        logoShown={true}
        isProfileAndNotificationShown={true}
        isNotificationPage={false}
      />
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color='danger'
      />

      <PostList
        posts={posts}
        fetchPosts={fetchPosts}
        hasMore={hasMore}
        setPosts={setPosts}
        loadedIdsRef={loadedIdsRef}
        loadMorePosts={handleLoadMore}
        handleRefresh={handleRefresh}
        ref={contentRef}
        fetchNewPosts={fetchNewPosts}
        sortDirection={'desc'}
        cacheKeys={{
          loadedKey: 'LoadedMatchedPosts',
          cacheKey: 'CachedMatchedPosts'
        }}
        onClick={handlePostClick}
        pageSize={5}
        variant='search'
        marginBottom='0'
      >
        <IonCard className='my-4'>
          <IonCardContent>
            <div className='flex flex-col place-items-center text-center'>
              <div className={`text-xl font-bold capitalize text-green-600`}>
                Matches
              </div>
              <div className='text-base font-medium text-gray-600'>
                Here are the items that might be similar matches to your missing
                item report.
              </div>
            </div>
          </IonCardContent>
        </IonCard>
        {lostItemPost && (
          <div className='ion-padding -mt-5 mb-5'>
            <PostCard
              imgUrl={lostItemPost.item_image_url || ''}
              title={lostItemPost.item_name}
              description={lostItemPost.item_description || ''}
              owner={lostItemPost.poster_name}
              owner_profile_picture_url={
                lostItemPost.poster_profile_picture_url
              }
            />
          </div>
        )}
      </PostList>
    </>
  )
}
