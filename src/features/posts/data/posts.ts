import { supabase } from '@/shared/lib/supabase'
import { api } from '@/shared/lib/api'
import type { PublicPost } from '@/features/posts/types/post'
import { createPostCache } from '@/features/posts/data/postsCache'
import { formatTimestamp } from '@/shared/utils/formatTimeStamp'

export interface PostRecordDetails {
  // Post details
  post_id: string
  poster_id: string
  post_status: string
  item_id: string
  is_anonymous: boolean
  submitted_on_date_local: string | null
  rejection_reason: string | null
  accepted_on_date_local: string | null
  last_seen_date: string | null
  last_seen_time: string | null
  last_seen_at: string | null
  last_seen_location: string | null

  // Item details
  item_name: string
  item_description: string | null
  image_id: string | null
  item_image_url: string | null
  item_status: string
  item_type: string
  category: string | null

  // Poster details
  poster_name: string
  poster_email: string
  poster_profile_picture_url: string | null

  // Claim details
  claim_id: string | null
  claimer_name: string | null
  claimer_school_email: string | null
  claimer_contact_num: string | null
  claimed_at: string | null
  claim_processed_by_name: string | null
  claim_processed_by_email: string | null
  claim_processed_by_profile_picture_url: string | null
  linked_lost_item_id: string | null
  returned_at: string | null
}

export async function getTotalPostsCount (): Promise<number | null> {
  try {
    const result = await api.posts.getCount({ type: 'public', item_type: 'found' })
    return result.count
  } catch (error) {
    console.error('Error fetching post count:', error)
    return null
  }
}

