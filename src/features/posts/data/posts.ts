import { supabase } from '@/shared/lib/supabase'
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
  claimer_name: string | null
  claimer_school_email: string | null
  claimer_contact_num: string | null
  claimed_at: string | null
  claim_processed_by_name: string | null
  claim_processed_by_email: string | null
  claim_processed_by_profile_picture_url: string | null
}

export async function getTotalPostsCount (): Promise<number | null> {
  const { count, error } = await supabase
    .from('post_public_view')
    .select('*', { count: 'exact', head: true })
    .eq('item_type', 'found')
    .in('post_status', ['accepted', 'reported'])
  if (error) {
    console.error('Error fetching post count')
    return null
  }
  return count
}

export async function getMissingItem (itemId: string): Promise<PublicPost | null> {
  let query = supabase
    .from('post_public_view')
    .select(
      `
      post_id,
      item_id,
      poster_name,
      poster_id,
      item_name,
      profile_picture_url,
      item_image_url,
      item_description,
      category,
      last_seen_at,
      item_status,
      last_seen_location,
      is_anonymous,
      submission_date,
      item_type,
      post_status,
      accepted_on_date,
      accepted_by_staff_name,
      accepted_by_staff_email,
      claimed_by_name,
      claimed_by_email,
      claimed_by_contact,
      claimed_at,
      claim_processed_by_staff_id,
      claim_id
    `
    )
    .eq('item_id', itemId)
    .eq('item_type', 'missing')

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

  const { data, error } = await query
  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  if (!data || data.length === 0) return null

  const r: any = data[0]
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
}
export async function getPost (postId: string): Promise<PublicPost | null> {
  let query = supabase
    .from('post_public_view')
    .select(
      `
      post_id,
      item_id,
      poster_name,
      poster_id,
      item_name,
      profile_picture_url,
      item_image_url,
      item_description,
      category,
      last_seen_at,
      item_status,
      last_seen_location,
      is_anonymous,
      submission_date,
      item_type,
      post_status,
      accepted_on_date,
      accepted_by_staff_name,
      accepted_by_staff_email,
      claimed_by_name,
      claimed_by_email,
      claimed_by_contact,
      claimed_at,
      claim_processed_by_staff_id,
      claim_id
    `
    )
    .eq('post_id', postId)
    .eq('item_type', 'found')

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

  const { data, error } = await query
  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  if (!data || data.length === 0) return null

  const r: any = data[0]
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
}

