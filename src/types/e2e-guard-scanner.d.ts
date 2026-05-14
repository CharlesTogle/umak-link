declare global {
  interface Window {
    __UMAK_LINK_E2E_GUARD_QR_PAYLOAD?: {
      qr_code_session_id: string
      session_token: string
    }
  }
}

export {}
