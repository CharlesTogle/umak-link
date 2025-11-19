import { supabase } from '@/shared/lib/supabase'
import { generateImageSearchQuery } from '@/features/user/utils/imageSearchUtil'
import type { PublicPost } from '@/features/posts/types/post'

export const deleteReasons = [
  'Duplicate Post',
  'Irrelevant Post',
  'Spam or Inappropriate Content',
  'Insufficient Information'
] as const

export const rejectReasons = [
  'Item is not identified in storage.',
  "Details don't match the item in question.",
  'This is a spam or malicious post.',
  'There is more than 1 instance of this post.'
] as const

interface MatchResult {
  success: boolean
  matches: PublicPost[]
  total_matches: number
  error?: string
}

interface HandlerResult {
  success: boolean
  error?: string
}

/**
 * Handle matching a missing item with found items using AI-powered search
 */
export async function handleMatch (
  postId: string,
  itemName: string,
  itemDescription: string,
  itemImageUrl: string | null,
  posterId: string
): Promise<MatchResult> {
  try {
    // Step 1: Generate metadata for audit trail
    const { error: metadataError } = await supabase
      .from('audit_logs')
      .insert({
        action_type: 'match_attempt',
        user_id: posterId,
        post_id: postId,
        details: {
          item_name: itemName,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (metadataError) {
      console.error('Failed to create audit log:', metadataError)
    }

    // Step 2: Generate search query using AI
    let searchQuery = itemName
    let imageSearchSuccess = false

    if (itemImageUrl) {
      try {
        // Convert image URL to File object
        const response = await fetch(itemImageUrl)
        const blob = await response.blob()
        const file = new File([blob], 'item-image.jpg', { type: blob.type })

        // Generate AI-powered search query
        const searchValue = `${itemName} OR ${itemDescription || ''}`
        const imageSearchResult = await generateImageSearchQuery({
          image: file,
          searchValue: searchValue.trim()
        })

        if (imageSearchResult.success) {
          searchQuery = imageSearchResult.searchQuery
          imageSearchSuccess = true
        }
      } catch (imageError) {
        console.error('Image search query generation failed:', imageError)
      }
    }

    // Step 3: If image search failed, add to pending_match table for retry
    if (!imageSearchSuccess && itemImageUrl) {
      try {
        await supabase.from('pending_match').insert({
          post_id: postId,
          poster_id: posterId,
          status: 'pending',
          retry_count: 0,
          created_at: new Date().toISOString()
        })
        console.log('Added to pending_match queue for retry')
      } catch (queueError) {
        console.error('Failed to add to pending_match queue:', queueError)
      }
    }

    // Step 4: Search for matching found items
    const { data: searchResults, error: searchError } = await supabase.rpc(
      'search_items_fts',
      {
        search_term: searchQuery,
        limit_count: 10,
        p_date: null,
        p_category: null,
        p_location_last_seen: null
      }
    )

    if (searchError) {
      console.error('Search error:', searchError)
      return {
        success: false,
        matches: [],
        total_matches: 0,
        error: searchError.message
      }
    }

    // Filter results to only include found items with accepted status
    const matches = (searchResults || []).filter(
      (item: any) =>
        item.item_type === 'found' && item.post_status === 'accepted'
    )

    return {
      success: true,
      matches,
      total_matches: matches.length
    }
  } catch (error: any) {
    console.error('Match error:', error)
    return {
      success: false,
      matches: [],
      total_matches: 0,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Handle deleting a post with a reason
 */
export async function handleDeleteSubmit (
  postId: string,
  posterId: string,
  itemName: string,
  reason: string,
  staffId: string
): Promise<HandlerResult> {
  try {
    // Step 1: Create audit log
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'post_deleted',
      user_id: staffId,
      post_id: postId,
      details: {
        reason,
        deleted_at: new Date().toISOString()
      }
    })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    // Step 2: Hard delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('post_id', postId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return {
        success: false,
        error: deleteError.message
      }
    }

    // Step 3: Send notification to poster
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: posterId,
          title: 'Post Deleted',
          body: `Your missing item post "${itemName}" has been deleted. Reason: ${reason}`,
          type: 'post_deleted',
          data: {
            post_id: postId,
            reason,
            item_name: itemName
          }
        }
      })
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Delete submit error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Handle rejecting a found item post
 */
export async function handleRejectSubmit (
  postId: string,
  posterId: string,
  itemName: string,
  reason: string,
  staffId: string
): Promise<HandlerResult> {
  try {
    // Step 1: Update post status to rejected
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        post_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('post_id', postId)

    if (updateError) {
      console.error('Reject error:', updateError)
      return {
        success: false,
        error: updateError.message
      }
    }

    // Step 2: Create audit log
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'post_rejected',
      user_id: staffId,
      post_id: postId,
      details: {
        reason,
        rejected_at: new Date().toISOString()
      }
    })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    // Step 3: Send notification to poster
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: posterId,
          title: 'Post Rejected',
          body: `Your found item post "${itemName}" has been rejected. Reason: ${reason}`,
          type: 'post_rejected',
          data: {
            post_id: postId,
            reason,
            item_name: itemName
          }
        }
      })
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Reject submit error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Handle accepting a found item post
 */
export async function handleAccept (
  postId: string,
  posterId: string,
  itemName: string,
  staffId: string
): Promise<HandlerResult> {
  try {
    // Step 1: Update post status to accepted
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        post_status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('post_id', postId)

    if (updateError) {
      console.error('Accept error:', updateError)
      return {
        success: false,
        error: updateError.message
      }
    }

    // Step 2: Create audit log
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'post_accepted',
      user_id: staffId,
      post_id: postId,
      details: {
        accepted_at: new Date().toISOString()
      }
    })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    // Step 3: Send notification to poster
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: posterId,
          title: 'Post Accepted',
          body: `Your found item post "${itemName}" has been accepted and is now visible to users.`,
          type: 'post_accepted',
          data: {
            post_id: postId,
            item_name: itemName
          }
        }
      })
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Accept error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}
