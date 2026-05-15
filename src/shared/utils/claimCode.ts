const CLAIM_CODE_LENGTH = 6

export function normalizeClaimCodeInput (value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CLAIM_CODE_LENGTH)
}

export function formatClaimCodeForDisplay (code: string): string {
  return code.replace(/(.{3})(?=.)/g, '$1 ')
}
