import { documentTextOutline, createOutline } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import PostList from '@/shared/components/PostList'
import FilterSortBar from '@/shared/components/FilterSortBar'
import type {
  FilterCategory,
  SortOption
} from '@/shared/components/FilterSortBar'
import { useEffect, useRef, useState } from 'react'
import { useUser } from '@/features/auth/contexts/UserContext'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useFilterAndSortPosts } from '@/shared/hooks/useFilterAndSortPosts'
import { type PostStatus, type SortDirection } from '@/shared/utils/postFilters'
import { useOwnPostsFetching } from '@/features/user/hooks/useOwnPostsFetching'

export default function History () {
  const PAGE_SIZE = 5
  const [activeFilters, setActiveFilters] = useState<Set<PostStatus>>(new Set())
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [postCount, setPostCount] = useState<number | null>(null)
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const { getUser } = useUser()
  const { navigate } = useNavigation()

  // Get user ID
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const initUser = async () => {
      const user = await getUser()
      setUserId(user?.user_id ?? null)
    }
    initUser()
  }, [getUser])

  // Use custom hook for fetching own posts - aligned with Home.tsx pattern
  const {
    posts: allPosts,
    setPosts,
    hasMore,
    fetchPosts,
    loadMorePosts,
    fetchNewPosts,
    refreshPosts,
    loadedIdsRef
  } = useOwnPostsFetching({
    userId,
    pageSize: PAGE_SIZE,
    sortDirection: sortDir
  })

  const posts = useFilterAndSortPosts({
    posts: allPosts,
    activeFilters,
    sortDirection: sortDir,
    filterMode: 'intersection'
  })

  // Filter categories for FilterSortBar
  const filterCategories: FilterCategory<PostStatus>[] = [
    {
      categoryName: 'Post Status',
      options: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Accepted', label: 'Accepted' },
        { value: 'Rejected', label: 'Rejected' }
      ]
    },
    {
      categoryName: 'Item Status',
      options: [
        { value: 'Claimed', label: 'Claimed' },
        { value: 'Unclaimed', label: 'Unclaimed' },
        { value: 'Returned', label: 'Returned' },
        { value: 'Lost', label: 'Lost' }
      ]
    },
    {
      categoryName: 'Item Type',
      options: [
        { value: 'Missing', label: 'Missing' },
        { value: 'Found', label: 'Found' }
      ]
    }
  ]

  const sortOptions: SortOption[] = [
    {
      value: 'desc',
      label: 'Latest Upload (Desc)',
      icon: documentTextOutline
    },
    {
      value: 'asc',
      label: 'Oldest Upload (Asc)',
      icon: documentTextOutline
    }
  ]

  useEffect(() => {
    const handler = async (_ev?: Event) => {
      // Smooth scroll to top
      await contentRef.current?.scrollToTop?.(400)
    }

    window.addEventListener('app:scrollToTop', handler as EventListener)
    return () =>
      window.removeEventListener('app:scrollToTop', handler as EventListener)
  }, [])

  const handleFilterChange = (newFilters: Set<PostStatus>) => {
    console.log('History - New Filters:', newFilters)
    setActiveFilters(newFilters)
    setPostCount(posts.length)
  }

  return (
    <>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <FilterSortBar
        title='Post History'
        icon={createOutline}
        filterCategories={filterCategories}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        filterSelectionType='single-per-category'
        filterModalTitle='Filter Posts'
        filterModalSubtitle='Select post statuses to be displayed.'
        hasFilterClear={true}
        hasFilterEnter={true}
        sortOptions={sortOptions}
        activeSort={sortDir}
        onSortChange={value => setSortDir(value as SortDirection)}
        sortModalTitle='Sort display order by'
        sortButtonLabel={sortDir === 'desc' ? 'Recent Upload' : 'Oldest Upload'}
      />
      {postCount === 0 && (
        <div className='flex justify-center mt-15 h-full text-gray-400'>
          <p>No posts match the selected filters.</p>
        </div>
      )}
      <div className='h-full'>
        <PostList
          posts={posts}
          fetchPosts={fetchPosts}
          hasMore={hasMore}
          setPosts={setPosts}
          loadMorePosts={async (event: CustomEvent<void>) => {
            await loadMorePosts()
            const target = event.target as HTMLIonInfiniteScrollElement | null
            if (target) target.complete()
          }}
          loadedIdsRef={loadedIdsRef}
          sortDirection={sortDir}
          cacheKeys={{
            loadedKey: 'LoadedPosts:history',
            cacheKey: 'CachedPublicPosts:history'
          }}
          pageSize={PAGE_SIZE}
          onClick={(postId: string) => {
            navigate(`/user/post/history/view/${postId}`)
          }}
          viewDetailsPath='/user/post/history/view/:postId'
          handleRefresh={async (event: CustomEvent) => {
            await refreshPosts()
            event.detail.complete()
          }}
          fetchNewPosts={fetchNewPosts}
          ref={contentRef}
          withDelete={true}
        />
      </div>
    </>
  )
}
