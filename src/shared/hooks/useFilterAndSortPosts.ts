import { useMemo } from 'react'
import {
  filterPosts,
  sortPosts,
  type PostStatus,
  type SortDirection,
  type FilterMode
} from '@/shared/utils/postFilters'
import type { PublicPost } from '@/features/posts/types/post'

interface UseFilterAndSortPostsProps {
  posts: PublicPost[]
  activeFilters: Set<PostStatus>
  sortDirection: SortDirection
  filterMode?: FilterMode
}

/**
 * Custom hook to filter and sort posts
 * Returns memoized filtered and sorted posts array
 */
export function useFilterAndSortPosts ({
  posts,
  activeFilters,
  sortDirection,
  filterMode = 'intersection'
}: UseFilterAndSortPostsProps) {
  const filteredAndSorted = useMemo(() => {
    const filtered = filterPosts(posts, activeFilters, filterMode)
    return sortPosts(filtered, sortDirection)
  }, [posts, activeFilters, sortDirection, filterMode])

  return filteredAndSorted
}
