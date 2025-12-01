import { useEffect, useState, useCallback } from 'react'
import { Keyboard } from '@capacitor/keyboard'
import { usePostFetching } from '@/shared/hooks/usePostFetching'
import { useSearchContext } from '@/shared/contexts/SearchContext'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { refreshByIds } from '@/features/posts/data/postsRefresh'
import { listPostsByIds } from '@/features/posts/data/posts'
import { createPostCache } from '@/features/posts/data/postsCache'
import PostList from '@/shared/components/PostList'
import CatalogPostSkeleton from '@/shared/components/CatalogPostSkeleton'
import type { PublicPost } from '@/features/posts/types/post'
import { HeaderWithSearchBar } from '@/shared/components/HeaderVariants'

export default function SearchResults () {
  const { searchResultPostIds: postIds, setSearchResults } = useSearchContext()
  const { navigate } = useNavigation()
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setSearchValue(decodeURIComponent(q))
    }
  }, [])
  const listFn = async (
    excludeIds: string[] = [],
    limit = 5
  ): Promise<PublicPost[]> => {
    const remaining = postIds.filter(id => !excludeIds.includes(id))
    const idsToFetch = remaining.slice(0, limit)
    const posts = await listPostsByIds(() => postIds)(excludeIds, limit)

    const returnedIds = new Set(posts.map(p => p.post_id))
    const cleaned = postIds.filter(
      id => !idsToFetch.includes(id) || returnedIds.has(id)
    )

    if (cleaned.length !== postIds.length) {
      setSearchResults(cleaned)
    }

    return posts
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
    fetchFunction: listFn,
    refreshPostFunction: refreshByIds(),
    cacheKeys: {
      loadedKey: 'StaffSearchResultsLoaded',
      cacheKey: 'StaffSearchResultsCached'
    },
    pageSize: 5
  })

  const refreshSearchResults = useCallback(async () => {
    setLoading(true)
    const cache = createPostCache({
      loadedKey: 'StaffSearchResultsLoaded',
      cacheKey: 'StaffSearchResultsCached'
    })

    try {
      await cache.clearPostsCache()
      await fetchPosts()
    } catch (err) {
      console.error('Error fetching staff search results:', err)
    } finally {
      setLoading(false)
    }
  }, [postIds, fetchPosts])

  useEffect(() => {
    refreshSearchResults()
  }, [])

  const handleLoadMore = async (event: CustomEvent<void>) => {
    const target = event.target as HTMLIonInfiniteScrollElement | null
    if (!target) return
    await loadMorePosts()
    target.complete()
  }

  const handleSearchBarClick = () => {
    Keyboard.hide()
    navigate('/staff/search')
  }

  return (
    <>
      <HeaderWithSearchBar handleClick={handleSearchBarClick} />
      {loading ? (
        <div className='flex flex-col gap-4 px-4 py-2'>
          {[...Array(3)].map((_, index) => (
            <CatalogPostSkeleton key={index} />
          ))}
        </div>
      ) : (
        <PostList
          posts={posts}
          fetchPosts={fetchPosts}
          hasMore={hasMore}
          setPosts={setPosts}
          loadedIdsRef={loadedIdsRef}
          loadMorePosts={handleLoadMore}
          handleRefresh={refreshPosts}
          fetchNewPosts={fetchNewPosts}
          onClick={postId => navigate(`/staff/post-record/view/${postId}`)}
          pageSize={5}
          viewDetailsPath='/staff/post-record/view/:postId'
          marginBottom='0'
          children={
            <div className='px-4 py-2 text-sm text-gray-600'>
              {searchValue ? (
                <>
                  Search results for:{' '}
                  <span className='font-semibold'>"{searchValue}"</span>
                </>
              ) : (
                'Showing all search results'
              )}
            </div>
          }
        />
      )}
    </>
  )
}
