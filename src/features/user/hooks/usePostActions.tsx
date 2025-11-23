import { useUser } from '@/features/auth/contexts/UserContext'
import {
  postServices,
  type CreatePostInput,
  type EditPostInput
} from '../services/postServices'
import useNotifications from './useNotifications'
import { supabase } from '@/shared/lib/supabase'

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
      sendNotification({
        title: 'Report Received',
        message: `We've received your ${postData.item.type} report for "${postData.item.title}" and we'll be reviewing it shortly.`,
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
      return { success: false, error: 'User not authenticated' }
    }

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

  /**
   * Delete a post and its orphaned item using the delete_post_by_id RPC
   */
  const deletePost = async (postId: string, itemName: string) => {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      const { data, error } = await supabase.rpc('delete_post_by_id', {
        p_post_id: parseInt(postId)
      })

      if (error) {
        console.error('Error deleting post:', error)
        return { success: false, error: error.message }
      }

      if (!data || data.length === 0 || !data[0].out_deleted) {
        return {
          success: false,
          error: 'Post not found or could not be deleted'
        }
      }

      const result = data[0]

      // Send notification
      sendNotification({
        title: 'Post Deleted',
        message: `Your post about "${itemName}" has been successfully deleted.`,
        type: 'info',
        userId: user.user_id,
        data: {
          postId: String(postId),
          itemName
        }
      })

      return {
        success: true,
        postDeleted: result.out_deleted,
        itemDeleted: result.out_item_deleted,
        itemId: result.out_item_id
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
