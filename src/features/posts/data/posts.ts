import { supabase } from '@/shared/lib/supabase'
import type { PublicPost } from '@/features/posts/types/post'
import { createPostCache } from '@/features/posts/data/postsCache'

const fmtManila = (iso: string | null) => {
  if (!iso) return null
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(iso))
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

export async function getPost (postId: string): Promise<PublicPost | null> {
  let query = supabase
    .from('post_public_view')
    .select(
      `
      post_id,
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
      post_status
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
    profilepicture_url: r.profile_picture_url,
    accepted_on_date: r.accepted_on_date,
    item_image_url: r.item_image_url,
    item_description: r.item_description,
    item_status: r.item_status,
    category: r.category,
    last_seen_at: fmtManila(r.last_seen_at),
    last_seen_location: r.last_seen_location,
    is_anonymous: r.is_anonymous,
    post_id: r.post_id,
    submission_date: r.submission_date,
    item_type: r.item_type,
    post_status: r.post_status
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
      post_status
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
      profilepicture_url: r.profile_picture_url,
      item_image_url: r.item_image_url,
      item_description: r.item_description,
      item_status: r.item_status,
      accepted_on_date: r.accepted_on_date,
      category: r.category,
      last_seen_at: fmtManila(r.last_seen_at),
      last_seen_location: r.last_seen_location,
      is_anonymous: r.is_anonymous,
      post_id: r.post_id,
      submission_date: r.submission_date,
      item_type: r.item_type,
      post_status: r.post_status
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
      accepted_on_date
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
    profilepicture_url: r.profile_picture_url,
    item_image_url: r.item_image_url,
    item_description: r.item_description,
    accepted_on_date: r.accepted_on_date,
    item_status: r.item_status,
    category: r.category,
    last_seen_at: fmtManila(r.last_seen_at),
    last_seen_location: r.last_seen_location,
    is_anonymous: r.is_anonymous,
    post_id: r.post_id,
    submission_date: r.submission_date,
    item_type: r.item_type,
    post_status: r.post_status
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
      post_status
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
    profilepicture_url: r.profile_picture_url,
    item_image_url: r.item_image_url,
    item_description: r.item_description,
    item_status: r.item_status,
    accepted_on_date: r.accepted_on_date,
    category: r.category,
    last_seen_at: fmtManila(r.last_seen_at),
    last_seen_location: r.last_seen_location,
    is_anonymous: r.is_anonymous,
    post_id: r.post_id,
    submission_date: r.submission_date,
    item_type: r.item_type,
    post_status: r.post_status
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
      post_status
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
    profilepicture_url: r.profile_picture_url,
    item_image_url: r.item_image_url,
    item_description: r.item_description,
    item_status: r.item_status,
    accepted_on_date: r.accepted_on_date,
    category: r.category,
    last_seen_at: fmtManila(r.last_seen_at),
    last_seen_location: r.last_seen_location,
    is_anonymous: r.is_anonymous,
    post_id: r.post_id,
    submission_date: r.submission_date,
    item_type: r.item_type,
    post_status: r.post_status
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
      accepted_on_date
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
        profilepicture_url: r.profile_picture_url,
        item_image_url: r.item_image_url,
        item_description: r.item_description,
        accepted_on_date: r.accepted_on_date,
        item_status: r.item_status,
        category: r.category,
        last_seen_at: fmtManila(r.last_seen_at),
        last_seen_location: r.last_seen_location,
        is_anonymous: r.is_anonymous,
        post_id: r.post_id,
        submission_date: r.submission_date,
        item_type: r.item_type,
        post_status: r.post_status
      }))
    return ordered
  }
}
