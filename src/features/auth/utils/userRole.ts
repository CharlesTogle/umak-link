import type { UserType } from '@/shared/lib/api-types'

type RoleKey = 'user' | 'staff' | 'admin' | 'guard'

const ROLE_KEY_TO_USER_TYPE: Record<RoleKey, UserType> = {
  user: 'User',
  staff: 'Staff',
  admin: 'Admin',
  guard: 'Guard'
}

const RAW_ROLE_TO_ROLE_KEY: Record<string, RoleKey> = {
  user: 'user',
  student: 'user',
  staff: 'staff',
  admin: 'admin',
  guard: 'guard'
}

export function getNormalizedRoleKey (
  value: string | null | undefined
): RoleKey | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  return RAW_ROLE_TO_ROLE_KEY[normalized] ?? null
}

export function normalizeUserType (
  value: string | null | undefined
): UserType | null {
  const roleKey = getNormalizedRoleKey(value)
  return roleKey ? ROLE_KEY_TO_USER_TYPE[roleKey] : null
}

export function getHomeRouteForUserType (
  value: string | null | undefined
): string {
  const roleKey = getNormalizedRoleKey(value)

  if (roleKey === 'admin') return '/admin/dashboard'
  if (roleKey === 'staff') return '/staff/home'
  if (roleKey === 'guard') return '/guard/home'
  return '/user/home'
}

export function canAccessRedirectPathForUserType (
  path: string | null | undefined,
  value: string | null | undefined
): boolean {
  const roleKey = getNormalizedRoleKey(value)
  if (!roleKey || typeof path !== 'string') {
    return false
  }

  const normalizedPath = path.trim()
  if (!normalizedPath.startsWith('/')) {
    return false
  }

  if (normalizedPath === '/account') {
    return true
  }

  if (normalizedPath.startsWith('/user/')) {
    return roleKey === 'user'
  }

  if (normalizedPath.startsWith('/staff/')) {
    return roleKey === 'staff'
  }

  if (normalizedPath.startsWith('/admin/')) {
    return roleKey === 'admin'
  }

  if (normalizedPath.startsWith('/guard/')) {
    return roleKey === 'guard'
  }

  return false
}
