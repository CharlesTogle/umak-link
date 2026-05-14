import { api, ApiError } from '@/shared/lib/api'
import type {
  CustodyHistoryResponse,
  CustodySessionStatusResponse,
  GuardPostRecord
} from '@/shared/lib/api-types'
import { makeDisplay } from '@/shared/utils/imageUtils'
import { computeBlockHash64 } from '@/shared/utils/hashUtils'
import { uploadAndGetPublicUrl } from '@/shared/utils/supabaseStorageUtils'
import type {
  CreateUserCustodyAttemptInput,
  RetryUserCustodySessionResult,
  StartUserCustodyAttemptResult,
  StoredUserCustodySession
} from '@/features/user/custody/types/user-custody'

export class UserCustodyError extends Error {
  constructor (
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'UserCustodyError'
  }
}

function mapApiError (error: unknown): UserCustodyError {
  if (error instanceof ApiError) {
    return new UserCustodyError(error.message, error.statusCode, error.data)
  }

  if (error instanceof Error) {
    return new UserCustodyError(error.message, 0, error)
  }

  return new UserCustodyError('User custody request failed', 0)
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

export function buildUserCustodyQrValue (
  activeSession: StoredUserCustodySession
): string {
  return JSON.stringify({
    qr_code_session_id: activeSession.qrCodeSessionId,
    session_token: activeSession.sessionToken
  })
}

export function mapStartAttemptResultToStoredSession (
  result: StartUserCustodyAttemptResult,
  postId: number
): StoredUserCustodySession {
  return {
    postId,
    custodyAttemptId: result.custody_attempt_id,
    qrCodeSessionId: result.qr_code_session_id,
    sessionToken: result.sessionToken,
    guardPostId: result.guardPostId,
    guardPostName: result.guardPostName,
    handoverImageHash: result.handoverImageHash,
    handoverImageUrl: result.handoverImageUrl,
    custodyStatus: result.custody_status,
    attemptStatus: result.attempt_status,
    qrStatus: result.qr_status,
    expiresAt: result.expires_at,
    numberOfAttempts: result.number_of_attempts,
    maxNumberOfAttempts: result.max_number_of_attempts,
    retriesRemaining: result.retries_remaining,
    createdAt: new Date().toISOString()
  }
}

export function mapRetryResultToStoredSession (
  currentSession: StoredUserCustodySession,
  result: RetryUserCustodySessionResult
): StoredUserCustodySession {
  return {
    ...currentSession,
    sessionToken: result.sessionToken,
    custodyStatus: result.custody_status,
    attemptStatus: result.attempt_status,
    qrStatus: result.qr_status,
    expiresAt: result.expires_at,
    numberOfAttempts: result.number_of_attempts,
    maxNumberOfAttempts: result.max_number_of_attempts,
    retriesRemaining: result.retries_remaining
  }
}

export async function listGuardPosts (): Promise<GuardPostRecord[]> {
  try {
    const response = await api.custody.listGuardPosts()
    return response.guard_posts
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchUserCustodyHistory (
  postId: number
): Promise<CustodyHistoryResponse> {
  try {
    return await api.custody.getPostHistory(postId)
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchUserCustodySessionStatus (
  qrCodeSessionId: string
): Promise<CustodySessionStatusResponse> {
  try {
    return await api.custody.getSessionStatus(qrCodeSessionId)
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function startUserCustodyAttempt (
  input: CreateUserCustodyAttemptInput
): Promise<StartUserCustodyAttemptResult> {
  try {
    const sessionToken = generateSessionToken()
    const displayBlob = await makeDisplay(input.handoverImage)
    const handoverImageHash = await computeBlockHash64(input.handoverImage)
    const handoverImageUrl = await uploadAndGetPublicUrl(
      `custody/${input.postId}/${Date.now()}.webp`,
      displayBlob,
      'image/webp'
    )

    const response = await api.custody.createAttempt({
      post_id: input.postId,
      guard_post_id: input.guardPostId,
      handover_image_url: handoverImageUrl,
      handover_image_hash: handoverImageHash,
      session_token: sessionToken
    })

    return {
      ...response,
      guardPostId: input.guardPostId,
      guardPostName: input.guardPostName,
      handoverImageHash,
      handoverImageUrl,
      sessionToken
    }
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function retryUserCustodySession (
  qrCodeSessionId: string
): Promise<RetryUserCustodySessionResult> {
  try {
    const sessionToken = generateSessionToken()
    const response = await api.custody.retrySession(qrCodeSessionId, {
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

export async function cancelUserCustodySession (qrCodeSessionId: string) {
  try {
    return await api.custody.cancelSession(qrCodeSessionId)
  } catch (error) {
    throw mapApiError(error)
  }
}
