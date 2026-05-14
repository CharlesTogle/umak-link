import { useEffect, useReducer, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { getPostFull } from '@/features/posts/data/posts'
import {
  useCancelUserCustodySessionMutation,
  useRetryUserCustodySessionMutation,
  useStartUserCustodyAttemptMutation,
  useUserCustodyGuardPostsQuery,
  useUserCustodyHistoryQuery,
  useUserCustodySessionStatusQuery,
  userCustodyQueryKeys
} from '@/features/user/custody/hooks/useUserCustodyQueries'
import {
  initialUserCustodyPageState,
  userCustodyPageReducer
} from '@/features/user/custody/state/userCustodyPageState'
import {
  clearActiveUserCustodySession,
  readActiveUserCustodySession,
  storeActiveUserCustodySession
} from '@/features/user/custody/state/userCustodySessionStorage'
import {
  mapRetryResultToStoredSession,
  mapStartAttemptResultToStoredSession
} from '@/features/user/custody/services/userCustodyService'
import type {
  StoredUserCustodySession,
  UserCustodyPageState
} from '@/features/user/custody/types/user-custody'

function getInitialSession (postId: number): StoredUserCustodySession | null {
  const storedSession = readActiveUserCustodySession()

  if (!storedSession || storedSession.postId !== postId) {
    return null
  }

  return storedSession
}

function getResultCopy (
  resultModalStatus: UserCustodyPageState['resultModalStatus']
) {
  if (resultModalStatus === 'accepted') {
    return {
      title: 'Guard Accepted Handover',
      message: 'The guard has accepted handover. Hand over the item to the guard now.'
    }
  }

  return {
    title: 'Guard Rejected Handover',
    message: 'The guard rejected the handover. Try again later or try a different guard post.'
  }
}

export function useUserCustodyPageFlow (postId: number) {
  const queryClient = useQueryClient()
  const { navigate } = useNavigation()
  const [state, dispatch] = useReducer(
    userCustodyPageReducer,
    initialUserCustodyPageState
  )
  const [activeSession, setActiveSession] = useState<StoredUserCustodySession | null>(() =>
    getInitialSession(postId)
  )
  const handledDecisionRef = useRef<string | null>(null)
  const historyListPath = '/user/history'
  const historyPath = `/user/post/history/view/${postId}`

  const postQuery = useQuery({
    queryKey: ['history-post-details', postId],
    queryFn: async () => await getPostFull(String(postId)),
    enabled: Number.isFinite(postId)
  })
  const guardPostsQuery = useUserCustodyGuardPostsQuery()
  const custodyHistoryQuery = useUserCustodyHistoryQuery(
    postId,
    Number.isFinite(postId)
  )
  const sessionStatusQuery = useUserCustodySessionStatusQuery(
    activeSession?.qrCodeSessionId ?? null
  )
  const startAttemptMutation = useStartUserCustodyAttemptMutation(postId)
  const retryMutation = useRetryUserCustodySessionMutation(postId)
  const cancelMutation = useCancelUserCustodySessionMutation(postId)

  useEffect(() => {
    if (!sessionStatusQuery.data || !activeSession) return

    const hasSessionChanged =
      activeSession.custodyStatus !== sessionStatusQuery.data.custody_status ||
      activeSession.attemptStatus !== sessionStatusQuery.data.attempt_status ||
      activeSession.qrStatus !== sessionStatusQuery.data.qr_status ||
      activeSession.expiresAt !== sessionStatusQuery.data.expires_at ||
      activeSession.numberOfAttempts !== sessionStatusQuery.data.number_of_attempts ||
      activeSession.maxNumberOfAttempts !==
        sessionStatusQuery.data.max_number_of_attempts ||
      activeSession.retriesRemaining !== sessionStatusQuery.data.retries_remaining

    if (!hasSessionChanged) return

    const nextSession = storeActiveUserCustodySession({
      ...activeSession,
      custodyStatus: sessionStatusQuery.data.custody_status,
      attemptStatus: sessionStatusQuery.data.attempt_status,
      qrStatus: sessionStatusQuery.data.qr_status,
      expiresAt: sessionStatusQuery.data.expires_at,
      numberOfAttempts: sessionStatusQuery.data.number_of_attempts,
      maxNumberOfAttempts: sessionStatusQuery.data.max_number_of_attempts,
      retriesRemaining: sessionStatusQuery.data.retries_remaining
    })

    setActiveSession(nextSession)
  }, [activeSession, sessionStatusQuery.data])

  useEffect(() => {
    if (
      sessionStatusQuery.data?.attempt_status !== 'accepted' &&
      sessionStatusQuery.data?.attempt_status !== 'rejected'
    ) {
      return
    }

    const decisionKey = `${sessionStatusQuery.data.attempt_status}:${sessionStatusQuery.data.decision_at ?? 'decision-missing'}`
    if (handledDecisionRef.current === decisionKey) return

    handledDecisionRef.current = decisionKey
    void queryClient.invalidateQueries({
      queryKey: userCustodyQueryKeys.history(postId)
    })
    dispatch({
      type: 'resultModalShown',
      status: sessionStatusQuery.data.attempt_status
    })
    clearActiveUserCustodySession()
    setActiveSession(null)
  }, [postId, queryClient, sessionStatusQuery.data])

  const handleGoBack = () => {
    navigate(historyListPath)
  }

  const handleOpenQrCode = async () => {
    if (!state.selectedGuardPostId) {
      dispatch({
        type: 'toastShown',
        color: 'warning',
        message: 'Select the guard post first.'
      })
      return
    }

    if (!state.handoverImage) {
      dispatch({
        type: 'toastShown',
        color: 'warning',
        message: 'Upload one handover image first.'
      })
      return
    }

    const selectedGuardPost = guardPostsQuery.data?.find(
      guardPost => guardPost.guard_post_id === state.selectedGuardPostId
    )

    if (!selectedGuardPost) {
      dispatch({
        type: 'toastShown',
        color: 'danger',
        message: 'Selected guard post is no longer available.'
      })
      return
    }

    try {
      const result = await startAttemptMutation.mutateAsync({
        postId,
        guardPostId: state.selectedGuardPostId,
        guardPostName:
          selectedGuardPost.full_location_name ?? selectedGuardPost.guard_post_name,
        handoverImage: state.handoverImage
      })

      setActiveSession(
        storeActiveUserCustodySession(
          mapStartAttemptResultToStoredSession(result, postId)
        )
      )
      dispatch({
        type: 'toastShown',
        color: 'success',
        message: 'Unique QR code opened for this handover session.'
      })
    } catch (error) {
      dispatch({
        type: 'toastShown',
        color: 'danger',
        message: error instanceof Error ? error.message : 'Failed to open QR code.'
      })
    }
  }

  const handleRetry = async () => {
    if (!activeSession) return

    try {
      const result = await retryMutation.mutateAsync(activeSession.qrCodeSessionId)
      setActiveSession(
        storeActiveUserCustodySession(
          mapRetryResultToStoredSession(activeSession, result)
        )
      )
      dispatch({
        type: 'toastShown',
        color: 'success',
        message: 'A fresh QR code is now active for the same session.'
      })
    } catch (error) {
      dispatch({
        type: 'toastShown',
        color: 'danger',
        message: error instanceof Error ? error.message : 'Failed to refresh the QR code.'
      })
    }
  }

  const handleCancelSession = async () => {
    if (!activeSession) return

    try {
      await cancelMutation.mutateAsync(activeSession.qrCodeSessionId)
      clearActiveUserCustodySession()
      setActiveSession(null)
      dispatch({ type: 'cancelModalDismissed' })
      navigate(historyPath)
    } catch (error) {
      dispatch({
        type: 'toastShown',
        color: 'danger',
        message: error instanceof Error ? error.message : 'Failed to cancel the handover session.'
      })
    }
  }

  const handleResultClose = () => {
    dispatch({ type: 'resultModalDismissed' })
    navigate(historyPath)
  }

  const resultCopy = getResultCopy(state.resultModalStatus)
  const isEligibleForHandover =
    postQuery.data?.item_type === 'found' &&
    custodyHistoryQuery.data?.custody_status === 'with_reporter'

  return {
    activeSession,
    cancelMutation,
    custodyHistoryQuery,
    dispatch,
    guardPostsQuery,
    handleCancelSession,
    handleGoBack,
    handleOpenQrCode,
    handleResultClose,
    handleRetry,
    isEligibleForHandover,
    postQuery,
    resultCopy,
    retryMutation,
    sessionStatusQuery,
    startAttemptMutation,
    state
  }
}
