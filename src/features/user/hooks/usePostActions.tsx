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

    // Check if user has already reported this post
    const { count: duplicateSelfCount, error: duplicateSelfError } =
      await supabase
        .from('fraud_reports_table')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('reported_by', user.user_id)
        .in('report_status', ['open', 'under_review'])

    if (duplicateSelfError) {
      console.error('Error checking duplicate self report:', duplicateSelfError)
    }

    // Check if others have reported with same concern
    const { count: duplicateOthersCount, error: duplicateOthersError } =
      await supabase
        .from('fraud_reports_table')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .ilike('reason_for_reporting', `%${concern}%`)
        .in('report_status', ['open', 'under_review'])

    if (duplicateOthersError) {
      console.error(
        'Error checking duplicate others report:',
        duplicateOthersError
      )
    }

    const hasDuplicateSelf = (duplicateSelfCount ?? 0) > 0
    const hasDuplicateOthers = (duplicateOthersCount ?? 0) > 0

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
        type: 'delete',
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
