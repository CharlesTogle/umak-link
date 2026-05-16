import { api } from '@/shared/lib/api'
import type {
  PostRecord as ApiPostRecord,
  PostRecordDetails as ApiPostRecordDetails
} from '@/shared/lib/api-types'
import type { PublicPost } from '@/features/posts/types/post'
import { createPostCache } from '@/features/posts/data/postsCache'
import { formatTimestamp } from '@/shared/utils/formatTimeStamp'

type PostRecordWithClaimDetails = ApiPostRecord & {
  claimed_by_contact?: string | null
  claimed_at?: string | null
  profile_picture_url?: string | null
}

type PostRecordDetailsWithClaimDetails = ApiPostRecordDetails & {
  claimed_by_contact?: string | null
  claimed_at?: string | null
  claim_processed_by_name?: string | null
  claim_processed_by_email?: string | null
  claim_processed_by_profile_picture_url?: string | null
  claim_processed_by_user_type?: 'User' | 'Staff' | 'Admin' | 'Guard' | null
  accepted_by_guard_name?: string | null
  accepted_by_guard_email?: string | null
}

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
  custody_status: string | null

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
  claim_processed_by_user_type: 'User' | 'Staff' | 'Admin' | 'Guard' | null
  linked_lost_item_id: string | null
  returned_at: string | null
  accepted_by_guard_name: string | null
  accepted_by_guard_email: string | null
}

function mapPostRecordToPublicPost (record: ApiPostRecord): PublicPost {
  const postRecord = record as PostRecordWithClaimDetails
  return {
    user_id: record.poster_id,
    username: record.poster_name,
    item_name: record.item_name,
    item_id: record.item_id,
    profilepicture_url: postRecord.profile_picture_url ?? null,
    item_image_url: record.item_image_url,
    item_description: record.item_description,
    item_status: record.item_status,
    category: record.category,
    last_seen_at: formatTimestamp(record.last_seen_at),
    last_seen_location: record.last_seen_location,
    is_anonymous: record.is_anonymous,
    post_id: String(record.post_id),
    submission_date: record.submission_date,
    item_type: record.item_type,
    post_status: record.post_status,
    custody_status: record.custody_status ?? null,
    accepted_by_staff_name: record.accepted_by_staff_name,
    accepted_by_staff_email: record.accepted_by_staff_email,
    claimed_by_name: record.claimed_by_name,
    claimed_by_email: record.claimed_by_email,
    claimed_by_contact: postRecord.claimed_by_contact ?? null,
    claimed_at: postRecord.claimed_at ?? null,
    claim_processed_by_staff_id: record.claim_processed_by_staff_id,
    claim_id: record.claim_id,
    accepted_on_date: record.accepted_on_date
  }
}

function mapPostRecordWithClaimDetailsToPublicPost (
  record: PostRecordWithClaimDetails
): PublicPost {
  return mapPostRecordToPublicPost(record)
}

function mapPostRecordDetailsToPublicPost (
  record: ApiPostRecordDetails
): PublicPost {
  return {
    ...mapPostRecordToPublicPost(record),
    returned_at: record.returned_at_local
  }
}

function mapApiPostRecordDetailsToFeaturePostRecordDetails (
  record: ApiPostRecordDetails
): PostRecordDetails {
  const detailedRecord = record as PostRecordDetailsWithClaimDetails
  return {
    post_id: String(record.post_id),
    poster_id: record.poster_id,
    post_status: record.post_status,
    item_id: record.item_id,
    is_anonymous: record.is_anonymous,
    submitted_on_date_local: record.submission_date,
    rejection_reason: null,
    accepted_on_date_local: record.accepted_on_date,
    last_seen_date: null,
    last_seen_time: null,
    last_seen_at: formatTimestamp(record.last_seen_at),
    last_seen_location: record.last_seen_location,
    item_name: record.item_name,
    item_description: record.item_description,
    image_id: null,
    item_image_url: record.item_image_url,
    item_status: record.item_status,
    item_type: record.item_type,
    category: record.category,
    custody_status: record.custody_status ?? null,
    poster_name: record.poster_name,
    poster_email: '',
    poster_profile_picture_url: null,
    claim_id: record.claim_id,
    claimer_name: record.claimed_by_name,
    claimer_school_email: record.claimed_by_email,
    claimer_contact_num: detailedRecord.claimed_by_contact ?? null,
    claimed_at: detailedRecord.claimed_at ?? null,
    claim_processed_by_name: detailedRecord.claim_processed_by_name ?? null,
    claim_processed_by_email: detailedRecord.claim_processed_by_email ?? null,
    claim_processed_by_profile_picture_url:
      detailedRecord.claim_processed_by_profile_picture_url ?? null,
    claim_processed_by_user_type:
      detailedRecord.claim_processed_by_user_type ?? null,
    linked_lost_item_id: record.linked_lost_item_id,
    returned_at: record.returned_at_local,
    accepted_by_guard_name: detailedRecord.accepted_by_guard_name ?? null,
    accepted_by_guard_email: detailedRecord.accepted_by_guard_email ?? null
  }
}

