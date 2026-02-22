import { postApiService, fraudReportApiService, itemApiService } from '@/shared/services'
import api from '@/shared/lib/api'
import { makeDisplay } from '@/shared/utils/imageUtils'
import { uploadAndGetPublicUrl } from '@/shared/utils/supabaseStorageUtils'
import { generateItemMetadata } from '@/shared/lib/geminiApi'

// Note: makeDisplay and uploadAndGetPublicUrl are still used by reportPost

// Post type enum
export type PostType = 'missing' | 'found'
export type PostCategory =
  | 'Electronics'
  | 'Accessories'
  | 'Documents'
  | 'Clothing'
  | 'Keys'
  | 'Other'

// Post interface matching Supabase schema
export interface Post {
  post_id: string
  user_id: string
  item_name: string
  description: string | null
  category: PostCategory
  type: PostType
  location_last_seen: string | null
  date_last_seen: string | null
  image_urls: string[] | null
  created_at: string
  updated_at: string
}

// Create Post input type (omit auto-generated fields)
export interface CreatePostInput {
  anonymous: boolean
  item: {
    title: string
    desc: string
    type: PostType
  }
  // Required: selected category from UI
  category: PostCategory
  lastSeenISO: string
  locationDetails: {
    level1: string
    level2: string
    level3: string
  }
  imageName: string
  image: File
}

// Edit Post input type (similar to CreatePostInput but includes post_id)
export interface EditPostInput {
  postId: string
  anonymous: boolean
  item: {
    title: string
    desc: string
    type: PostType
  }
  category: PostCategory
  lastSeenISO: string
  locationDetails: {
    level1: string
    level2: string
    level3: string
  }
  imageName: string
  image: File
}

// Update Post input type (all fields optional except post_id)
export interface UpdatePostInput {
  post_id: string
  item_name?: string
  description?: string
  category?: PostCategory
  type?: PostType
  location_last_seen?: string
  date_last_seen?: string
  image_urls?: string[]
}

// Response types
interface PostResponse {
  post: Post | null
  error: string | null
}

// interface PostsResponse {
//   posts: Post[] | null
//   error: string | null
// }

// ============================================
// Rate Limiting for Metadata Generation
// ============================================
const MAX_METADATA_REQUESTS_PER_MINUTE = Number(
  import.meta.env.VITE_MAX_METADATA_REQUESTS_PER_MINUTE
) // Gemini free tier limit
const metadataRequestQueue: number[] = [] // Timestamps of recent requests

/**
 * Check if we can make a metadata generation request without hitting rate limit
 * Removes timestamps older than 1 minute from the queue
 */
function canMakeMetadataRequest (): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60000

  // Remove old timestamps
  while (
    metadataRequestQueue.length > 0 &&
    metadataRequestQueue[0] < oneMinuteAgo
  ) {
    metadataRequestQueue.shift()
  }

  return metadataRequestQueue.length < MAX_METADATA_REQUESTS_PER_MINUTE
}

/**
 * Record a metadata generation request
 */
function recordMetadataRequest (): void {
  metadataRequestQueue.push(Date.now())
}

/**
 * Get time until next request slot is available (in seconds)
 */
function getTimeUntilNextSlot (): number {
  if (canMakeMetadataRequest()) return 0

  const oldestRequest = metadataRequestQueue[0]
  const oneMinuteFromOldest = oldestRequest + 60000
  const timeUntilSlot = Math.ceil((oneMinuteFromOldest - Date.now()) / 1000)

  return Math.max(0, timeUntilSlot)
}

/**
 * Generate item metadata with retry logic (exponential backoff)
 * Used when post is accepted by admin
 */
async function generateItemMetadataWithRetry (
  itemId: string,
  itemName: string,
  itemDescription: string,
  imageUrl: string,
  maxRetries = 5
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Metadata] Attempt ${attempt}/${maxRetries} for item:`,
        itemId
      )

      // Fetch image from Supabase URL
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
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

      // Call Gemini AI to generate metadata
      const metadataResult = await generateItemMetadata({
        itemName,
        itemDescription,
        image: base64Image
      })

      if (metadataResult.success && metadataResult.metadata) {
        // Update item with generated metadata
        try {
          await itemApiService.updateMetadata(itemId, metadataResult.metadata)
          console.log(
            '[Metadata] ✅ Successfully added metadata for item:',
            itemId
          )
          return { success: true }
        } catch (error) {
          console.error('[Metadata] Failed to update item:', error)
          throw error
        }
      } else {
        throw new Error(metadataResult.error || 'Metadata generation failed')
      }
    } catch (error) {
      console.error(`[Metadata] Attempt ${attempt} failed:`, error)

      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        const delay = Math.pow(2, attempt) * 1000
        console.log(`[Metadata] Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  const errorMsg = `Failed to generate metadata after ${maxRetries} attempts`
  console.error('[Metadata] ❌', errorMsg)
  return { success: false, error: errorMsg }
}

