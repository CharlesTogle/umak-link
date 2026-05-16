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

  const payloadType = String(parsedPayload.payload_type ?? '').trim()

  if (payloadType === 'staff_claim_manual_entry_code') {
    const manualEntryCode = String(parsedPayload.manual_entry_code ?? '').trim()

    if (!manualEntryCode) {
      throw new Error('This QR code is missing the student claim code.')
    }

    return {
      kind: 'staff_claim_manual_code',
      manualEntryCode
    }
  }

  if (payloadType === 'staff_claim_user_identity') {
    const userId = String(parsedPayload.user_id ?? '').trim()
    const userName = String(parsedPayload.user_name ?? '').trim()
    const email = String(parsedPayload.email ?? '').trim()
    const profilePictureUrl =
      typeof parsedPayload.profile_picture_url === 'string'
        ? parsedPayload.profile_picture_url
        : null

    if (!userId || !userName || !email) {
      throw new Error('This QR code is missing the student claim details.')
    }

    return {
      kind: 'staff_claim_user_identity',
      userId,
      userName,
      email,
      profilePictureUrl
    }
  }

  const claimQrSessionId = String(parsedPayload.claim_qr_session_id ?? '').trim()
  const sessionToken = String(parsedPayload.session_token ?? '').trim()

  if (!claimQrSessionId || !sessionToken) {
    throw new Error('This QR code is missing the claim verification details.')
  }

  return {
    kind: 'claim_session',
    claimQrSessionId,
    sessionToken
  }
}
