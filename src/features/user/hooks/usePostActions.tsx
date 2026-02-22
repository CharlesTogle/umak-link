import { useUser } from '@/features/auth/contexts/UserContext'
import {
  postServices,
  type CreatePostInput,
  type EditPostInput
} from '../services/postServices'
import useNotifications from './useNotifications'
import { postApiService, fraudReportApiService } from '@/shared/services'

/**
 * Hook to access post services with automatic user context injection.
 * Wraps postServices to provide a cleaner API for components.
 */
export function usePostActions () {
  const { getUser } = useUser()
  const { sendNotification } = useNotifications()

  /**
   * Create a new post for the current user
   */
  const createPost = async (postData: CreatePostInput) => {
    const user = await getUser()
    if (!user) {
      return { post: null, error: 'User not authenticated' }
    }

    const result = await postServices.createPost(user.user_id, postData)

    if (result.post && !result.error) {
      // The RPC may return a custom table with out_* fields. Support both shapes.
      const p: any = result.post

      // If RPC returned an array wrapper, normalize to first element
      const first = Array.isArray(p) && p.length > 0 ? p[0] : p

      const createdPostId =
        (first && (first.post_id || first.out_post_id)) == null
          ? undefined
          : String(first.post_id ?? first.out_post_id)

      const createdItemId =
        (first && (first.item_id || first.out_item_id)) == null
          ? undefined
          : String(first.item_id ?? first.out_item_id)

      const link = createdPostId
        ? `/user/post/history/view/${createdPostId}`
        : undefined

      sendNotification({
        title: 'Report Received',
        message: `We've received your ${postData.item.type} report for "${postData.item.title}" and we'll be reviewing it shortly.`,
        type: 'info',
        userId: user.user_id,
        data: {
          ...(createdPostId ? { postId: createdPostId } : {}),
          ...(createdItemId ? { itemId: createdItemId } : {}),
          ...(link ? { link } : {})
        }
      })
    }

    return result
  }

  /**
   * Edit an existing post for the current user
   */
  const editPost = async (postData: EditPostInput) => {
    const user = await getUser()
    if (!user) {
      return { post: null, error: 'User not authenticated' }
    }

    const result = await postServices.editPost(user.user_id, postData)

    if (result.post && !result.error) {
      sendNotification({
        title: 'Post Updated',
        message: `Your ${postData.item.type} report for "${postData.item.title}" has been updated and will be reviewed again.`,
        type: 'info',
        userId: user.user_id,
        data: {
          postId: result.post.post_id,
          link: `/user/post/history/view/${result.post.post_id}`
        }
      })
    }

    return result
  }

  /**
   * Report a post as fraudulent
   */
  const reportPost = async ({
    postId,
    concern,
    additionalDetails,
    proofImage,
    claimerName,
    claimerEmail,
    claimerContact,
    claimedAt,
    claimProcessedByStaffId,
    claimId
  }: {
    postId: string | number
    concern: string
    additionalDetails?: string
    proofImage?: File | null
    claimerName?: string | null
    claimerEmail?: string | null
    claimerContact?: string | null
    claimedAt?: string | null
    claimProcessedByStaffId?: string | null
    claimId?: string | null
  }) => {
    const user = await getUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        hasDuplicateSelf: false,
        hasDuplicateOthers: false
      }
    }

    // Check for duplicate reports via backend API
    let hasDuplicateSelf = false
    let hasDuplicateOthers = false

    try {
      const duplicateCheck = await fraudReportApiService.checkDuplicates(
        postId,
        user.user_id,
        concern
      )
      hasDuplicateSelf = duplicateCheck.hasDuplicateSelf
      hasDuplicateOthers = duplicateCheck.hasDuplicateOthers
    } catch (err) {
      console.error('Error checking duplicate reports:', err)
    }

    // Return duplicate information for UI to handle
    return {
      hasDuplicateSelf,
      hasDuplicateOthers,
      submit: async () => {
        const reason = `Reason for reporting: ${concern} ${
          additionalDetails?.trim() !== ''
            ? `\n\n Additional details: ${additionalDetails}`
            : ''
        }`
        return await postServices.reportPost(
          postId,
          reason,
          user.user_id,
          proofImage,
          claimerName,
          claimerEmail,
          claimerContact,
          claimedAt,
          claimProcessedByStaffId,
          claimId
        )
      }
    }
  }

  /**
   * Delete a post and its orphaned item using the backend API
   */
  const deletePost = async (postId: string, itemName: string) => {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const result = await postApiService.deletePost(parseInt(postId))

      // Only send notification on successful deletion
      if (result.success) {
        sendNotification({
          title: 'Post Deleted',
          message: `Your post about "${itemName}" has been successfully deleted.`,
          type: 'delete',
          userId: user.user_id,
          data: {
            postId: String(postId),
            itemName
          }
        })
      }

      return {
        success: result.success
      }
    } catch (error) {
      console.error('Exception deleting post:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  return {
    createPost,
    editPost,
    reportPost,
    deletePost
  }
}
