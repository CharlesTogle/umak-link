import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import { isConnected } from '@/shared/utils/networkCheck'
import type { ExistingClaimDetails } from './useExistingClaimCheck'

interface ClaimItemSubmitParams {
  foundPostId: string
  claimerName: string
  claimerEmail: string
  claimerContactNumber: string
  posterName: string
  staffId: string
  staffName: string
  missingPostId: string | null
  existingClaim?: ExistingClaimDetails | null
  isOverwrite?: boolean
}

export function useClaimItemSubmit () {
  const [isProcessing, setIsProcessing] = useState(false)
  const { navigate } = useNavigation()
  const { insertAuditLog } = useAuditLogs()

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
      staffId,
      staffName,
      missingPostId,
      existingClaim,
      isOverwrite
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

      // If overwriting an existing claim, log the audit trail first
      if (isOverwrite && existingClaim) {
        await insertAuditLog({
          user_id: staffId,
          action_type: 'claim_overwritten',
          details: {
            message: `Claim overwritten by ${staffName}`,
            item_id: existingClaim.item_id,
            old_claim: {
              claim_id: existingClaim.claim_id,
              claimer_name: existingClaim.claimer_name,
              claimer_email: existingClaim.claimer_school_email,
              claimer_contact: existingClaim.claimer_contact_num,
              claimed_at: existingClaim.claimed_at,
              processed_by_staff: existingClaim.staff_name || 'Unknown'
            },
            new_claim: {
              claimer_name: claimerName,
              claimer_email: claimerEmail,
              claimer_contact: claimerContactNumber,
              processed_by_staff: staffName
            }
          }
        })
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

      onSuccess('Item claimed successfully!')

      // Navigate back after success
      setTimeout(() => {
        navigate('/staff/post-records', 'back')
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
