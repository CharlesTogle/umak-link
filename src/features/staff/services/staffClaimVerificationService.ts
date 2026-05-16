import { api, ApiError } from '@/shared/lib/api'
import type {
  ClaimVerificationSessionStatusResponse,
  CreateClaimVerificationSessionResponse,
  ScanClaimVerificationResponse
} from '@/shared/lib/api-types'

export class StaffClaimVerificationError extends Error {
  constructor (
    message: string,
    public statusCode: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'StaffClaimVerificationError'
  }
}

function mapApiError (error: unknown): StaffClaimVerificationError {
  if (error instanceof ApiError) {
    return new StaffClaimVerificationError(error.message, error.statusCode, error.data)
  }

  if (error instanceof Error) {
    return new StaffClaimVerificationError(error.message, 0, error)
  }

  return new StaffClaimVerificationError('Claim verification request failed.', 0)
}

export async function createStaffClaimVerificationSession (
  foundPostId: number
): Promise<CreateClaimVerificationSessionResponse> {
  try {
    return await api.claimVerification.createSession({
      found_post_id: foundPostId
    })
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function fetchStaffClaimVerificationSessionStatus (
  claimVerificationSessionId: string
): Promise<ClaimVerificationSessionStatusResponse> {
  try {
    return await api.claimVerification.getSessionStatus(claimVerificationSessionId)
  } catch (error) {
    throw mapApiError(error)
  }
}

export async function scanStaffClaimVerificationSession (params: {
  claimQrSessionId: string
  sessionToken: string
}): Promise<ScanClaimVerificationResponse> {
  try {
    return await api.claimVerification.scanSession({
      claim_qr_session_id: params.claimQrSessionId,
      session_token: params.sessionToken
    })
  } catch (error) {
    throw mapApiError(error)
  }
}
