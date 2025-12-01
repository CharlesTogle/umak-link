import { supabase } from '@/shared/lib/supabase'
import type { PublicPost } from '@/features/posts/types/post'
import { formatTimestamp } from '@/shared/utils/formatTimeStamp'
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

    // Convert string IDs to integers for database query
    const intMatchedIds = matchedPostIds
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))

    if (intMatchedIds.length === 0) {
      console.warn('No valid matched post IDs after parsing')
      return []
    }

    // Convert exclude IDs to integers
    const intExcludeIds = excludeIds
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))

    let query = supabase
      .from('post_public_view')
      .select('*')
      .in('post_id', intMatchedIds)
      .eq('post_status', 'accepted')
      .eq('item_type', 'found')

    if (intExcludeIds.length > 0) {
      query = query.not('post_id', 'in', `(${intExcludeIds.join(',')})`)
    }

    const { data, error } = await query
      .order('accepted_on_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching matched posts:', error)
      throw error
    }

    return (data ?? []).map((r: any) => ({
      item_id: r.item_id,
      post_id: r.post_id, // integer
      user_id: r.poster_id,
      username: r.poster_name,
      profilepicture_url: r.profile_picture_url,
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
      claimed_by_contact: r.claimed_by_contact,
      claimed_at: r.claimed_at,
      claim_processed_by_staff_id: r.claim_processed_by_staff_id,
      claim_id: r.claim_id
      // Add any other missing PublicPost fields here, e.g.:
      // location, tags, etc. (if present in r)
    }))
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

    // Convert string IDs to integers for database query
    const intPostIds = includeIds
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))

    if (intPostIds.length === 0) {
      console.warn('No valid post IDs after parsing')
      return []
    }

    const { data, error } = await supabase
      .from('post_public_view')
      .select('*')
      .in('post_id', intPostIds)
      .eq('post_status', 'accepted')
      .eq('item_type', 'found')
      .order('accepted_on_date', { ascending: false })

    if (error) {
      console.error('Error refreshing matched posts:', error)
      throw error
    }

    return (data ?? []).map((r: any) => ({
      item_id: r.item_id,
      post_id: r.post_id, // integer
      user_id: r.poster_id,
      username: r.poster_name,
      profilepicture_url: r.profile_picture_url,
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
      claimed_by_contact: r.claimed_by_contact,
      claimed_at: r.claimed_at,
      claim_processed_by_staff_id: r.claim_processed_by_staff_id,
      claim_id: r.claim_id
      // Add any other missing PublicPost fields here, e.g.:
      // location, tags, etc. (if present in r)
    }))
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
