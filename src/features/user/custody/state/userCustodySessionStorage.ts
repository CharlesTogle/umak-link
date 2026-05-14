import type { StoredUserCustodySession } from '@/features/user/custody/types/user-custody'

const ACTIVE_USER_CUSTODY_SESSION_KEY = 'user.active-custody-session'

function canUseStorage (): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  )
}

export function readActiveUserCustodySession (): StoredUserCustodySession | null {
  if (!canUseStorage()) return null

  const rawValue = window.sessionStorage.getItem(ACTIVE_USER_CUSTODY_SESSION_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as StoredUserCustodySession
  } catch {
    window.sessionStorage.removeItem(ACTIVE_USER_CUSTODY_SESSION_KEY)
    return null
  }
}

export function storeActiveUserCustodySession (
  session: StoredUserCustodySession
): StoredUserCustodySession {
  if (canUseStorage()) {
    window.sessionStorage.setItem(
      ACTIVE_USER_CUSTODY_SESSION_KEY,
      JSON.stringify(session)
    )
  }

  return session
}

export function clearActiveUserCustodySession (): void {
  if (!canUseStorage()) return
  window.sessionStorage.removeItem(ACTIVE_USER_CUSTODY_SESSION_KEY)
}