export const postServices = {
  /**
   * Create a new post
   * @param userId - The ID of the user creating the post
   * @param postData - The post data to create
   * @returns The created post or error
   */
  createPost: async (
    userId: string,
    postData: CreatePostInput
  ): Promise<PostResponse> => {
    try {
      console.log('[postServices] Creating post:', postData)

      const result = await postApiService.createPost({
        userId,
        item: postData.item,
        category: postData.category,
        lastSeenISO: postData.lastSeenISO,
        locationDetails: postData.locationDetails,
        imageName: `${Date.now()}.webp`,
        image: postData.image,
        anonymous: postData.anonymous
      })

      console.log('[postServices] Post created successfully:', result.post_id)

      return { post: { post_id: String(result.post_id) } as Post, error: null }
    } catch (error: any) {
      console.error('[postServices] Exception creating post:', error)

      // Check for duplicate post error
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        return {
          post: null,
          error: 'A post with the same details (item, location, and time) already exists. Please check your recent posts or modify the details.'
        }
      }

      return { post: null, error: error.message || 'Failed to create post' }
    }
  },

  /**
   * Edit an existing post with image replacement
   * @param userId - The ID of the user editing the post
   * @param postData - The post data to update including the new image
   * @returns The updated post or error
   */
  editPost: async (
    userId: string,
    postData: EditPostInput
  ): Promise<PostResponse> => {
    try {
      console.log('[postServices] Editing post:', postData)

      const result = await postApiService.editWithImage({
        postId: Number(postData.postId),
        userId,
        item: postData.item,
        category: postData.category,
        lastSeenISO: postData.lastSeenISO,
        locationDetails: postData.locationDetails,
        anonymous: postData.anonymous,
        image: postData.image
      })

      console.log('[postServices] Post edited successfully:', result.post_id)

      return { post: { post_id: String(result.post_id) } as Post, error: null }
    } catch (error: any) {
      console.error('[postServices] Exception editing post:', error)
      return { post: null, error: error.message || 'Failed to edit post' }
    }
  },

  reportPost: async (
    postId: string | number,
    reason: string,
    userId: string | null,
    proofImage?: File | null,
    claimerName?: string | null,
    claimerEmail?: string | null,
    claimerContact?: string | null,
    claimedAt?: string | null,
    claimProcessedByStaffId?: string | null,
    claimId?: string | null
  ): Promise<{
    success: boolean
    error: string | null
    report?: { report_id: string; report_status: string }
  }> => {
    try {
      // First, check if the item status is 'claimed'
      let postData: any
      try {
        postData = await postApiService.getPost(Number(postId))
      } catch (error) {
        console.error('[postServices] Error fetching post:', error)
        return { success: false, error: 'Failed to verify post status' }
      }

      if (!postData || postData.item_status !== 'claimed') {
        return {
          success: false,
          error:
            'This item is not claimed. Please reload the page and try again.'
        }
      }

      let proofUrl: string | null = null

      if (proofImage) {
        // create a display-optimized image and upload
        const displayBlob = await makeDisplay(proofImage)
        const path = `reports/${postId}/${Date.now()}.webp`
        proofUrl = await uploadAndGetPublicUrl(path, displayBlob, 'image/webp')
      }

      const result = await fraudReportApiService.createReport({
        post_id: Number(postId),
        reason: reason,
        proof_image_url: proofUrl,
        claimer_name: claimerName,
        claimer_school_email: claimerEmail,
        claimer_contact_num: claimerContact,
        claimed_at: claimedAt,
        claim_processed_by_staff_id: claimProcessedByStaffId,
        claim_id: claimId,
        reported_by: userId
      })

      console.log(result)

      if (!result) {
        return { success: false, error: 'No report returned from API' }
      }

      return {
        success: true,
        error: null,
        report: { report_id: result.report_id, report_status: 'pending' }
      }
    } catch (err) {
      console.error('[postServices] Exception reporting post:', err)
      return { success: false, error: 'Failed to report post' }
    }
  },

  /**
   * Generate metadata for an accepted post (called from acceptPost)
   * This is a non-blocking operation that happens after post acceptance
   * Rate limited to 10 requests per minute (Gemini free tier)
   * @param postId - The ID of the post
   * @returns Success boolean and optional error
   */
  generateMetadataForAcceptedPost: async (
    postId: string
  ): Promise<{ success: boolean; error: string | null; queued?: boolean }> => {
    try {
      // Fetch post and item details
      let postData: any
      try {
        postData = await postApiService.getFullPost(Number(postId))
      } catch (error) {
        console.error('[Metadata] Failed to fetch post:', error)
        return { success: false, error: 'Post not found' }
      }

      let itemData: any
      try {
        itemData = await api.items.get(postData.item_id)
      } catch (error) {
        console.error('[Metadata] Failed to fetch item:', error)
        return { success: false, error: 'Item not found' }
      }

      // Get image link from item data
      const imageUrl = { image_link: itemData.image_link }

      if (!imageUrl.image_link) {
        console.error('[Metadata] Item image link not found')
        return { success: false, error: 'Item image not found' }
      }

      // Check if metadata already exists
      if (itemData.item_metadata) {
        console.log(
          '[Metadata] Metadata already exists for item:',
          itemData.item_id
        )
        return { success: true, error: null }
      }

      // Check rate limit before making request
      if (!canMakeMetadataRequest()) {
        const waitTime = getTimeUntilNextSlot()
        console.warn(
          `[Metadata] Rate limit reached. Item ${itemData.item_id} queued. Will be picked up by cron job or retry in ${waitTime}s`
        )
        return {
          success: true,
          error: null,
          queued: true
        }
      }

      // Record this request
      recordMetadataRequest()

      // Generate metadata in background (non-blocking)
      generateItemMetadataWithRetry(
        itemData.item_id,
        itemData.item_name,
        itemData.item_description,
        imageUrl.image_link
      ).then(result => {
        if (result.success) {
          console.log(
            '[Metadata] ✅ Background generation completed for:',
            itemData.item_id
          )
        } else {
          console.error(
            '[Metadata] ❌ Background generation failed:',
            result.error,
            '(will be retried by cron job)'
          )
        }
      })

      return { success: true, error: null }
    } catch (err) {
      console.error(
        '[Metadata] Exception in generateMetadataForAcceptedPost:',
        err
      )
      return { success: false, error: 'Failed to initiate metadata generation' }
    }
  },

  /**
   * Update post status (accepted, rejected, pending)
   * @param postId - The ID of the post to update
   * @param status - The new status for the post
   * @returns Success boolean and optional error
   */
  updatePostStatus: async (
    postId: string,
    status: 'accepted' | 'rejected' | 'pending'
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const result = await postApiService.updatePostStatus(
        Number(postId),
        status
      )

      if (!result.success) {
        console.error('[postServices] Error updating post status')
        return { success: false, error: 'Failed to update post status' }
      }

      console.log('[postServices] Post status updated successfully:', postId)
      return { success: true, error: null }
    } catch (err) {
      console.error('[postServices] Exception updating post status:', err)
      return { success: false, error: 'Failed to update post status' }
    }
  }

  /**
   * Get a single post by ID
   * @param postId - The ID of the post to retrieve
   * @returns The post or error
   */
  // getPost: async (postId: string): Promise<PostResponse> => {
  //   // TODO: Implement
  //   throw new Error('Not implemented')
  // },

  /**
   * Get all posts with optional filters
   * @param filters - Optional filters for posts (type, category, userId)
   * @returns Array of posts or error
   */
  // getPosts: async (filters?: {
  //   type?: PostType
  //   category?: PostCategory
  //   userId?: string
  //   limit?: number
  //   offset?: number
  // }): Promise<PostsResponse> => {
  //   // TODO: Implement
  //   throw new Error('Not implemented')
  // },

  /**
   * Update an existing post
   * @param updateData - The post data to update (must include post_id)
   * @returns The updated post or error
   */
  // updatePost: async (updateData: UpdatePostInput): Promise<PostResponse> => {
  //   // TODO: Implement
  //   throw new Error('Not implemented')
  // },

  /**
   * Delete a post by ID
   * @param postId - The ID of the post to delete
   * @returns Success type or error
   */
  // deletePost: async (
  //   postId: string
  // ): Promise<{ success: boolean; error: string | null }> => {
  //   // TODO: Implement
  //   throw new Error('Not implemented')
  // },

  /**
   * Get posts by user ID
   * @param userId - The ID of the user
   * @returns Array of user's posts or error
   */
  // getUserPosts: async (userId: string): Promise<PostsResponse> => {
  //   // TODO: Implement
  //   throw new Error('Not implemented')
  // },

  /**
   * Search posts by item name or description
   * @param searchTerm - The search term
   * @param filters - Optional additional filters
   * @returns Array of matching posts or error
   */
  // searchPosts: async (
  //   searchTerm: string,
  //   filters?: {
  //     type?: PostType
  //     category?: PostCategory
  //     limit?: number
  //   }
  // ): Promise<PostsResponse> => {
  //   // TODO: Implement
  //   throw new Error('Not implemented')
  // }
}
