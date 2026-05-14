import type { GuardManualEntryPayload } from '@/features/guard/types/guard-custody'

function isObjectRecord (value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseGuardQrPayload (rawValue: string): GuardManualEntryPayload {
  const trimmedRawValue = rawValue.trim()

  if (!trimmedRawValue) {
    throw new Error('Ask the student to open the handover QR again.')
  }

  let parsedPayload: unknown

  try {
    parsedPayload = JSON.parse(trimmedRawValue)
  } catch {
    throw new Error('This is not a student handover QR code.')
  }

  if (!isObjectRecord(parsedPayload)) {
    throw new Error('This QR code does not contain the handover details.')
  }

  const qrCodeSessionId = String(parsedPayload.qr_code_session_id ?? '').trim()
  const sessionToken = String(parsedPayload.session_token ?? '').trim()

  if (!qrCodeSessionId || !sessionToken) {
    throw new Error('This QR code is missing the handover details.')
  }

  return {
    qrCodeSessionId,
    sessionToken
  }
}
