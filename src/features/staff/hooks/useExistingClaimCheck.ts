import { useState } from 'react'
import { claimApiService } from '@/shared/services'
import { isConnected } from '@/shared/utils/networkCheck'

export interface ExistingClaimDetails {
  claim_id: string
  item_id: string
  claimer_name: string
  claimer_school_email: string
  claimer_contact_num: string
  processed_by_staff_id: string
  claimed_at: string
  staff_name?: string
}

export function useExistingClaimCheck () {
  const [existingClaim, setExistingClaim] =
    useState<ExistingClaimDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkForExistingClaim = async (
    itemId: string
  ): Promise<ExistingClaimDetails | null> => {
    try {
      setError(null)
      setLoading(true)

      // Check network connectivity
      const connected = await isConnected()
      if (!connected) {
        setError('No internet connection. Please check your network.')
        return null
      }

      // Query backend API for existing claim with staff name
      const claim = await claimApiService.checkExistingClaimFull(itemId)

      if (!claim) {
        setExistingClaim(null)
        return null
      }

      const claimDetails: ExistingClaimDetails = {
        claim_id: claim.claim_id,
        item_id: claim.item_id,
        claimer_name: claim.claimer_name,
        claimer_school_email: claim.claimer_school_email,
        claimer_contact_num: claim.claimer_contact_num,
        processed_by_staff_id: claim.processed_by_staff_id,
        claimed_at: claim.claimed_at,
        staff_name: claim.staff_name || 'Unknown Staff'
      }

      setExistingClaim(claimDetails)
      return claimDetails
    } catch (err) {
      console.error('Exception checking for existing claim:', err)
      setError('Failed to check for existing claim')
      return null
    } finally {
      setLoading(false)
    }
  }

  const clearExistingClaim = () => {
    setExistingClaim(null)
    setError(null)
  }

  return {
    existingClaim,
    loading,
    error,
    checkForExistingClaim,
    clearExistingClaim
  }
}
