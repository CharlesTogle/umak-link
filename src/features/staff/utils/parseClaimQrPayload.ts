import type { ClaimQrScanPayload } from '@/shared/lib/api-types'

function isObjectRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseClaimQrPayload (rawValue: string): ClaimQrScanPayload {
  const trimmedRawValue = rawValue.trim()

  if (!trimmedRawValue) {
    throw new Error('Ask the student to open the claim QR again.')
  }

  let parsedPayload: unknown

  try {
    parsedPayload = JSON.parse(trimmedRawValue)
  } catch {
    throw new Error('This is not a claim verification QR code.')
  }

  if (!isObjectRecord(parsedPayload)) {
    throw new Error('This QR code does not contain the claim verification details.')
  }

  const claimQrSessionId = String(parsedPayload.claim_qr_session_id ?? '').trim()
  const sessionToken = String(parsedPayload.session_token ?? '').trim()

  if (!claimQrSessionId || !sessionToken) {
    throw new Error('This QR code is missing the claim verification details.')
  }

  return {
    claimQrSessionId,
    sessionToken
  }
}
