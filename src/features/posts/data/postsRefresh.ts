import { supabase } from '@/shared/lib/supabase'
import type { PublicPost } from '@/features/posts/types/post'

// Helper function to format date to Manila timezone
function fmtManila (d: string | null): string | null {
  if (!d) return null
  return new Date(d).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Refresh function for listPublicPosts - fetches posts by IDs using .in()
export async function refreshPublicPosts (
  includeIds: string[]
): Promise<PublicPost[]> {
  if (includeIds.length === 0) return []

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
    .in('post_id', includeIds)
    .eq('item_type', 'found')
    .in('post_status', ['accepted', 'reported'])
    .order('submission_date', { ascending: false })

  console.log('Refreshed Public Posts:', data)
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

// Refresh function for listStaffPosts - fetches posts by IDs using .in()
export async function refreshStaffPosts (
  includeIds: string[]
): Promise<PublicPost[]> {
  if (includeIds.length === 0) return []

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
    .in('post_id', includeIds)
    .order('submission_date', { ascending: false })

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

// Refresh function for listOwnPosts - fetches posts by IDs using .in()
export async function refreshOwnPosts (
  userId: string,
  includeIds: string[]
): Promise<PublicPost[]> {
  if (includeIds.length === 0) return []

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
    .in('post_id', includeIds)
    .eq('poster_id', userId)
    .order('submission_date', { ascending: false })

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

export function refreshByIds () {
  return async function refreshByIds (
    includeIds: string[]
  ): Promise<PublicPost[]> {
    if (!includeIds || includeIds.length === 0) return []

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
      .in('post_id', includeIds)

    if (error) {
      console.error('Error refreshing search result posts:', error)
      return []
    }

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
}
