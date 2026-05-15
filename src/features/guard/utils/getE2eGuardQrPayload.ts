import type { GuardQrPayload } from '@/features/guard/types/guard-custody'

function isE2EGuardScanEnabled (): boolean {
  return (
    import.meta.env.VITE_ENABLE_E2E_AUTH === 'true' ||
    import.meta.env.VITE_E2E_AUTH === 'true'
  )
}

export function getE2EGuardQrPayload (): GuardQrPayload | null {
  if (!isE2EGuardScanEnabled() || typeof window === 'undefined') {
    return null
  }

  const payload = window.__UMAK_LINK_E2E_GUARD_QR_PAYLOAD

  if (!payload) {
    return null
  }

  const qrCodeSessionId = payload.qr_code_session_id.trim()
  const sessionToken = payload.session_token.trim()

  if (!qrCodeSessionId || !sessionToken) {
    return null
  }

  return {
    qrCodeSessionId,
    sessionToken
  }
}
