import type { StoredUserClaimSession } from '@/features/user/claim-verification/types/user-claim-verification'

const ACTIVE_USER_CLAIM_SESSION_KEY = 'user.active-claim-session'

function canUseStorage (): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  )
}

export function readActiveUserClaimSession (): StoredUserClaimSession | null {
  if (!canUseStorage()) return null

  const rawValue = window.sessionStorage.getItem(ACTIVE_USER_CLAIM_SESSION_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as StoredUserClaimSession
  } catch {
    window.sessionStorage.removeItem(ACTIVE_USER_CLAIM_SESSION_KEY)
    return null
  }
}

export function storeActiveUserClaimSession (
  session: StoredUserClaimSession
): StoredUserClaimSession {
  if (canUseStorage()) {
    window.sessionStorage.setItem(
      ACTIVE_USER_CLAIM_SESSION_KEY,
      JSON.stringify(session)
    )
  }

  return session
}

export function clearActiveUserClaimSession (): void {
  if (!canUseStorage()) return
  window.sessionStorage.removeItem(ACTIVE_USER_CLAIM_SESSION_KEY)
}