function mapPostRecordToFeaturePostRecordDetails (
  record: ApiPostRecord
): PostRecordDetails {
  const postRecord = record as PostRecordWithClaimDetails
  return {
    post_id: String(record.post_id),
    poster_id: record.poster_id,
    post_status: record.post_status,
    item_id: record.item_id,
    is_anonymous: record.is_anonymous,
    submitted_on_date_local: record.submission_date,
    rejection_reason: null,
    accepted_on_date_local: record.accepted_on_date,
    last_seen_date: null,
    last_seen_time: null,
    last_seen_at: formatTimestamp(record.last_seen_at),
    last_seen_location: record.last_seen_location,
    item_name: record.item_name,
    item_description: record.item_description,
    image_id: null,
    item_image_url: record.item_image_url,
    item_status: record.item_status,
    item_type: record.item_type,
    category: record.category,
    custody_status: record.custody_status ?? null,
    poster_name: record.poster_name,
    poster_email: '',
    poster_profile_picture_url: null,
    claim_id: record.claim_id,
    claimer_name: record.claimed_by_name,
    claimer_school_email: record.claimed_by_email,
    claimer_contact_num: postRecord.claimed_by_contact ?? null,
    claimed_at: postRecord.claimed_at ?? null,
    claim_processed_by_name: null,
    claim_processed_by_email: null,
    claim_processed_by_profile_picture_url: null,
    claim_processed_by_user_type: null,
    linked_lost_item_id: null,
    returned_at: null,
    accepted_by_guard_name: null,
    accepted_by_guard_email: null
  }
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

    const record = result.posts[0] as PostRecordWithClaimDetails
    console.log(record)
    return mapPostRecordWithClaimDetailsToPublicPost(record)
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
    const record = await api.posts.get(Number(postId))
    return mapPostRecordWithClaimDetailsToPublicPost(
      record as PostRecordWithClaimDetails
    )
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
    return mapApiPostRecordDetailsToFeaturePostRecordDetails(data)
  } catch (error) {
    console.error('Exception in getPostFull, falling back to public post view:', error)

    try {
      const fallbackData = await api.posts.get(Number(postId))
      return mapPostRecordToFeaturePostRecordDetails(fallbackData)
    } catch (fallbackError) {
      console.error('Exception in getPostFull fallback:', fallbackError)
      return null
    }
  }
}

export async function getPostRecordByItemId (
  itemId: string
): Promise<PublicPost | null> {
  if (!itemId) return null

  try {
    const data = await api.posts.getByItemIdDetails(itemId)
    return mapPostRecordDetailsToPublicPost(data)
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
    return mapPostRecordToPublicPost(data)
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

    return mapPostRecordToFeaturePostRecordDetails(result.posts[0])
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
      posts: (result.posts ?? []).map(record =>
        mapPostRecordWithClaimDetailsToPublicPost(
          record as PostRecordWithClaimDetails
        )
      ),
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

    return (result.posts ?? []).map(record =>
      mapPostRecordWithClaimDetailsToPublicPost(
        record as PostRecordWithClaimDetails
      )
    )
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

    return (result.posts ?? []).map(record =>
      mapPostRecordWithClaimDetailsToPublicPost(
        record as PostRecordWithClaimDetails
      )
    )
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

    return (result.posts ?? []).map(record =>
      mapPostRecordWithClaimDetailsToPublicPost(
        record as PostRecordWithClaimDetails
      )
    )
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
      const mapById: Record<string, PostRecordWithClaimDetails> = {}
      ;(result.posts ?? []).forEach(record => {
        mapById[String(record.post_id)] = record as PostRecordWithClaimDetails
      })

      const ordered = idsToFetch
        .map(id => mapById[id])
        .filter(
          (record): record is PostRecordWithClaimDetails => record !== undefined
        )
        .map(record => mapPostRecordWithClaimDetailsToPublicPost(record))
      return ordered
    } catch (error) {
      console.error('Error fetching search result posts:', error)
      return []
    }
  }
}
