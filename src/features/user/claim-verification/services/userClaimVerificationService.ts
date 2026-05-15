import { api, ApiError } from '@/shared/lib/api'
import type {
  CancelClaimVerificationSessionResponse,
  ClaimVerificationSessionStatusResponse
} from '@/shared/lib/api-types'
import type {
  JoinUserClaimSessionResult,
  RetryUserClaimSessionResult,
  StoredUserClaimSession
} from '@/features/user/claim-verification/types/user-claim-verification'

export class UserClaimVerificationError extends Error {
  constructor (
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'UserClaimVerificationError'
  }
}

function mapApiError (error: unknown): UserClaimVerificationError {
  if (error instanceof ApiError) {
    return new UserClaimVerificationError(error.message, error.statusCode, error.data)
  }

  if (error instanceof Error) {
    return new UserClaimVerificationError(error.message, 0, error)
  }

  return new UserClaimVerificationError('Claim verification request failed.', 0)
}

function generateSessionToken (): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = crypto.getRandomValues(new Uint8Array(16))
    return Array.from(values, value => value.toString(16).padStart(2, '0')).join('')
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function buildUserClaimQrValue (
  activeSession: StoredUserClaimSession
): string {
  return JSON.stringify({
    claim_qr_session_id: activeSession.claimQrSessionId,
    session_token: activeSession.sessionToken
  })
}

export function mapJoinResultToStoredSession (
  result: JoinUserClaimSessionResult
): StoredUserClaimSession {
  return {
    claimVerificationSessionId: result.claim_verification_session_id,
    claimQrSessionId: result.claim_qr_session_id,
    joinCode: result.join_code,
    sessionToken: result.sessionToken,
    status: result.status,
    qrStatus: result.qr_status,
    expiresAt: result.expires_at,
    numberOfAttempts: result.number_of_attempts,
    maxNumberOfAttempts: result.max_number_of_attempts,
    retriesRemaining: result.retries_remaining,
    foundPost: result.found_post,
    createdAt: new Date().toISOString()
  }
}

export function mapRetryResultToStoredSession (
  currentSession: StoredUserClaimSession,
  result: RetryUserClaimSessionResult
): StoredUserClaimSession {
  return {
    ...currentSession,
    claimQrSessionId: result.claim_qr_session_id,
    joinCode: result.join_code,
    sessionToken: result.sessionToken,
    status: result.status,
    qrStatus: result.qr_status,
    expiresAt: result.expires_at,
    numberOfAttempts: result.number_of_attempts,
    maxNumberOfAttempts: result.max_number_of_attempts,
    retriesRemaining: result.retries_remaining
  }
}

export async function joinUserClaimSession (
  joinCode: string
): Promise<JoinUserClaimSessionResult> {
  try {
    const sessionToken = generateSessionToken()
    const response = await api.claimVerification.joinSession({
      join_code: joinCode,
      session_token: sessionToken
    })

    return {
      ...response,
      sessionToken
    }
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchUserClaimSessionStatus (
  claimVerificationSessionId: string
): Promise<ClaimVerificationSessionStatusResponse> {
  try {
    return await api.claimVerification.getSessionStatus(claimVerificationSessionId)
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function retryUserClaimSession (
  claimVerificationSessionId: string
): Promise<RetryUserClaimSessionResult> {
  try {
    const sessionToken = generateSessionToken()
    const response = await api.claimVerification.retrySession(
      claimVerificationSessionId,
      {
        session_token: sessionToken
      }
    )

    return {
      ...response,
      sessionToken
    }
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function cancelUserClaimSession (
  claimVerificationSessionId: string
): Promise<CancelClaimVerificationSessionResponse> {
  try {
    return await api.claimVerification.cancelSession(claimVerificationSessionId)
  } catch (error) {
    throw mapApiError(error)
  }
}
