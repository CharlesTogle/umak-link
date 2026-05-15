import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClaimVerificationSessionStatusResponse } from '@/shared/lib/api-types'
import {
  createStaffClaimVerificationSession,
  fetchStaffClaimVerificationSessionStatus,
  scanStaffClaimVerificationSession
} from '@/features/staff/services/staffClaimVerificationService'

const STAFF_CLAIM_POLL_INTERVAL_MS = 4000

export const staffClaimVerificationQueryKeys = {
  processorSession: (postId: number) =>
    ['staff-claim-verification', 'processor-session', postId] as const,
  sessionStatus: (claimVerificationSessionId: string) =>
    ['staff-claim-verification', 'session-status', claimVerificationSessionId] as const
}

function shouldContinuePolling (
  status: ClaimVerificationSessionStatusResponse | undefined
): boolean {
  if (!status) return true
  return !['completed', 'expired', 'cancelled'].includes(status.status)
}

export function useStaffClaimVerificationSessionQuery (
  foundPostId: number | null,
  enabled = true
) {
  return useQuery({
    queryKey: staffClaimVerificationQueryKeys.processorSession(foundPostId ?? 0),
    queryFn: async () => await createStaffClaimVerificationSession(foundPostId!),
    enabled: Boolean(foundPostId) && enabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false
  })
}

export function useStaffClaimVerificationStatusQuery (
  claimVerificationSessionId: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: staffClaimVerificationQueryKeys.sessionStatus(
      claimVerificationSessionId ?? 'missing'
    ),
    queryFn: async () =>
      await fetchStaffClaimVerificationSessionStatus(claimVerificationSessionId!),
    enabled: Boolean(claimVerificationSessionId) && enabled,
    refetchInterval: query =>
      shouldContinuePolling(query.state.data)
        ? STAFF_CLAIM_POLL_INTERVAL_MS
        : false,
    retry: 1
  })
}

export function useScanStaffClaimVerificationMutation () {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['staff-claim-verification', 'scan-session'],
    mutationFn: scanStaffClaimVerificationSession,
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: staffClaimVerificationQueryKeys.sessionStatus(
          response.claim_verification_session_id
        )
      })
    },
    retry: 1
  })
}
