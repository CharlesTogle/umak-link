import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import type { CustodySessionStatusResponse } from '@/shared/lib/api-types'
import {
  cancelUserCustodySession,
  fetchUserCustodyHistory,
  fetchUserCustodySessionStatus,
  listGuardPosts,
  retryUserCustodySession,
  startUserCustodyAttempt
} from '@/features/user/custody/services/userCustodyService'
import type {
  CreateUserCustodyAttemptInput,
  RetryUserCustodySessionResult,
  StartUserCustodyAttemptResult
} from '@/features/user/custody/types/user-custody'

const USER_CUSTODY_POLL_INTERVAL_MS = 5000

export const userCustodyQueryKeys = {
  guardPosts: ['user-custody', 'guard-posts'] as const,
  history: (postId: number) => ['user-custody', 'history', postId] as const,
  sessionStatus: (qrCodeSessionId: string) =>
    ['user-custody', 'session-status', qrCodeSessionId] as const
}

function shouldContinuePolling (
  status: CustodySessionStatusResponse | undefined
): boolean {
  if (!status) return true

  if (status.attempt_status !== 'open') return false
  return true
}

export function useUserCustodyGuardPostsQuery () {
  return useQuery({
    queryKey: userCustodyQueryKeys.guardPosts,
    queryFn: listGuardPosts,
    staleTime: 5 * 60 * 1000
  })
}

export function useUserCustodyHistoryQuery (postId: number, enabled = true) {
  return useQuery({
    queryKey: userCustodyQueryKeys.history(postId),
    queryFn: async () => await fetchUserCustodyHistory(postId),
    enabled,
    retry: 1
  })
}

export function useUserCustodySessionStatusQuery (
  qrCodeSessionId: string | null
) {
  return useQuery({
    queryKey: userCustodyQueryKeys.sessionStatus(qrCodeSessionId ?? 'missing'),
    queryFn: async () => await fetchUserCustodySessionStatus(qrCodeSessionId!),
    enabled: Boolean(qrCodeSessionId),
    refetchInterval: query =>
      shouldContinuePolling(query.state.data) ? USER_CUSTODY_POLL_INTERVAL_MS : false,
    retry: 1
  })
}

export function useStartUserCustodyAttemptMutation (postId: number) {
  const queryClient = useQueryClient()

  return useMutation<StartUserCustodyAttemptResult, Error, CreateUserCustodyAttemptInput>({
    mutationKey: ['user-custody', 'start-attempt', postId],
    mutationFn: async payload => await startUserCustodyAttempt(payload),
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: userCustodyQueryKeys.history(postId)
      })
      await queryClient.setQueryData(
        userCustodyQueryKeys.sessionStatus(response.qr_code_session_id),
        {
          qr_code_session_id: response.qr_code_session_id,
          custody_attempt_id: response.custody_attempt_id,
          post_id: postId,
          item_id: '',
          manual_entry_code: response.manual_entry_code,
          qr_status: response.qr_status,
          attempt_status: response.attempt_status,
          custody_status: response.custody_status,
          expires_at: response.expires_at,
          scanned_at: null,
          decision_at: null,
          current_window_expired: false,
          can_retry: false,
          number_of_attempts: response.number_of_attempts,
          max_number_of_attempts: response.max_number_of_attempts,
          retries_remaining: response.retries_remaining
        } satisfies CustodySessionStatusResponse
      )
    },
    retry: 1
  })
}

export function useRetryUserCustodySessionMutation (postId: number) {
  const queryClient = useQueryClient()

  return useMutation<RetryUserCustodySessionResult, Error, string>({
    mutationKey: ['user-custody', 'retry-session', postId],
    mutationFn: async qrCodeSessionId => await retryUserCustodySession(qrCodeSessionId),
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: userCustodyQueryKeys.history(postId)
      })
      await queryClient.invalidateQueries({
        queryKey: userCustodyQueryKeys.sessionStatus(response.qr_code_session_id)
      })
    },
    retry: 1
  })
}

export function useCancelUserCustodySessionMutation (postId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['user-custody', 'cancel-session', postId],
    mutationFn: async (qrCodeSessionId: string) =>
      await cancelUserCustodySession(qrCodeSessionId),
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: userCustodyQueryKeys.history(postId)
      })
      await queryClient.invalidateQueries({
        queryKey: userCustodyQueryKeys.sessionStatus(response.qr_code_session_id)
      })
    },
    retry: 1
  })
}
