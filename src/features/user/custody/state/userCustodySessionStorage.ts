import type { StoredUserCustodySession } from '@/features/user/custody/types/user-custody'

const ACTIVE_USER_CUSTODY_SESSION_KEY = 'user.active-custody-session'

function canUseStorage (): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  )
}

export function readActiveUserCustodySession (): StoredUserCustodySession | null {
  if (!canUseStorage()) return null

  const rawValue = window.localStorage.getItem(ACTIVE_USER_CUSTODY_SESSION_KEY)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue) as StoredUserCustodySession
  } catch {
    window.localStorage.removeItem(ACTIVE_USER_CUSTODY_SESSION_KEY)
    return null
  }
}

export function readResumableUserCustodySession (
  postId: number
): StoredUserCustodySession | null {
  const session = readActiveUserCustodySession()

  if (!session || session.postId !== postId || session.attemptStatus !== 'open') {
    return null
  }

  return session
}

export function storeActiveUserCustodySession (
  session: StoredUserCustodySession
): StoredUserCustodySession {
  if (canUseStorage()) {
    window.localStorage.setItem(
      ACTIVE_USER_CUSTODY_SESSION_KEY,
      JSON.stringify(session)
    )
  }

  return session
}

export function clearActiveUserCustodySession (): void {
  if (!canUseStorage()) return
  window.localStorage.removeItem(ACTIVE_USER_CUSTODY_SESSION_KEY)
}
