import type {
  ClaimQrSessionStatus,
  ClaimVerificationPostSummary,
  ClaimVerificationSessionStatus,
  JoinClaimVerificationSessionResponse,
  RetryClaimVerificationSessionResponse
} from '@/shared/lib/api-types'

export interface JoinUserClaimSessionResult
  extends JoinClaimVerificationSessionResponse {
  sessionToken: string
}

export interface RetryUserClaimSessionResult
  extends RetryClaimVerificationSessionResponse {
  sessionToken: string
}

export interface UserClaimManualCodeState {
  manualEntryCode: string
  expiresAt: string
}

export interface StoredUserClaimSession {
  claimVerificationSessionId: string
  claimQrSessionId: string
  joinCode: string
  sessionToken: string
  status: ClaimVerificationSessionStatus
  qrStatus: ClaimQrSessionStatus
  expiresAt: string
  numberOfAttempts: number
  maxNumberOfAttempts: number
  retriesRemaining: number
  foundPost: ClaimVerificationPostSummary
  createdAt: string
}

export interface UserClaimRouteParams {
  claimVerificationSessionId?: string
}
