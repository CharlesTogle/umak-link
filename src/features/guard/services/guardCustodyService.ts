import { ApiError, api } from '@/shared/lib/api'
import type {
  GuardActiveClaimReviewsResponse,
  GuardDecisionRequest,
  GuardDecisionResponse,
  GuardScanRequest,
  GuardScanResponse
} from '@/shared/lib/api-types'

export class GuardCustodyError extends Error {
  statusCode: number

  constructor (message: string, statusCode: number) {
    super(message)
    this.name = 'GuardCustodyError'
    this.statusCode = statusCode
  }
}

function mapGuardCustodyError (error: unknown): GuardCustodyError {
  if (error instanceof GuardCustodyError) {
    return error
  }

  if (error instanceof ApiError) {
    return new GuardCustodyError(error.message, error.statusCode)
  }

  return new GuardCustodyError('Guard custody request failed', 0)
}

export async function scanGuardCustodySession (
  payload: GuardScanRequest
): Promise<GuardScanResponse> {
  try {
    return await api.guardCustody.scan(payload)
  } catch (error) {
    throw mapGuardCustodyError(error)
  }
}

export async function submitGuardCustodyDecision (
  custodyAttemptId: string,
  payload: GuardDecisionRequest
): Promise<GuardDecisionResponse> {
  try {
    return await api.guardCustody.decide(custodyAttemptId, payload)
  } catch (error) {
    throw mapGuardCustodyError(error)
  }
}

export async function fetchGuardActiveClaimReviews (): Promise<GuardActiveClaimReviewsResponse> {
  try {
    return await api.guardCustody.listActiveClaimReviews()
  } catch (error) {
    throw mapGuardCustodyError(error)
  }
}
