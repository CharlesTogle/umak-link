import api from '@/shared/lib/api'
import type { PublicPost } from '@/features/posts/types/post'
import type { PostRecord } from '@/shared/lib/api-types'
import { formatTimestamp } from '@/shared/utils/formatTimeStamp'

/**
 * Transform PostRecord to PublicPost
 */
function transformToPublicPost (r: PostRecord): PublicPost {
  // Use 'as any' for fields that may be present in the API response but not in PostRecord type
  const record = r as any
  return {
    item_id: r.item_id,
    post_id: String(r.post_id),
    user_id: r.poster_id,
    username: r.poster_name,
    profilepicture_url: record.profile_picture_url ?? null,
    item_name: r.item_name,
    item_image_url: r.item_image_url,
    item_description: r.item_description,
    item_status: r.item_status,
    accepted_on_date: r.accepted_on_date,
    submission_date: r.submission_date,
    item_type: r.item_type,
    post_status: r.post_status,
    category: r.category,
    last_seen_at: formatTimestamp(r.last_seen_at),
    last_seen_location: r.last_seen_location,
    is_anonymous: r.is_anonymous,
    accepted_by_staff_name: r.accepted_by_staff_name,
    accepted_by_staff_email: r.accepted_by_staff_email,
    claimed_by_name: r.claimed_by_name,
    claimed_by_email: r.claimed_by_email,
    claimed_by_contact: record.claimed_by_contact ?? null,
    claimed_at: record.claimed_at ?? null,
    claim_processed_by_staff_id: r.claim_processed_by_staff_id,
    claim_id: r.claim_id
  }
}

/**
 * Fetch matched posts excluding already loaded IDs
 * Used for pagination in Matches page
 */
export async function listMatchedPosts (
  matchedPostIds: string[],
  excludeIds: string[],
  limit: number
): Promise<PublicPost[]> {
  try {
    if (!matchedPostIds || matchedPostIds.length === 0) {
      console.warn('No matched post IDs provided')
      return []
    }

    // Filter out exclude IDs from matchedPostIds before making the request
    const filteredPostIds = matchedPostIds.filter(id => !excludeIds.includes(id))

    if (filteredPostIds.length === 0) {
      console.warn('No post IDs remaining after filtering excludes')
      return []
    }

    const response = await api.posts.list({
      post_ids: filteredPostIds,
      status: 'accepted',
      item_type: 'found',
      limit,
      order_by: 'accepted_on_date',
      order_direction: 'desc'
    })

    return (response.posts ?? []).map(transformToPublicPost)
  } catch (error) {
    console.error('Exception in listMatchedPosts:', error)
    throw error
  }
}

/**
 * Refresh already loaded matched posts by their IDs
 * Used for pull-to-refresh in Matches page
 */
export async function refreshMatchedPosts (
  includeIds: string[]
): Promise<PublicPost[]> {
  try {
    if (!includeIds || includeIds.length === 0) {
      console.warn('No post IDs provided to refreshMatchedPosts')
      return []
    }

    const response = await api.posts.list({
      post_ids: includeIds,
      status: 'accepted',
      item_type: 'found',
      order_by: 'accepted_on_date',
      order_direction: 'desc'
    })

    return (response.posts ?? []).map(transformToPublicPost)
  } catch (error) {
    console.error('Exception in refreshMatchedPosts:', error)
    throw error
  }
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use listMatchedPosts or refreshMatchedPosts instead
 */
export async function getMatchedPosts (
  postIds: string[]
): Promise<PublicPost[]> {
  return refreshMatchedPosts(postIds)
}
