import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClaimVerificationSessionStatusResponse } from '@/shared/lib/api-types'
import {
  cancelUserClaimSession,
  fetchCurrentUserClaimCode,
  fetchUserClaimSessionStatus,
  joinUserClaimSession,
  retryUserClaimSession
} from '@/features/user/claim-verification/services/userClaimVerificationService'
import type {
  JoinUserClaimSessionResult,
  RetryUserClaimSessionResult
} from '@/features/user/claim-verification/types/user-claim-verification'

const USER_CLAIM_POLL_INTERVAL_MS = 5000

export const userClaimVerificationQueryKeys = {
  manualCode: ['user-claim-verification', 'manual-code'] as const,
  sessionStatus: (claimVerificationSessionId: string) =>
    ['user-claim-verification', 'session-status', claimVerificationSessionId] as const
}

function shouldContinuePolling (
  status: ClaimVerificationSessionStatusResponse | undefined
): boolean {
  if (!status) return true
  return !['completed', 'expired', 'cancelled'].includes(status.status)
}

export function useUserClaimSessionStatusQuery (
  claimVerificationSessionId: string | null
) {
  return useQuery({
    queryKey: userClaimVerificationQueryKeys.sessionStatus(
      claimVerificationSessionId ?? 'missing'
    ),
    queryFn: async () =>
      await fetchUserClaimSessionStatus(claimVerificationSessionId!),
    enabled: Boolean(claimVerificationSessionId),
    refetchInterval: query =>
      shouldContinuePolling(query.state.data)
        ? USER_CLAIM_POLL_INTERVAL_MS
        : false,
    retry: 1
  })
}

export function useUserClaimManualEntryCodeQuery (enabled = true) {
  return useQuery({
    queryKey: userClaimVerificationQueryKeys.manualCode,
    queryFn: async () => await fetchCurrentUserClaimCode(),
    enabled,
    staleTime: Infinity,
    retry: 1
  })
}

export function useJoinUserClaimSessionMutation () {
  const queryClient = useQueryClient()

  return useMutation<JoinUserClaimSessionResult, Error, string>({
    mutationKey: ['user-claim-verification', 'join-session'],
    mutationFn: async joinCode => await joinUserClaimSession(joinCode),
    onSuccess: async response => {
      await queryClient.setQueryData(
        userClaimVerificationQueryKeys.sessionStatus(
          response.claim_verification_session_id
        ),
        {
          claim_verification_session_id: response.claim_verification_session_id,
          found_post_id: response.found_post.post_id,
          item_id: response.found_post.item_id,
          join_code: response.join_code,
          status: response.status,
          qr_status: response.qr_status,
          expires_at: response.expires_at,
          scanned_at: null,
          completed_at: null,
          closed_at: null,
          current_window_expired: false,
          can_retry: false,
          verified_claimer: null,
          number_of_attempts: response.number_of_attempts,
          max_number_of_attempts: response.max_number_of_attempts,
          retries_remaining: response.retries_remaining
        } satisfies ClaimVerificationSessionStatusResponse
      )
    },
    retry: 1
  })
}

export function useRetryUserClaimSessionMutation () {
  const queryClient = useQueryClient()

  return useMutation<RetryUserClaimSessionResult, Error, string>({
    mutationKey: ['user-claim-verification', 'retry-session'],
    mutationFn: async claimVerificationSessionId =>
      await retryUserClaimSession(claimVerificationSessionId),
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: userClaimVerificationQueryKeys.sessionStatus(
          response.claim_verification_session_id
        )
      })
    },
    retry: 1
  })
}

export function useCancelUserClaimSessionMutation () {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['user-claim-verification', 'cancel-session'],
    mutationFn: async (claimVerificationSessionId: string) =>
      await cancelUserClaimSession(claimVerificationSessionId),
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: userClaimVerificationQueryKeys.sessionStatus(
          response.claim_verification_session_id
        )
      })
    },
    retry: 1
  })
}
