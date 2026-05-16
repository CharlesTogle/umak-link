import { useEffect, useState } from 'react'
import { useNavigation } from '@/shared/hooks/useNavigation'
import {
  clearActiveUserClaimSession,
  readActiveUserClaimSession,
  storeActiveUserClaimSession
} from '@/features/user/claim-verification/state/userClaimSessionStorage'
import {
  mapRetryResultToStoredSession
} from '@/features/user/claim-verification/services/userClaimVerificationService'
import {
  useCancelUserClaimSessionMutation,
  useRetryUserClaimSessionMutation,
  useUserClaimSessionStatusQuery
} from '@/features/user/claim-verification/hooks/useUserClaimVerificationQueries'
import type { StoredUserClaimSession } from '@/features/user/claim-verification/types/user-claim-verification'

function getInitialSession (
  claimVerificationSessionId: string
): StoredUserClaimSession | null {
  const storedSession = readActiveUserClaimSession()

  if (
    !storedSession ||
    storedSession.claimVerificationSessionId !== claimVerificationSessionId
  ) {
    return null
  }

  return storedSession
}

export function useUserClaimSessionFlow (
  claimVerificationSessionId: string
) {
  const { navigate } = useNavigation()
  const [activeSession, setActiveSession] = useState<StoredUserClaimSession | null>(
    () => getInitialSession(claimVerificationSessionId)
  )
  const sessionStatusQuery = useUserClaimSessionStatusQuery(
    activeSession?.claimVerificationSessionId ?? claimVerificationSessionId
  )
  const retryMutation = useRetryUserClaimSessionMutation()
  const cancelMutation = useCancelUserClaimSessionMutation()

  useEffect(() => {
    if (!sessionStatusQuery.data || !activeSession) return

    const hasSessionChanged =
      activeSession.status !== sessionStatusQuery.data.status ||
      activeSession.qrStatus !== sessionStatusQuery.data.qr_status ||
      activeSession.expiresAt !== sessionStatusQuery.data.expires_at ||
      activeSession.numberOfAttempts !== sessionStatusQuery.data.number_of_attempts ||
      activeSession.maxNumberOfAttempts !== sessionStatusQuery.data.max_number_of_attempts ||
      activeSession.retriesRemaining !== sessionStatusQuery.data.retries_remaining

    if (!hasSessionChanged) return

    const nextSession = storeActiveUserClaimSession({
      ...activeSession,
      status: sessionStatusQuery.data.status,
      qrStatus: sessionStatusQuery.data.qr_status ?? activeSession.qrStatus,
      expiresAt: sessionStatusQuery.data.expires_at,
      numberOfAttempts: sessionStatusQuery.data.number_of_attempts,
      maxNumberOfAttempts: sessionStatusQuery.data.max_number_of_attempts,
      retriesRemaining: sessionStatusQuery.data.retries_remaining
    })

    setActiveSession(nextSession)

    if (
      sessionStatusQuery.data.status === 'completed' ||
      sessionStatusQuery.data.status === 'cancelled'
    ) {
      clearActiveUserClaimSession()
    }
  }, [activeSession, sessionStatusQuery.data])

  const handleRetry = async () => {
    if (!activeSession) return

    const result = await retryMutation.mutateAsync(
      activeSession.claimVerificationSessionId
    )

    setActiveSession(
      storeActiveUserClaimSession(
        mapRetryResultToStoredSession(activeSession, result)
      )
    )
  }

  const handleCancel = async () => {
    if (!activeSession) return

    await cancelMutation.mutateAsync(activeSession.claimVerificationSessionId)
    clearActiveUserClaimSession()
    setActiveSession(null)
    navigate('/user/claim/join', 'root')
  }

  return {
    activeSession,
    cancelMutation,
    handleCancel,
    handleRetry,
    retryMutation,
    sessionStatusQuery
  }
}
