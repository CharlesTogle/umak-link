import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import { useUser } from '@/features/auth/contexts/UserContext'
import { usePostActionsStaffServices } from './usePostStaffServices'

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

      const { error: postError } = await supabase
        .from('post_table')
        .update({ accepted_by_staff_id: user?.user_id || null })
        .eq('post_id', postId)

      if (postError) {
        console.error('Error updating accepted_by_staff_id:', postError)
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
      const { data: postData } = await supabase
        .from('post_table')
        .select('item_id')
        .eq('post_id', postId)
        .single()

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
      const { error } = await supabase
        .from('post_table')
        .delete()
        .eq('post_id', postId)

      if (error) {
        console.error('Error deleting post:', error)
        return false
      }

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
   * Find potential matches for a missing item using Edge Function
   */
  const matchPost = async (postId: string): Promise<MatchResult> => {
    setIsProcessing(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'match-missing-item',
        {
          body: { post_id: postId }
        }
      )

      if (error) {
        console.error('Error finding matches:', error)
        return { success: false, matches: [] }
      }

      // Return matches to display in modal
      return {
        success: true,
        matches: data.matches || [],
        missing_post: data.missing_post,
        total_matches: data.total_matches || 0
      }
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
