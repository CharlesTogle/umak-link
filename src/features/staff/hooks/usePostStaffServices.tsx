import { postApiService, itemApiService } from '@/shared/services'
import api from '@/shared/lib/api'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import { useUser } from '@/features/auth/contexts/UserContext'
import useNotifications from '@/features/user/hooks/useNotifications'
import { generateItemMetadata } from '@/shared/lib/geminiApi'

export interface CreateStaffPostInput {
  item: {
    title: string
    desc: string
    type: 'found' | 'lost'
  }
  category: string
  lastSeenISO: string
  locationDetails: {
    level1: string
    level2: string
    level3: string
  }
  image: File
  anonymous: boolean
}

interface PostResponse {
  post: any | null
  error: string | null
}

export function usePostActionsStaffServices () {
  const { insertAuditLog } = useAuditLogs()
  const { user, getUser, setUser } = useUser()
  const { sendNotification } = useNotifications()

  /**
   * Create a new post as staff with auto-accepted status
   * @param postData - The post data
   * @returns PostResponse with post data or error
   */
  const createPost = async (
    postData: CreateStaffPostInput
  ): Promise<PostResponse> => {
    try {
      let currentUser = user

      if (!user) {
        currentUser = await getUser()
        setUser(currentUser)
      }

      if (!currentUser?.user_id) {
        return { post: null, error: 'User not authenticated' }
      }

      console.log('[staffPostServices] Creating post:', postData)

      // Create post via API (handles image upload, hashing, and post creation)
      const result = await postApiService.createPost({
        userId: currentUser.user_id,
        item: postData.item,
        category: postData.category,
        lastSeenISO: postData.lastSeenISO,
        locationDetails: postData.locationDetails,
        imageName: `${Date.now()}.webp`,
        image: postData.image,
        anonymous: postData.anonymous
      })

      const postId = result.post_id
      console.log('[staffPostServices] Post created successfully:', postId)

      // Log the action
      await insertAuditLog({
        user_id: currentUser.user_id,
        action_type: 'create_post',
        details: {
          action: 'Create Post',
          post_id: postId,
          poster_id: currentUser.user_id,
          item_name: postData.item.title,
          item_type: postData.item.type,
          post_status: 'accepted'
        }
      })

      // Note: Metadata generation is now handled by the backend

      return { post: { post_id: postId }, error: null }
    } catch (error) {
      console.error('[staffPostServices] Exception creating post:', error)
      return { post: null, error: 'Failed to create post' }
    }
  }

  /**
   * Generate metadata for staff-created post in background (non-blocking)
   * Updates item_table via post_table.item_id relationship
   */
  async function generateItemMetadataInBackground (
    postId: number,
    itemName: string,
    itemDescription: string,
    itemImageUrl: string
  ): Promise<void> {
    try {
      console.log(
        `[staffPostServices] Generating metadata for post ${postId}...`
      )

      // Step 1: Get the full post data including item_id
      let itemId: string
      try {
        const postData = await postApiService.getFullPost(postId)
        if (!postData.item_id) {
          console.error(`[staffPostServices] Post ${postId} has no item_id`)
          return
        }
        itemId = postData.item_id
      } catch (error) {
        console.error(
          `[staffPostServices] Failed to get post data for post ${postId}:`,
          error
        )
        return
      }

      // Step 2: Check if item already has metadata
      let itemData: any
      try {
        itemData = await api.items.get(itemId)
      } catch (error) {
        console.error(
          `[staffPostServices] Failed to check item metadata for item ${itemId}:`,
          error
        )
        return
      }

      // Skip if metadata already exists
      if (itemData?.item_metadata) {
        console.log(
          `[staffPostServices] Item ${itemId} already has metadata, skipping generation`
        )
        return
      }

      // Step 3: Generate metadata using AI and update via API
      try {
        // Fetch image and convert to base64
        const response = await fetch(itemImageUrl)
        if (!response.ok) {
          console.error(`[staffPostServices] Failed to fetch image from ${itemImageUrl}`)
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

        // Generate metadata using AI
        const result = await generateItemMetadata({
          itemName,
          itemDescription,
          image: base64Image
        })

        if (result.success && result.metadata) {
          // Update item metadata via API
          await itemApiService.updateMetadata(itemId, result.metadata)
          console.log(
            `[staffPostServices] Metadata successfully generated for item ${itemId} (post ${postId})`
          )
        } else {
          console.error(
            `[staffPostServices] Metadata generation failed for post ${postId}:`,
            result.error
          )
        }
      } catch (metadataError: any) {
        console.error(
          `[staffPostServices] Metadata generation failed for post ${postId}:`,
          metadataError
        )
      }
    } catch (error: any) {
      console.error(
        `[staffPostServices] Background metadata generation error for post ${postId}:`,
        error
      )
    }
  }

  /**
   * Change the status of a post (accepted/rejected/pending)
   * @param postId - The ID of the post
   * @param newStatus - The new status for the post
   * @returns True if successful, false otherwise
   */
  const changePostStatus = async (
    postId: string,
    newStatus: 'accepted' | 'rejected' | 'pending'
  ): Promise<boolean> => {
    try {
      let currentUser = user

      if (!user) {
        currentUser = await getUser()
        setUser(currentUser)
      }

      // Fetch post and item details before update
      let postData: any
      let itemData: any
      try {
        postData = await postApiService.getFullPost(parseInt(postId))
        itemData = await api.items.get(postData.item_id)
      } catch (error) {
        console.error('Error fetching post/item data:', error)
        return false
      }

      const oldStatus = postData?.status
      const itemName = itemData?.item_name || 'Unknown Item'

      // Update post status via API
      const updateResult = await postApiService.updatePostStatus(
        parseInt(postId),
        newStatus
      )

      if (!updateResult.success) {
        console.error('Error changing post status')
        return false
      }

      // Log the action with correct structure
      await insertAuditLog({
        user_id: currentUser?.user_id || 'unknown',
        action_type: 'post_status_updated',
        details: {
          message: `${
            currentUser?.user_name || 'Staff'
          } set the status of ${itemName} as ${
            newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
          }`,
          post_title: itemName,
          old_status: oldStatus,
          new_status: newStatus
        }
      })

      return true
    } catch (error) {
      console.error('Exception changing post status:', error)
      return false
    }
  }

  /**
   * Update post status with notification and optional rejection reason
   * @param postId - The ID of the post
   * @param newStatus - The new status (accepted/rejected/pending)
   * @param rejectionReason - Optional rejection reason (required for rejected status)
   * @returns Object with success status and optional error
   */
  const updatePostStatusWithNotification = async (
    postId: string,
    newStatus: 'accepted' | 'rejected' | 'pending',
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Fetch post details including poster info before status change
      let postData: any
      let itemData: any
      try {
        postData = await postApiService.getFullPost(parseInt(postId))
        itemData = await api.items.get(postData.item_id)
      } catch (error) {
        console.error('Error fetching post/item data:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data'
        }
      }

      const itemName = itemData?.item_name || 'Unknown Item'
      const posterId = postData?.poster_id

      // Use changePostStatus to update the status (handles audit log)
      const success = await changePostStatus(postId, newStatus)

      if (!success) {
        return { success: false, error: 'Failed to update post status' }
      }

      // Update with rejection reason if status is rejected (handled by API)
      if (newStatus === 'rejected' && rejectionReason) {
        const updateResult = await postApiService.updatePostStatus(
          parseInt(postId),
          newStatus,
          rejectionReason
        )

        if (!updateResult.success) {
          console.error('Error updating rejection reason')
          return { success: false, error: 'Failed to update rejection reason' }
        }
      }

      // Send notification to poster
      if (posterId) {
        let notificationMessage = ''
        let notificationType: 'post_accepted' | 'rejection' | 'info' = 'info'

        if (newStatus === 'accepted') {
          notificationMessage = `Your post about "${itemName}" has been accepted and is now visible on the platform.`
          notificationType = 'post_accepted'
        } else if (newStatus === 'rejected') {
          notificationMessage = `Your post about "${itemName}" has been rejected and will not be published on the platform.${
            rejectionReason ? ` Reason: ${rejectionReason}` : ''
          }`
          notificationType = 'rejection'
        } else {
          notificationMessage = `The status of your post "${itemName}" has been changed to pending.`
        }

        await sendNotification({
          userId: posterId,
          title:
            newStatus === 'accepted'
              ? 'Post Accepted'
              : newStatus === 'rejected'
              ? 'Post Rejected'
              : 'Post Status Updated',
          message: notificationMessage,
          type: notificationType,
          data: {
            postId,
            itemName,
            link: `/user/post/history/view/${postId}`,
            status: newStatus,
            rejection_reason: rejectionReason || null
          }
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Exception updating post status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update item status with optional notification for discarded items
   * @param postId - The ID of the post
   * @param newItemStatus - The new item status (claimed/unclaimed/lost/returned/discarded)
   * @returns Object with success status and optional error
   */
  const updateItemStatus = async (
    postId: string,
    newItemStatus: 'claimed' | 'unclaimed' | 'lost' | 'returned' | 'discarded'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      let currentUser = user

      if (!user) {
        currentUser = await getUser()
        setUser(currentUser)
      }

      // Fetch post and item details
      let postData: any
      let itemData: any
      try {
        postData = await postApiService.getFullPost(parseInt(postId))
        itemData = await api.items.get(postData.item_id)
      } catch (error) {
        console.error('Error fetching post/item data:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data'
        }
      }

      const itemId = postData?.item_id
      const posterId = postData?.poster_id

      if (!itemId) {
        return { success: false, error: 'Item ID not found' }
      }

      const oldStatus = itemData?.status
      const itemName = itemData?.item_name || 'Unknown Item'

      // Update item status via API
      const updateResult = await postApiService.updateItemStatus(
        itemId,
        newItemStatus
      )

      if (!updateResult.success) {
        console.error('Error updating item status')
        return { success: false, error: 'Failed to update item status' }
      }

      // Log the action
      await insertAuditLog({
        user_id: currentUser?.user_id || 'unknown',
        action_type: 'item_status_updated',
        details: {
          message: `${
            currentUser?.user_name || 'Staff'
          } changed item status of ${itemName} from ${oldStatus} to ${newItemStatus}`,
          item_id: itemId,
          post_id: postId,
          old_status: oldStatus,
          new_status: newItemStatus
        }
      })

      // Send notification only if item is discarded
      if (newItemStatus === 'discarded' && posterId) {
        await sendNotification({
          userId: posterId,
          title: 'Item Discarded',
          message: `The item "${itemName}" has been discarded and is no longer available for claim.`,
          type: 'info',
          data: {
            postId,
            itemName,
            link: `/user/post/history/view/${postId}`,
            itemStatus: newItemStatus
          }
        })
      }

      // Send notification if item was discarded and now unclaimed (retrieved)
      if (
        oldStatus === 'discarded' &&
        newItemStatus === 'unclaimed' &&
        posterId
      ) {
        await sendNotification({
          userId: posterId,
          title: 'Item Retrieved',
          message: `Great news! The item "${itemName}" that was previously discarded has been retrieved and is now ready to be claimed again.`,
          type: 'info',
          data: {
            postId,
            itemName,
            link: `/user/post/history/view/${postId}`,
            itemStatus: newItemStatus
          }
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Exception updating item status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  return {
    createPost,
    changePostStatus,
    updatePostStatusWithNotification,
    updateItemStatus
  }
}
