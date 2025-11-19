import { add } from 'ionicons/icons'
import { useState, useEffect, useRef } from 'react'
import {
  IonIcon,
  IonFab,
  IonFabButton,
  IonToast,
  IonSpinner,
  IonPopover
} from '@ionic/react'
import { Keyboard } from '@capacitor/keyboard'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { listPublicPosts } from '@/features/posts/data/posts'
import { refreshPublicPosts } from '@/features/posts/data/postsRefresh'
import PostList from '@/shared/components/PostList'
import { usePostFetching } from '@/shared/hooks/usePostFetching'
import type { PublicPost } from '@/features/posts/types/post'
import { HeaderWithSearchBar } from '@/shared/components/HeaderVariants'

// CatalogHeader Component

// Main User Home Component
export default function Home () {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const { navigate } = useNavigation()

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
    fetchFunction: listPublicPosts,
    refreshPostFunction: refreshPublicPosts,
    cacheKeys: {
      loadedKey: 'LoadedPosts',
      cacheKey: 'CachedPublicPosts'
    },
    filterPosts: posts =>
      posts.filter(
        p =>
          p.post_status &&
          ['accepted', 'reported'].includes(p.post_status) &&
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

  useEffect(() => {
    const handler = (_ev?: Event) => {
      // Scroll to top immediately (don't wait for fetch)
      contentRef.current?.scrollToTop?.(300)

      // Fetch newest posts in background with loading modal
      setShowLoadingModal(true)
      fetchNewPosts()
        .then(() => {
          setShowLoadingModal(false)
        })
        .catch(() => {
          setShowLoadingModal(false)
        })
    }

    window.addEventListener('app:scrollToTop', handler as EventListener)
    return () =>
      window.removeEventListener('app:scrollToTop', handler as EventListener)
  }, [fetchNewPosts])

  const handleLoadMore = async (event: CustomEvent<void>) => {
    const target = event.target as HTMLIonInfiniteScrollElement | null
    if (!target) return
    await loadMorePosts()
    target.complete()
  }

  // Pull-to-refresh: refresh currently loaded posts with fresh data from server
  const handleRefresh = async (event: CustomEvent) => {
    setShowLoadingModal(true)
    try {
      await fetchNewPosts()
      await refreshPosts()
    } finally {
      setShowLoadingModal(false)
      event.detail.complete()
    }
  }

  const handleSearchBarClick = () => {
    Keyboard.hide()
    navigate('/user/search')
  }

  const handleAddPost = () => {
    navigate('/user/new-post')
  }

  const handlePostClick = (postId: string) => {
    navigate(`/user/post/view/${postId}`)
  }

  return (
    <>
      <HeaderWithSearchBar handleClick={handleSearchBarClick} />
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color='danger'
      />
      {showLoadingModal && (
        <IonPopover className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white rounded-xl px-6 py-4 flex flex-col items-center justify-center gap-3 shadow-lg'>
          <IonSpinner name='crescent' className='scale-125' />
          <p className='text-gray-800 text-sm font-medium whitespace-nowrap m-0'>
            Loading fresh content...
          </p>
        </IonPopover>
      )}
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
          loadedKey: 'LoadedPosts',
          cacheKey: 'CachedPublicPosts'
        }}
        onClick={handlePostClick}
        pageSize={5}
        ionFabButton={
          <IonFab
            slot='fixed'
            vertical='bottom'
            horizontal='end'
            className='mb-17 mr-2'
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
        }
      ></PostList>
    </>
  )
}
