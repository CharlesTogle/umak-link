import type { UserProfile } from '@/shared/lib/api-types'

export const E2E_AUTH_USER_STORAGE_KEY = 'umak-link:e2e-auth-user'
export const E2E_AUTH_TOKEN_STORAGE_KEY = 'umak-link:e2e-auth-token'

function isE2EAuthEnabled(): boolean {
  return (
    import.meta.env.VITE_ENABLE_E2E_AUTH === 'true' ||
    import.meta.env.VITE_E2E_AUTH === 'true'
  )
}

export function getE2EAuthUser(): UserProfile | null {
  if (!isE2EAuthEnabled() || typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(E2E_AUTH_USER_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<UserProfile>

    if (
      typeof parsed.user_id !== 'string' ||
      typeof parsed.user_name !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.user_type !== 'string'
    ) {
      return null
    }

    return {
      user_id: parsed.user_id,
      user_name: parsed.user_name,
      email: parsed.email,
      profile_picture_url: parsed.profile_picture_url ?? null,
      user_type: parsed.user_type,
      notification_token: parsed.notification_token ?? null
    }
  } catch (error) {
    console.error('[e2eAuth] Failed to parse test user override:', error)
    return null
  }
}

export function getE2eAccessToken(): string | null {
  if (!isE2EAuthEnabled() || typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(E2E_AUTH_TOKEN_STORAGE_KEY)
}

export function clearE2eAuthOverride(): void {
  if (!isE2EAuthEnabled() || typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(E2E_AUTH_USER_STORAGE_KEY)
  window.localStorage.removeItem(E2E_AUTH_TOKEN_STORAGE_KEY)
}
