import { supabase } from '@/shared/lib/supabase'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import { useUser } from '@/features/auth/contexts/UserContext'
import useNotifications from '@/features/user/hooks/useNotifications'
import { makeDisplay } from '@/shared/utils/imageUtils'
import { uploadAndGetPublicUrl } from '@/shared/utils/supabaseStorageUtils'
import { computeBlockHash64 } from '@/shared/utils/hashUtils'

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

      // 1) Compress image
      const displayBlob = await makeDisplay(postData.image)

      // 2) Generate paths
      const basePath = `posts/${currentUser.user_id}/${Date.now()}`
      const displayPath = `${basePath}.webp`

      const displayUrl = await uploadAndGetPublicUrl(
        displayPath,
        displayBlob,
        'image/webp'
      )

      // Parse lastSeenISO to extract date and time
      const lastSeenDate = new Date(postData.lastSeenISO)
      const lastSeenHours = lastSeenDate.getHours()
      const lastSeenMinutes = lastSeenDate.getMinutes()

      // Build location path array
      const locationPath: Array<{
        name: string
        type: 'level1' | 'level2' | 'level3'
      }> = []

      const level1 = postData.locationDetails.level1?.trim()
      if (level1) {
        locationPath.push({ name: level1, type: 'level1' })
      }

      const level2 = postData.locationDetails.level2?.trim()
      if (level2 && level2 !== 'Not Applicable') {
        locationPath.push({ name: level2, type: 'level2' })
      }

      const level3 = postData.locationDetails.level3?.trim()
      if (level3 && level3 !== 'Not Applicable') {
        locationPath.push({ name: level3, type: 'level3' })
      }

      const imageHash = await computeBlockHash64(postData.image)

      const { data, error } = await supabase.rpc(
        'create_post_with_item_date_time_location',
        {
          p_poster_id: currentUser.user_id,
          p_item_name: postData.item.title,
          p_item_description: postData.item.desc,
          p_item_type: postData.item.type,
          p_image_hash: imageHash,
          p_image_link: displayUrl,
          p_last_seen_date: lastSeenDate,
          p_last_seen_hours: lastSeenHours,
          p_last_seen_minutes: lastSeenMinutes,
          p_location_path: locationPath,
          p_item_status: postData.item.type === 'found' ? 'unclaimed' : 'lost',
          p_category: postData.category,
          p_post_status: 'accepted', // Staff posts are auto-accepted
          p_is_anonymous: postData.anonymous
        }
      )

      if (error) {
        console.error('[staffPostServices] Error creating post:', error)

        // Check for duplicate post constraint violation
        if (
          error.code === '23505' &&
          error.message?.includes('ux_post_unique_combination')
        ) {
          return {
            post: null,
            error:
              'A post with the same details (item, location, and time) already exists. Please check your recent posts or modify the details.'
          }
        }

        return { post: null, error: error.message }
      }

      console.log('[staffPostServices] Post created successfully:', data)

      // Extract post_id from RPC response (returns array with single object)
      const postId = data?.[0]?.out_post_id

      if (!postId) {
        console.error('[staffPostServices] No post_id returned from RPC:', data)
        return { post: null, error: 'Failed to get post_id' }
      }

      // Log the action
      await insertAuditLog({
        user_id: currentUser.user_id,
        action_type: 'Create Post',
        details: {
          action: 'Create Post',
          post_id: postId,
          poster_id: currentUser.user_id,
          item_name: postData.item.title,
          item_type: postData.item.type,
          post_status: 'accepted'
        }
      })

      // Generate metadata in background (non-blocking)
      if (displayUrl) {
        generateItemMetadataInBackground(
          postId,
          postData.item.title,
          postData.item.desc,
          displayUrl
        )
      }

      return { post: data, error: null }
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

      // Step 1: Get the item_id from post_table
      const { data: postData, error: postError } = await supabase
        .from('post_table')
        .select('item_id')
        .eq('post_id', postId)
        .single()

      if (postError || !postData?.item_id) {
        console.error(
          `[staffPostServices] Failed to get item_id for post ${postId}:`,
          postError
        )
        return
      }

      const itemId = postData.item_id

      // Step 2: Check if item already has metadata
      const { data: itemData, error: itemError } = await supabase
        .from('item_table')
        .select('item_metadata')
        .eq('item_id', itemId)
        .single()

      if (itemError) {
        console.error(
          `[staffPostServices] Failed to check item metadata for item ${itemId}:`,
          itemError
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

      // Step 3: Invoke edge function to generate metadata
      const { error: metadataError } = await supabase.functions.invoke(
        'generate-metadata',
        {
          body: {
            post_id: postId,
            image_url: itemImageUrl,
            item_name: itemName,
            item_description: itemDescription
          }
        }
      )

      if (metadataError) {
        console.error(
          `[staffPostServices] Metadata generation failed for post ${postId}:`,
          metadataError
        )
      } else {
        console.log(
          `[staffPostServices] Metadata successfully generated for item ${itemId} (post ${postId})`
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
      const { data: postData, error: postError } = await supabase
        .from('post_table')
        .select('item_id, status')
        .eq('post_id', postId)
        .single()

      if (postError) {
        console.error('Error fetching post data:', postError)
        return false
      }

      const { data: itemData, error: itemError } = await supabase
        .from('item_table')
        .select('item_name')
        .eq('item_id', postData?.item_id)
        .single()

      if (itemError) {
        console.error('Error fetching item name:', itemError)
      }

      const oldStatus = postData?.status
      const itemName = itemData?.item_name || 'Unknown Item'

      const { error } = await supabase
        .from('post_table')
        .update({ status: newStatus })
        .eq('post_id', postId)

      if (error) {
        console.error('Error changing post status:', error)
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
      const { data: postData, error: postError } = await supabase
        .from('post_table')
        .select('item_id, poster_id')
        .eq('post_id', postId)
        .single()

      if (postError) {
        console.error('Error fetching post data:', postError)
        return { success: false, error: postError.message }
      }

      const { data: itemData, error: itemError } = await supabase
        .from('item_table')
        .select('item_name')
        .eq('item_id', postData?.item_id)
        .single()

      if (itemError) {
        console.error('Error fetching item name:', itemError)
      }

      const itemName = itemData?.item_name || 'Unknown Item'
      const posterId = postData?.poster_id

      // Use changePostStatus to update the status (handles audit log)
      const success = await changePostStatus(postId, newStatus)

      if (!success) {
        return { success: false, error: 'Failed to update post status' }
      }

      // Add rejection reason if status is rejected
      if (newStatus === 'rejected' && rejectionReason) {
        const { error: reasonError } = await supabase
          .from('post_table')
          .update({ rejection_reason: rejectionReason })
          .eq('post_id', postId)

        if (reasonError) {
          console.error('Error updating rejection reason:', reasonError)
          return { success: false, error: reasonError.message }
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

  return {
    createPost,
    changePostStatus,
    updatePostStatusWithNotification
  }
}
