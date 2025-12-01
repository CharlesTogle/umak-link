import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
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

      // Check network connectivity with 8-second timeout
      const connected = await isConnected(8000)
      if (!connected) {
        setError('No internet connection. Please check your network.')
        return null
      }

      // Query claim_table for existing claim with staff name from user_table
      const { data, error: claimError } = await supabase
        .from('claim_table')
        .select(
          `
          claim_id,
          item_id,
          claimer_name,
          claimer_school_email,
          claimer_contact_num,
          processed_by_staff_id,
          claimed_at
        `
        )
        .eq('item_id', itemId)
        .single()

      if (claimError) {
        // If no claim found, that's not an error - just return null
        if (claimError.code === 'PGRST116') {
          setExistingClaim(null)
          return null
        }
        console.error('Error checking for existing claim:', claimError)
        setError('Failed to check for existing claim')
        return null
      }

      // Fetch staff name from user_table using processed_by_staff_id
      let staffName = 'Unknown Staff'
      if (data.processed_by_staff_id) {
        const { data: userData, error: userError } = await supabase
          .from('user_table')
          .select('user_name')
          .eq('user_id', data.processed_by_staff_id)
          .single()

        if (!userError && userData) {
          staffName = userData.user_name
        }
      }

      const claimDetails: ExistingClaimDetails = {
        claim_id: data.claim_id,
        item_id: data.item_id,
        claimer_name: data.claimer_name,
        claimer_school_email: data.claimer_school_email,
        claimer_contact_num: data.claimer_contact_num,
        processed_by_staff_id: data.processed_by_staff_id,
        claimed_at: data.claimed_at,
        staff_name: staffName
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
