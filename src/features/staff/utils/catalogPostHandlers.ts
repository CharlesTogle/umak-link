import { searchApiService, notificationApiService, postApiService, pendingMatchApiService, itemApiService } from '@/shared/services'
import api from '@/shared/lib/api'
import { generateImageSearchQuery } from '@/features/user/utils/imageSearchUtil'
import { generateItemMetadata } from '@/shared/lib/geminiApi'
import type { PublicPost } from '@/features/posts/types/post'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'

// Rate limiting for Gemini API
const RATE_LIMIT_WINDOW = 60000 // 1 minute in milliseconds
let geminiRequestCount = 0
let rateLimitWindowStart = Date.now()

const MAX_GEMINI_REQUESTS = parseInt(
  import.meta.env.VITE_MAX_METADATA_REQUESTS_PER_MINUTE || '10',
  10
)

function checkRateLimit (): boolean {
  const now = Date.now()

  // Reset counter if window has passed
  if (now - rateLimitWindowStart >= RATE_LIMIT_WINDOW) {
    geminiRequestCount = 0
    rateLimitWindowStart = now
  }

  // Check if limit is reached
  if (geminiRequestCount >= MAX_GEMINI_REQUESTS) {
    return false
  }

  geminiRequestCount++
  return true
}

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
  'There is more than 1 instance of this post.',
  'Item has been discarded.'
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
  userId: string,
  postId: string,
  itemName: string,
  itemDescription: string,
  itemImageUrl: string | null,
  posterId: string
): Promise<MatchResult> {
  try {
    // Step 1: Update post status to 'accepted' immediately for user feedback
    const updateResult = await postApiService.updatePostStatus(
      parseInt(postId),
      'accepted'
    )

    if (!updateResult.success) {
      console.error('Failed to update post status')
      return {
        success: false,
        matches: [],
        total_matches: 0,
        error: 'Failed to update post status'
      }
    }

    // Fetch staff data for audit log
    let staffData = null
    try {
      const userData = await api.users.get(userId)
      staffData = { user_name: userData.user_name }
    } catch (error) {
      console.error('Failed to fetch staff data for audit log:', error)
    }
    // Step 2: Create audit log
    const { insertAuditLog } = useAuditLogs()
    await insertAuditLog({
      user_id: userId,
      action_type: 'match_attempt',
      details: {
        message: `${
          staffData?.user_name || 'Staff'
        } initiated match generation for post ${itemName}`,
        post_id: postId,
        item_name: itemName,
        timestamp: new Date().toISOString()
      }
    })

    // Step 3: Start non-blocking match generation in background
    generateMatchesInBackground(
      postId,
      itemName,
      itemDescription,
      itemImageUrl,
      posterId
    )

    // Return immediately with empty matches for instant feedback
    return {
      success: true,
      matches: [],
      total_matches: 0
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
 * Generate matches in the background (non-blocking)
 */
async function generateMatchesInBackground (
  postId: string,
  itemName: string,
  itemDescription: string,
  itemImageUrl: string | null,
  posterId: string
): Promise<void> {
  try {
    // Step 1: Generate search query using AI
    let searchQuery = itemName
    let shouldAddToPending = false
    let failureReason: string | null = null

    if (itemImageUrl) {
      // Check rate limit before making Gemini API call
      const canProceed = checkRateLimit()

      if (!canProceed) {
        console.warn('Rate limit exceeded for Gemini API')
        shouldAddToPending = true
        failureReason = 'Rate limit exceeded'
      } else {
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
          } else {
            shouldAddToPending = true
            failureReason =
              imageSearchResult.error || 'Image search query generation failed'
          }
        } catch (imageError: any) {
          console.error('Image search query generation failed:', imageError)
          shouldAddToPending = true
          failureReason =
            imageError.message || 'Unknown error during image processing'
        }
      }
    }

    // Step 3: If image search failed or rate limit hit, add to pending_match table for retry
    if (shouldAddToPending && itemImageUrl) {
      try {
        await pendingMatchApiService.createPendingMatch({
          post_id: parseInt(postId),
          poster_id: posterId,
          status: 'pending',
          is_retriable: true,
          failed_reason: failureReason
        })
        console.log('Added to pending_match queue for retry')
      } catch (queueError) {
        console.error('Failed to add to pending_match queue:', queueError)
      }
    }

    // Step 4: Search for matching found items
    let matches: PublicPost[] = []
    try {
      const searchResults = await searchApiService.searchItems({
        query: searchQuery,
        limit: 10,
        lastSeenDate: null,
        category: null,
        locationLastSeen: null
      })
      matches = searchResults as PublicPost[]
    } catch (searchError) {
      console.error('Background search error:', searchError)
      return
    }
    console.log(`Found ${matches.length} potential matches for post ${postId}`)

    // Step 5: Send notification to poster if matches found
    if (matches.length > 0) {
      try {
        const matchedPostIds = matches.map(match => match.post_id)
        const notificationBody = `We found ${matches.length} similar ${
          matches.length === 1 ? 'item' : 'items'
        } that might match your post.`

        await notificationApiService.sendNotification({
          user_id: posterId,
          title: 'Found Similar Items',
          body: notificationBody,
          type: 'match',
          data: {
            postId: String(postId),
            matched_post_ids: JSON.stringify(matchedPostIds),
            link: `/user/matches/`
          }
        })

        console.log(
          `Notification sent to poster ${posterId} with ${matchedPostIds.length} matches`
        )
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError)
      }
    }
  } catch (error: any) {
    console.error('Background match generation error:', error)
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
    // Fetch staff data for audit log
    let staffData = null
    try {
      const userData = await api.users.get(staffId)
      staffData = { user_name: userData.user_name }
    } catch (error) {
      console.error('Failed to fetch staff data for audit log:', error)
    }

    // Step 1: Create audit log
    const { insertAuditLog } = useAuditLogs()
    await insertAuditLog({
      user_id: staffId,
      action_type: 'post_deleted',
      details: {
        message: `${
          staffData?.user_name || 'Staff'
        } deleted the post ${itemName}`,
        post_id: postId,
        reason,
        deleted_at: new Date().toISOString()
      }
    })

    // Step 2: Hard delete the post
    const deleteResult = await postApiService.deletePost(parseInt(postId))

    if (!deleteResult.success) {
      console.error('Delete error')
      return {
        success: false,
        error: 'Failed to delete post'
      }
    }

    // Step 3: Send notification to poster
    try {
      await notificationApiService.sendNotification({
        user_id: posterId,
        title: 'Post Deleted',
        body: `Your missing item post "${itemName}" has been deleted. Reason: ${reason}`,
        type: 'post_deleted',
        data: {
          postId: postId,
          reason,
          item_name: itemName
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
    const updateResult = await postApiService.updatePostStatus(
      parseInt(postId),
      'rejected',
      reason
    )

    if (!updateResult.success) {
      console.error('Reject error')
      return {
        success: false,
        error: 'Failed to reject post'
      }
    }

    // Fetch staff data for audit log
    let staffData = null
    try {
      const userData = await api.users.get(staffId)
      staffData = { user_name: userData.user_name }
    } catch (error) {
      console.error('Failed to fetch staff data for audit log:', error)
    }

    // Step 2: Create audit log
    const { insertAuditLog } = useAuditLogs()
    await insertAuditLog({
      user_id: staffId,
      action_type: 'post_rejected',
      details: {
        message: `${
          staffData?.user_name || 'Staff'
        } rejected the post ${itemName}`,
        post_id: postId,
        reason,
        rejected_at: new Date().toISOString()
      }
    })

    // Step 3: Send notification to poster
    try {
      await notificationApiService.sendNotification({
        user_id: posterId,
        title: 'Post Rejected',
        body: `Your found item post "${itemName}" has been rejected. Reason: ${reason}`,
        type: 'post_rejected',
        data: {
          postId: postId,
          reason,
          item_name: itemName
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
  itemDescription: string,
  itemImageUrl: string | null,
  staffId: string
): Promise<HandlerResult> {
  try {
    // Step 1: Update post status to accepted
    const updateResult = await postApiService.updatePostStatus(
      parseInt(postId),
      'accepted'
    )

    if (!updateResult.success) {
      console.error('Accept error')
      return {
        success: false,
        error: 'Failed to accept post'
      }
    }

    // Step 2: Update staff assignment
    const staffResult = await postApiService.updateStaffAssignment(
      parseInt(postId),
      staffId
    )

    if (!staffResult.success) {
      console.error('Failed to update staff assignment')
    }

    // Fetch staff data for audit log
    let staffData = null
    try {
      const userData = await api.users.get(staffId)
      staffData = { user_name: userData.user_name }
    } catch (error) {
      console.error('Failed to fetch staff data for audit log:', error)
    }

    // Step 2: Create audit log
    const { insertAuditLog } = useAuditLogs()
    await insertAuditLog({
      user_id: staffId,
      action_type: 'post_accepted',
      details: {
        message: `${
          staffData?.user_name || 'Staff'
        } accepted the post ${itemName}`,
        postTitle: itemName,
        post_id: postId,
        accepted_at: new Date().toISOString()
      }
    })

    // Step 3: Send notification to poster
    try {
      await notificationApiService.sendNotification({
        user_id: posterId,
        title: 'Post Accepted',
        body: `Your found item post "${itemName}" has been accepted and is now visible to users.`,
        type: 'accept',
        data: {
          postId: postId,
          item_name: itemName
        }
      })
    } catch (notifError) {
      console.error('Failed to send notification:', notifError)
    }

    // Step 4: Generate metadata in background (non-blocking)
    if (itemImageUrl) {
      generateItemMetadataInBackground(
        postId,
        itemName,
        itemDescription,
        itemImageUrl
      )
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

/**
 * Generate metadata for accepted post in background (non-blocking)
 * Updates item_table via post_table.item_id relationship
 */
async function generateItemMetadataInBackground (
  postId: string,
  itemName: string,
  itemDescription: string,
  itemImageUrl: string
): Promise<void> {
  try {
    console.log(`Generating metadata for post ${postId}...`)

    // Step 1: Get the full post data including item_id
    let itemId: string
    try {
      const postData = await postApiService.getFullPost(parseInt(postId))
      if (!postData.item_id) {
        console.error(`Post ${postId} has no item_id`)
        return
      }
      itemId = postData.item_id
    } catch (error) {
      console.error(`Failed to get post data for post ${postId}:`, error)
      return
    }

    // Step 2: Check if item already has metadata
    let itemData: any
    try {
      itemData = await api.items.get(itemId)
    } catch (error) {
      console.error(`Failed to check item metadata for item ${itemId}:`, error)
      return
    }

    // Skip if metadata already exists
    if (itemData?.item_metadata) {
      console.log(`Item ${itemId} already has metadata, skipping generation`)
      return
    }

    // Step 3: Fetch image and convert to base64
    const response = await fetch(itemImageUrl)
    if (!response.ok) {
      console.error(`Failed to fetch image from ${itemImageUrl}`)
      return
    }
    const blob = await response.blob()

    // Convert blob to base64
    const reader = new FileReader()
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const base64Image = await base64Promise

    // Step 4: Generate metadata
    const result = await generateItemMetadata({
      itemName,
      itemDescription,
      image: base64Image
    })

    if (result.success && result.metadata) {
      // Step 5: Update item_table with generated metadata
      try {
        await itemApiService.updateMetadata(itemId, result.metadata)
        console.log(
          `Metadata successfully generated for item ${itemId} (post ${postId})`
        )
      } catch (updateError) {
        console.error(
          `Failed to update metadata for item ${itemId}:`,
          updateError
        )
      }
    } else {
      console.error(
        `Failed to generate metadata for post ${postId}:`,
        result.error
      )
    }
  } catch (error: any) {
    console.error(
      `Background metadata generation error for post ${postId}:`,
      error
    )
  }
}
