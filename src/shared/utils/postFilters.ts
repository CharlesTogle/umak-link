import type { PublicPost } from '@/features/posts/types/post'

// Centralized status mapping
export type PostStatus =
  | 'Missing'
  | 'Found'
  | 'Claimed'
  | 'Pending'
  | 'Fraud'
  | 'Unclaimed'
  | 'Accepted'
  | 'Rejected'
  | 'Lost'
  | 'Returned'

export const STATUS_MAP: Record<PostStatus, string> = {
  Missing: 'missing',
  Found: 'found',
  Claimed: 'claimed',
  Pending: 'pending',
  Fraud: 'fraud',
  Unclaimed: 'unclaimed',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Lost: 'lost',
  Returned: 'returned'
}

export type FilterMode = 'intersection' | 'union'
export type SortDirection = 'asc' | 'desc'

/**
 * Filter posts based on selected statuses
 * @param posts - Array of posts to filter
 * @param filters - Set of active filter statuses
 * @param mode - 'intersection' (AND) or 'union' (OR) logic
 */
export function filterPosts (
  posts: PublicPost[],
  filters: Set<PostStatus>,
  mode: FilterMode = 'intersection'
): PublicPost[] {
  if (filters.size === 0) return posts

  // Convert filters to expected values
  const expectedValues = Array.from(filters).map(f =>
    STATUS_MAP[f].toLowerCase()
  )

  return posts.filter(post => {
    const postStatus = (post.post_status || '').toLowerCase()
    const itemStatus = (post.item_status || '').toLowerCase()
    const itemType = (post.item_type || '').toLowerCase()

    // Check matches for each filter
    const matches = expectedValues.map(
      expectedValue =>
        postStatus === expectedValue ||
        itemStatus === expectedValue ||
        itemType === expectedValue
    )

    // Apply filter mode
    return mode === 'union'
      ? matches.some(Boolean) // OR: any match
      : matches.every(Boolean) // AND: all matches
  })
}

/**
 * Sort posts by submission date
 * @param posts - Array of posts to sort
 * @param direction - 'asc' or 'desc'
 */
export function sortPosts (
  posts: PublicPost[],
  direction: SortDirection = 'desc'
): PublicPost[] {
  return [...posts].sort((a, b) => {
    const as = a.submission_date || ''
    const bs = b.submission_date || ''
    if (!as && !bs) return 0
    if (!as) return 1
    if (!bs) return -1
    return direction === 'desc'
      ? (bs as string).localeCompare(as as string)
      : (as as string).localeCompare(bs as string)
  })
}
