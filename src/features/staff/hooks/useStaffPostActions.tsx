import { useState } from 'react'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import { useUser } from '@/features/auth/contexts/UserContext'
import { usePostActionsStaffServices } from './usePostStaffServices'
import { postApiService, searchApiService } from '@/shared/services'

interface MatchResult {
  success: boolean
  matches: any[]
  missing_post?: any
  total_matches?: number
}

export function useStaffPostActions () {
  const { changePostStatus } = usePostActionsStaffServices()
  const { insertAuditLog } = useAuditLogs()
  const { user, getUser, setUser } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)

  /**
   * Accept a found item post
   */
  const acceptPost = async (postId: string): Promise<boolean> => {
    setIsProcessing(true)
    try {
      const success = await changePostStatus(postId, 'accepted')

      // Update the staff assignment using the API
      if (user?.user_id) {
        try {
          await postApiService.updateStaffAssignment(parseInt(postId), user.user_id)
        } catch (error) {
          console.error('Error updating accepted_by_staff_id:', error)
        }
      }

      if (success) {
        // Dispatch event for post status change
        window.dispatchEvent(
          new CustomEvent('post:statusChanged', {
            detail: { postId, newStatus: 'accepted' }
          })
        )
      }

      return success
    } catch (error) {
      console.error('Error accepting post:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Reject a found item post
   */
  const rejectPost = async (postId: string): Promise<boolean> => {
    setIsProcessing(true)
    try {
      const success = await changePostStatus(postId, 'rejected')

      if (success) {
        // Dispatch event for post status change
        window.dispatchEvent(
          new CustomEvent('post:statusChanged', {
            detail: { postId, newStatus: 'rejected' }
          })
        )
      }

      return success
    } catch (error) {
      console.error('Error rejecting post:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Hard delete a missing item post
   */
  const deletePost = async (postId: string): Promise<boolean> => {
    setIsProcessing(true)
    try {
      let currentUser = user

      if (!user) {
        currentUser = await getUser()
        setUser(currentUser)
      }

      // Get post details before deletion for audit log
      let postData: any = null
      try {
        postData = await postApiService.getFullPost(parseInt(postId))
      } catch (error) {
        console.error('Error fetching post details:', error)
      }

      // Log the action before deletion
      await insertAuditLog({
        user_id: currentUser?.user_id || 'unknown',
        action_type: 'Delete Post',
        details: {
          action: 'Delete Post',
          post_id: postId,
          item_id: postData?.item_id
        }
      })

      // Hard delete the post
      await postApiService.deletePost(parseInt(postId))

      // Dispatch event for post deletion
      window.dispatchEvent(
        new CustomEvent('post:deleted', {
          detail: { postId }
        })
      )

      return true
    } catch (error) {
      console.error('Exception deleting post:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Find potential matches for a missing item using API
   */
  const matchPost = async (postId: string): Promise<MatchResult> => {
    setIsProcessing(true)
    try {
      const result = await searchApiService.matchMissingItem(postId)
      return result
    } catch (error) {
      console.error('Exception finding matches:', error)
      return { success: false, matches: [] }
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    acceptPost,
    rejectPost,
    deletePost,
    matchPost,
    isProcessing
  }
}