export async function getPostFull (
  postId: string
): Promise<PostRecordDetails | null> {
  if (!postId) return null

  try {
    const { data, error } = await supabase
      .from('v_post_records_details')
      .select('*')
      .eq('post_id', postId)
      .single()

    if (error) {
      console.error('Error fetching post record details:', error)
      return null
    }

    if (!data) return null

    return data as PostRecordDetails
  } catch (error) {
    console.error('Exception in getPostFull:', error)
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
  let query = supabase
    .from('post_public_view')
    .select(
      `
      post_id,
      item_id,
      poster_name,
      poster_id,
      item_name,
      profile_picture_url,
      item_image_url,
      item_description,
      category,
      last_seen_at,
      item_status,
      last_seen_location,
      is_anonymous,
      submission_date,
      item_type,
      post_status,
      accepted_on_date,
      accepted_by_staff_name,
      accepted_by_staff_email,
      claimed_by_name,
      claimed_by_email,
      claimed_by_contact,
      claimed_at,
      claim_processed_by_staff_id,
      claim_id
    `
    )
    .eq('poster_id', userId)

  let { count: totalCount, error: countError } = await supabase
    .from('post_public_view')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Error fetching post count for user posts')
    totalCount = 0
  }
  if (excludeIds && excludeIds.length > 0) {
    const inList = `(${excludeIds.map(id => `${id}`).join(',')})`
    query = query.not('post_id', 'in', inList)
  }

  const { data, error } = await query.limit(limit)

  if (error) throw error

  return {
    posts: (data ?? []).map((r: any) => ({
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
    count: totalCount
  }
}

export async function listPublicPosts (
  excludeIds: string[] = [],
  limit: number = 5
): Promise<PublicPost[]> {
  let query = supabase
    .from('post_public_view')
    .select(
      `
      post_id,
      item_id,
      poster_name,
      poster_id,
      item_name,
      profile_picture_url,
      item_image_url,
      item_description,
      category,
      last_seen_at,
      item_status,
      last_seen_location,
      is_anonymous,
      submission_date,
      item_type,
      post_status,
      accepted_on_date,
      accepted_by_staff_name,
      accepted_by_staff_email,
      claimed_by_name,
      claimed_by_email,
      claimed_by_contact,
      claimed_at,
      claim_processed_by_staff_id,
      claim_id
    `
    )
    .eq('item_type', 'found')
    .in('post_status', ['accepted', 'reported'])
    .order('accepted_on_date', { ascending: false })

  if (excludeIds && excludeIds.length > 0) {
    // Use single-quoted string literals for UUIDs in the IN list
    const inList = `(${excludeIds.map(id => `${id}`).join(',')})`
    query = query.not('post_id', 'in', inList)
  }

  const { data, error } = await query.limit(limit)

  if (error) throw error

  return (data ?? []).map((r: any) => ({
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
}

/**
 * List posts for staff view with custom filtering conditions
 * Similar to listPublicPosts but with different eq conditions for staff management
 */
export async function listPendingPosts (
  excludeIds: string[] = [],
  limit: number = 5
): Promise<PublicPost[]> {
  let query = supabase
    .from('post_public_view')
    .select(
      `
      post_id,
      item_id,
      poster_name,
      poster_id,
      item_name,
      profile_picture_url,
      item_image_url,
      item_description,
      category,
      last_seen_at,
      item_status,
      last_seen_location,
      is_anonymous,
      submission_date,
      item_type,
      post_status,
      accepted_on_date,
      accepted_by_staff_name,
      accepted_by_staff_email,
      claimed_by_name,
      claimed_by_email,
      claimed_by_contact,
      claimed_at,
      claim_processed_by_staff_id,
      claim_id
    `
    )
    .order('submission_date', { ascending: false })
    .eq('post_status', 'pending')

  if (excludeIds && excludeIds.length > 0) {
    // Use single-quoted string literals for UUIDs in the IN list
    const inList = `(${excludeIds.map(id => `${id}`).join(',')})`
    query = query.not('post_id', 'in', inList)
  }

  const { data, error } = await query.limit(limit)

  if (error) throw error

  return (data ?? []).map((r: any) => ({
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
}

export async function listStaffPosts (
  excludeIds: string[] = [],
  limit: number = 5
): Promise<PublicPost[]> {
  let query = supabase
    .from('post_public_view')
    .select(
      `
      post_id,
      item_id,
      poster_name,
      poster_id,
      item_name,
      profile_picture_url,
      item_image_url,
      item_description,
      category,
      last_seen_at,
      item_status,
      last_seen_location,
      is_anonymous,
      submission_date,
      item_type,
      post_status,
      accepted_on_date,
      accepted_by_staff_name,
      accepted_by_staff_email,
      claimed_by_name,
      claimed_by_email,
      claimed_by_contact,
      claimed_at,
      claim_processed_by_staff_id,
      claim_id
    `
    )
    .order('submission_date', { ascending: false })

  if (excludeIds && excludeIds.length > 0) {
    // Use single-quoted string literals for UUIDs in the IN list
    const inList = `(${excludeIds.map(id => `${id}`).join(',')})`
    query = query.not('post_id', 'in', inList)
  }

  const { data, error } = await query.limit(limit)

  if (error) throw error

  return (data ?? []).map((r: any) => ({
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

    const { data, error } = await supabase
      .from('post_public_view')
      .select(
        `
      post_id,
      item_id,
      poster_name,
      poster_id,
      item_name,
      profile_picture_url,
      item_image_url,
      item_description,
      category,
      last_seen_at,
      item_status,
      last_seen_location,
      is_anonymous,
      submission_date,
      item_type,
      post_status,
      accepted_on_date,
      accepted_by_staff_name,
      accepted_by_staff_email,
      claimed_by_name,
      claimed_by_email,
      claimed_by_contact,
      claimed_at,
      claim_processed_by_staff_id,
      claim_id
    `
      )
      .in('post_id', idsToFetch)

    if (error) {
      console.error('Error fetching search result posts:', error)
      return []
    }

    // Order results to match idsToFetch order
    const mapById: Record<string, any> = {}
    ;(data ?? []).forEach((r: any) => (mapById[r.post_id] = r))

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
  }
}
