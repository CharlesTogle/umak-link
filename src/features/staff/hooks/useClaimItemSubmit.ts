import { useState } from 'react'
import { Network } from '@capacitor/network'
import { supabase } from '@/shared/lib/supabase'
import { useNavigation } from '@/shared/hooks/useNavigation'
import useNotifications from '@/features/user/hooks/useNotifications'
import type { PublicPost } from '@/features/posts/types/post'

interface SelectedUser {
  id: string
  name: string
  email: string
  image?: string | null
}

interface CurrentUser {
  user_id: string
  user_name: string
}

interface ClaimItemSubmitParams {
  postId: string
  selectedUser: SelectedUser
  contactNumber: string
  post: PublicPost
  currentUser: CurrentUser
  missingPostId: string | null
}

export function useClaimItemSubmit () {
  const [isProcessing, setIsProcessing] = useState(false)
  const { sendNotification } = useNotifications()
  const { navigate } = useNavigation()

  const submit = async (
    params: ClaimItemSubmitParams,
    onSuccess: (message: string) => void,
    onError: (message: string) => void
  ) => {
    const {
      postId,
      selectedUser,
      contactNumber,
      post,
      currentUser,
      missingPostId
    } = params

    // Validation
    if (!selectedUser || !post || !currentUser) {
      onError('Please select a claimer')
      return
    }

    if (!contactNumber) {
      onError('Please enter contact number')
      return
    }

    setIsProcessing(true)

    try {
      // Check network connectivity
      const status = await Network.getStatus()
      if (!status.connected) {
        onError('No internet connection. Please check your network.')
        setIsProcessing(false)
        return
      }

      // Call process_claim RPC
      const { error } = await supabase.rpc('process_claim', {
        found_post_id: postId,
        claim_details: {
          claimer_name: selectedUser.name,
          claimer_school_email: selectedUser.email,
          claimer_contact_num: contactNumber,
          poster_name: post.username || 'Unknown',
          staff_id: currentUser.user_id,
          staff_name: currentUser.user_name
        },
        missing_post_id: missingPostId
      })

      if (error) {
        throw error
      }

      // Send notification to poster if item_type is 'lost'
      if (post.item_type === 'lost' && post.user_id) {
        await sendNotification({
          userId: post.user_id,
          title: 'Similar Items Found',
          message:
            'We found items similar to your reported lost item, you might want to come and check',
          type: 'info'
        })
      }

      onSuccess('Item claimed successfully!')

      // Navigate back after success
      setTimeout(() => {
        navigate('/staff/post-records', 'back')
      }, 1500)
    } catch (error) {
      console.error('Error claiming item:', error)
      onError('Failed to claim item')
    } finally {
      setIsProcessing(false)
    }
  }

  return { submit, isProcessing }
}
