import { useState } from 'react'
import { Network } from '@capacitor/network'
import { supabase } from '@/shared/lib/supabase'
import { useNavigation } from '@/shared/hooks/useNavigation'
import useNotifications from '@/features/user/hooks/useNotifications'


interface ClaimItemSubmitParams {
  foundPostId: string
  claimerName: string
  claimerEmail: string
  claimerContactNumber: string
  posterName: string
  posterUserId: string
  itemType: string
  staffId: string
  staffName: string
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
      foundPostId,
      claimerName,
      claimerEmail,
      claimerContactNumber,
      posterName,
      posterUserId,
      itemType,
      staffId,
      staffName,
      missingPostId
    } = params

    // Validation
    if (!claimerName || !claimerEmail) {
      onError('Please select a claimer')
      return
    }

    if (!claimerContactNumber) {
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
        found_post_id: Number(foundPostId),
        claim_details: {
          claimer_name: claimerName,
          claimer_school_email: claimerEmail,
          claimer_contact_num: claimerContactNumber,
          poster_name: posterName,
          staff_id: staffId,
          staff_name: staffName
        },
        missing_post_id: missingPostId ? Number(missingPostId) : null
      })

      if (error) {
        throw error
      }

      // Send notification to poster if item_type is 'lost'
      if (itemType === 'lost' && posterUserId) {
        await sendNotification({
          userId: posterUserId,
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