export async function getMissingItem (
  itemId: string
): Promise<PublicPost | null> {
  const postCache = createPostCache({
    loadedKey: 'LoadedPosts',
    cacheKey: 'CachedPublicPosts'
  })

  if (!itemId) return null

  const cachedPosts = await postCache.loadCachedPublicPosts()
  const currPost = cachedPosts.find(p => p.post_id === itemId) || null
  if (currPost) {
    return currPost
  }

  try {
    const result = await api.posts.list({
      item_id: itemId,
      item_type: 'missing',
      limit: 1
    })

    if (!result.posts || result.posts.length === 0) return null

    const r: any = result.posts[0]
    console.log(r)
    return {
      user_id: r.poster_id,
      username: r.poster_name,
      item_name: r.item_name,
      item_id: r.item_id,
      profilepicture_url: r.profile_picture_url,
      accepted_on_date: r.accepted_on_date,
      item_image_url: r.item_image_url,
      item_description: r.item_description,
      item_status: r.item_status,
      category: r.category,
      last_seen_at: formatTimestamp(r.last_seen_at),
      last_seen_location: r.last_seen_location,
      is_anonymous: r.is_anonymous,
      post_id: r.post_id,
      submission_date: r.submission_date,
      item_type: r.item_type,
      post_status: r.post_status,
      accepted_by_staff_name: r.accepted_by_staff_name,
      accepted_by_staff_email: r.accepted_by_staff_email,
      claimed_by_name: r.claimed_by_name,
      claimed_by_email: r.claimed_by_email,
      claimed_by_contact: r.claimed_by_contact,
      claimed_at: r.claimed_at,
      claim_processed_by_staff_id: r.claim_processed_by_staff_id,
      claim_id: r.claim_id
    }
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}
export async function getPost (postId: string): Promise<PublicPost | null> {
  const postCache = createPostCache({
    loadedKey: 'LoadedPosts',
    cacheKey: 'CachedPublicPosts'
  })

  if (!postId) return null

  const cachedPosts = await postCache.loadCachedPublicPosts()
  const currPost = cachedPosts.find(p => p.post_id === postId) || null
  if (currPost) {
    return currPost
  }

  try {
    const r: any = await api.posts.get(Number(postId))
    return {
      user_id: r.poster_id,
      username: r.poster_name,
      item_name: r.item_name,
      item_id: r.item_id,
      profilepicture_url: r.profile_picture_url,
      accepted_on_date: r.accepted_on_date,
      item_image_url: r.item_image_url,
      item_description: r.item_description,
      item_status: r.item_status,
      category: r.category,
      last_seen_at: formatTimestamp(r.last_seen_at),
      last_seen_location: r.last_seen_location,
      is_anonymous: r.is_anonymous,
      post_id: r.post_id,
      submission_date: r.submission_date,
      item_type: r.item_type,
      post_status: r.post_status,
      accepted_by_staff_name: r.accepted_by_staff_name,
      accepted_by_staff_email: r.accepted_by_staff_email,
      claimed_by_name: r.claimed_by_name,
      claimed_by_email: r.claimed_by_email,
      claimed_by_contact: r.claimed_by_contact,
      claimed_at: r.claimed_at,
      claim_processed_by_staff_id: r.claim_processed_by_staff_id,
      claim_id: r.claim_id
    }
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export async function getPostFull (
  postId: string
): Promise<PostRecordDetails | null> {
  if (!postId) return null

  try {
    const data = await api.posts.getFull(Number(postId))
    return data as PostRecordDetails
  } catch (error) {
    console.error('Exception in getPostFull:', error)
    return null
  }
}

export async function getPostRecordByItemId (
  itemId: string
): Promise<PublicPost | null> {
  if (!itemId) return null

  try {
    const data = await api.posts.getByItemIdDetails(itemId)
    return data as PublicPost
  } catch (error) {
    console.error('Exception in getPostByItemId:', error)
    return null
  }
}

export async function getPostByItemId (
  itemId: string
): Promise<PublicPost | null> {
  if (!itemId) return null

  try {
    const data = await api.posts.getByItemId(itemId)
    return data as PublicPost
  } catch (error) {
    console.error('Exception in getPostByItemId:', error)
    return null
  }
}

// Get found item post that has a specific missing item linked to it
export async function getFoundPostByLinkedMissingItem (
  missingItemId: string
): Promise<PostRecordDetails | null> {
  if (!missingItemId) return null

  try {
    const result = await api.posts.list({
      linked_item_id: missingItemId,
      limit: 1
    })

    if (!result.posts || result.posts.length === 0) return null

    return result.posts[0] as PostRecordDetails
  } catch (error) {
    console.error('Exception in getFoundPostByLinkedMissingItem:', error)
    return null
  }
}

export async function listOwnPosts ({
  excludeIds = [],
  userId,
  limit
}: {
  excludeIds: string[]
  userId: string
  limit: number
}): Promise<{ posts: PublicPost[]; count: number | null }> {
  try {
    const result = await api.posts.list({
      type: 'own',
      poster_id: userId,
      exclude_ids: excludeIds,
      limit,
      include_count: true
    })

    return {
      posts: (result.posts ?? []).map((r: any) => ({
        user_id: r.poster_id,
        username: r.poster_name,
        item_name: r.item_name,
        item_id: r.item_id,
        profilepicture_url: r.profile_picture_url,
        item_image_url: r.item_image_url,
        item_description: r.item_description,
        item_status: r.item_status,
        accepted_on_date: r.accepted_on_date,
        category: r.category,
        last_seen_at: formatTimestamp(r.last_seen_at),
        last_seen_location: r.last_seen_location,
        is_anonymous: r.is_anonymous,
        post_id: r.post_id,
        submission_date: r.submission_date,
        item_type: r.item_type,
        post_status: r.post_status,
        accepted_by_staff_name: r.accepted_by_staff_name,
        accepted_by_staff_email: r.accepted_by_staff_email,
        claimed_by_name: r.claimed_by_name,
        claimed_by_email: r.claimed_by_email,
        claimed_by_contact: r.claimed_by_contact,
        claimed_at: r.claimed_at,
        claim_processed_by_staff_id: r.claim_processed_by_staff_id,
        claim_id: r.claim_id
      })),
      count: result.count || 0
    }
  } catch (error) {
    console.error('Error fetching user posts:', error)
    throw error
  }
}

export async function listPublicPosts (
  excludeIds: string[] = [],
  limit: number = 5
): Promise<PublicPost[]> {
  try {
    const result = await api.posts.list({
      type: 'public',
      exclude_ids: excludeIds,
      limit,
      order_by: 'accepted_on_date',
      order_direction: 'desc'
    })

    return (result.posts ?? []).map((r: any) => ({
      user_id: r.poster_id,
      username: r.poster_name,
      item_name: r.item_name,
      item_id: r.item_id,
      profilepicture_url: r.profile_picture_url,
      item_image_url: r.item_image_url,
      item_description: r.item_description,
      accepted_on_date: r.accepted_on_date,
      item_status: r.item_status,
      category: r.category,
      last_seen_at: formatTimestamp(r.last_seen_at),
      last_seen_location: r.last_seen_location,
      is_anonymous: r.is_anonymous,
      post_id: r.post_id,
      submission_date: r.submission_date,
      item_type: r.item_type,
      post_status: r.post_status,
      accepted_by_staff_name: r.accepted_by_staff_name,
      accepted_by_staff_email: r.accepted_by_staff_email,
      claimed_by_name: r.claimed_by_name,
      claimed_by_email: r.claimed_by_email,
      claimed_by_contact: r.claimed_by_contact,
      claimed_at: r.claimed_at,
      claim_processed_by_staff_id: r.claim_processed_by_staff_id,
      claim_id: r.claim_id
    }))
  } catch (error) {
    console.error('Error fetching public posts:', error)
    throw error
  }
}

/**
 * List posts for staff view with custom filtering conditions
 * Similar to listPublicPosts but with different eq conditions for staff management
 */
export async function listPendingPosts (
  excludeIds: string[] = [],
  limit: number = 5
): Promise<PublicPost[]> {
  try {
    const result = await api.posts.list({
      type: 'pending',
      exclude_ids: excludeIds,
      limit,
      order_by: 'submission_date',
      order_direction: 'desc'
    })

    return (result.posts ?? []).map((r: any) => ({
      user_id: r.poster_id,
      username: r.poster_name,
      item_name: r.item_name,
      item_id: r.item_id,
      profilepicture_url: r.profile_picture_url,
      item_image_url: r.item_image_url,
      item_description: r.item_description,
      item_status: r.item_status,
      accepted_on_date: r.accepted_on_date,
      category: r.category,
      last_seen_at: formatTimestamp(r.last_seen_at),
      last_seen_location: r.last_seen_location,
      is_anonymous: r.is_anonymous,
      post_id: r.post_id,
      submission_date: r.submission_date,
      item_type: r.item_type,
      post_status: r.post_status,
      accepted_by_staff_name: r.accepted_by_staff_name,
      accepted_by_staff_email: r.accepted_by_staff_email,
      claimed_by_name: r.claimed_by_name,
      claimed_by_email: r.claimed_by_email,
      claimed_by_contact: r.claimed_by_contact,
      claimed_at: r.claimed_at,
      claim_processed_by_staff_id: r.claim_processed_by_staff_id,
      claim_id: r.claim_id
    }))
  } catch (error) {
    console.error('Error fetching pending posts:', error)
    throw error
  }
}

export async function listStaffPosts (
  excludeIds: string[] = [],
  limit: number = 5
): Promise<PublicPost[]> {
  try {
    const result = await api.posts.list({
      type: 'staff',
      exclude_ids: excludeIds,
      limit,
      order_by: 'submission_date',
      order_direction: 'desc'
    })

    return (result.posts ?? []).map((r: any) => ({
      user_id: r.poster_id,
      username: r.poster_name,
      item_name: r.item_name,
      item_id: r.item_id,
      profilepicture_url: r.profile_picture_url,
      item_image_url: r.item_image_url,
      item_description: r.item_description,
      item_status: r.item_status,
      accepted_on_date: r.accepted_on_date,
      category: r.category,
      last_seen_at: formatTimestamp(r.last_seen_at),
      last_seen_location: r.last_seen_location,
      is_anonymous: r.is_anonymous,
      post_id: r.post_id,
      submission_date: r.submission_date,
      item_type: r.item_type,
      post_status: r.post_status,
      accepted_by_staff_name: r.accepted_by_staff_name,
      accepted_by_staff_email: r.accepted_by_staff_email,
      claimed_by_name: r.claimed_by_name,
      claimed_by_email: r.claimed_by_email,
      claimed_by_contact: r.claimed_by_contact,
      claimed_at: r.claimed_at,
      claim_processed_by_staff_id: r.claim_processed_by_staff_id,
      claim_id: r.claim_id
    }))
  } catch (error) {
    console.error('Error fetching staff posts:', error)
    throw error
  }
}

export function listPostsByIds (getPostIds: () => string[]) {
  return async function listPostsByIds (
    excludeIds: string[] = [],
    limit: number = 5
  ): Promise<PublicPost[]> {
    const postIds = getPostIds()
    if (!postIds || postIds.length === 0) return []

    // Filter out excluded ids
    const remaining = postIds.filter(id => !excludeIds.includes(id))
    if (remaining.length === 0) return []

    const idsToFetch = remaining.slice(0, limit)

    try {
      const result = await api.posts.list({
        post_ids: idsToFetch,
        limit: idsToFetch.length
      })

      // Order results to match idsToFetch order
      const mapById: Record<string, any> = {}
      ;(result.posts ?? []).forEach((r: any) => (mapById[r.post_id] = r))

      const ordered = idsToFetch
        .map(id => mapById[id])
        .filter(Boolean)
        .map((r: any) => ({
          user_id: r.poster_id,
          username: r.poster_name,
          item_name: r.item_name,
          item_id: r.item_id,
          profilepicture_url: r.profile_picture_url,
          item_image_url: r.item_image_url,
          item_description: r.item_description,
          accepted_on_date: r.accepted_on_date,
          item_status: r.item_status,
          category: r.category,
          last_seen_at: formatTimestamp(r.last_seen_at),
          last_seen_location: r.last_seen_location,
          is_anonymous: r.is_anonymous,
          post_id: r.post_id,
          submission_date: r.submission_date,
          item_type: r.item_type,
          post_status: r.post_status,
          accepted_by_staff_name: r.accepted_by_staff_name,
          accepted_by_staff_email: r.accepted_by_staff_email,
          claimed_by_name: r.claimed_by_name,
          claimed_by_email: r.claimed_by_email,
          claimed_by_contact: r.claimed_by_contact,
          claimed_at: r.claimed_at,
          claim_processed_by_staff_id: r.claim_processed_by_staff_id,
          claim_id: r.claim_id
        }))
      return ordered
    } catch (error) {
      console.error('Error fetching search result posts:', error)
      return []
    }
  }
}
