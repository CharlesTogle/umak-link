import { useState } from 'react'
import { claimApiService } from '@/shared/services'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { isConnected } from '@/shared/utils/networkCheck'
import type { ExistingClaimDetails } from './useExistingClaimCheck'

interface ClaimItemSubmitParams {
  foundPostId: string
  claimerName: string
  claimerEmail: string
  claimerContactNumber: string
  claimedAt: string | null
  posterName: string
  staffId: string
  staffName: string
  missingPostId: string | null
  claimVerification?: {
    claim_verification_session_id: string
    verification_method: 'staff_qr' | 'guard_qr'
  }
  redirectPath?: string
  existingClaim?: ExistingClaimDetails | null
  isOverwrite?: boolean
}

export function useClaimItemSubmit () {
  const [isProcessing, setIsProcessing] = useState(false)
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
      claimedAt,
      posterName,
      staffId,
      staffName,
      missingPostId,
      claimVerification,
      redirectPath
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
      // Check network connectivity with 8-second timeout
      const connected = await isConnected(8000)
      if (!connected) {
        onError('No internet connection. Please check your network.')
        setIsProcessing(false)
        return
      }

      // Call process_claim API
      await claimApiService.processClaim({
        foundPostId: Number(foundPostId),
        claimDetails: {
          claimer_name: claimerName,
          claimer_school_email: claimerEmail,
          claimer_contact_num: claimerContactNumber,
          claimed_at: claimedAt,
          poster_name: posterName,
          staff_id: staffId,
          staff_name: staffName
        },
        missingPostId: missingPostId ? Number(missingPostId) : null,
        claimVerification
      })

      onSuccess('Item claimed successfully!')

      // Navigate back after success
      setTimeout(() => {
        navigate(redirectPath || '/staff/post-records', 'back')
      }, 1000)
    } catch (error) {
      console.error('Error claiming item:', error)
      onError('Failed to claim item')
    } finally {
      setIsProcessing(false)
    }
  }

  return { submit, isProcessing }
}
