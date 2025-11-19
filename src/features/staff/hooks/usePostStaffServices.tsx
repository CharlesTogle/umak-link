import { supabase } from '@/shared/lib/supabase'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import { useUser } from '@/features/auth/contexts/UserContext'

export interface CreateStaffPostInput {
  p_poster_id: string
  p_item_name: string
  p_item_description: string
  p_category: string
  p_last_seen_location: string
  p_last_seen_at: string
  p_item_image_url?: string
  p_item_type: 'found' | 'lost'
  p_is_anonymous: boolean
  p_post_status: 'pending' | 'accepted' | 'rejected'
}

export function usePostActionsStaffServices () {
  const { insertAuditLog } = useAuditLogs()
  const { user, getUser, setUser } = useUser()

  /**
   * Create a new post as staff with specified post_status
   * @param postData - The post data including poster_id and post_status
   * @returns The created post ID or null if failed
   */
  const createPost = async (
    postData: CreateStaffPostInput
  ): Promise<string | null> => {
    try {
      let currentUser = user

      if (!user) {
        currentUser = await getUser()
        setUser(currentUser)
      }

      const { data, error } = await supabase.rpc('add_post', {
        p_poster_id: postData.p_poster_id,
        p_item_name: postData.p_item_name,
        p_item_description: postData.p_item_description,
        p_category: postData.p_category,
        p_last_seen_location: postData.p_last_seen_location,
        p_last_seen_at: postData.p_last_seen_at,
        p_item_image_url: postData.p_item_image_url || null,
        p_item_type: postData.p_item_type,
        p_is_anonymous: postData.p_is_anonymous,
        p_post_status: postData.p_post_status
      })

      if (error) {
        console.error('Error creating post:', error)
        return null
      }

      // Log the action
      await insertAuditLog({
        user_id: currentUser?.user_id || 'unknown',
        action_type: 'Create Post',
        details: {
          action: 'Create Post',
          post_id: data,
          poster_id: postData.p_poster_id,
          item_name: postData.p_item_name,
          item_type: postData.p_item_type,
          post_status: postData.p_post_status
        }
      })

      return data
    } catch (error) {
      console.error('Exception creating post:', error)
      return null
    }
  }

  /**
   * Remove a post by setting post_status to 'deleted'
   * @param postId - The ID of the post to remove
   * @returns True if successful, false otherwise
   */
  const removePost = async (postId: string): Promise<boolean> => {
    try {
      let currentUser = user

      if (!user) {
        currentUser = await getUser()
        setUser(currentUser)
      }

      const { error } = await supabase
        .from('post_table')
        .update({ post_status: 'deleted' })
        .eq('post_id', postId)

      if (error) {
        console.error('Error removing post:', error)
        return false
      }

      // Log the action
      await insertAuditLog({
        user_id: currentUser?.user_id || 'unknown',
        action_type: 'Remove Post',
        details: {
          action: 'Remove Post',
          post_id: postId,
          post_status: 'deleted'
        }
      })

      return true
    } catch (error) {
      console.error('Exception removing post:', error)
      return false
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
        .select('item_id, post_status')
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

      const oldStatus = postData?.post_status
      const itemName = itemData?.item_name || 'Unknown Item'

      const { error } = await supabase
        .from('post_table')
        .update({ post_status: newStatus })
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

  return {
    createPost,
    removePost,
    changePostStatus
  }
}
