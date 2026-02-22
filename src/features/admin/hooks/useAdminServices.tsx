import type { User } from '@/features/auth/contexts/UserContext'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import { useUser } from '@/features/auth/contexts/UserContext'
import { useState } from 'react'
import { adminApiService } from '@/shared/services'

export function useAdminServices () {
  const { insertAuditLog } = useAuditLogs()
  const { getUser } = useUser()
  const [user, setUser] = useState<User | null>(null)

  const getAllStaffAndAdmin = async (): Promise<Partial<User>[] | null> => {
    try {
      const users = await adminApiService.getUsers({ user_type: ['Admin', 'Staff'] })
      // Map UserProfile to User format (handle null -> undefined for user_name)
      return (users || []).map(u => ({
        user_id: u.user_id,
        user_name: u.user_name ?? undefined,
        email: u.email ?? undefined,
        profile_picture_url: u.profile_picture_url ?? undefined,
        user_type: u.user_type
      })) as Partial<User>[]
    } catch (error) {
      console.error('Error fetching staff and admin users:', error)
      return null
    }
  }

  const removeAdminOrStaffMember = async ({
    userId,
    email,
    name,
    previousRole
  }: {
    userId: string
    email: string
    name: string
    previousRole: 'Staff' | 'Admin'
  }): Promise<boolean> => {
    let currentUser = user

    if (!user) {
      currentUser = await getUser()
      setUser(currentUser)
    }

    try {
      await adminApiService.updateUserRole(userId, 'User')

      await insertAuditLog({
        user_id: currentUser?.user_id || 'unknown',
        action_type: 'role_updated',
        details: {
          message: `${
            currentUser?.user_name || 'Admin'
          } set the role for ${name} as User`,
          target_user_id: userId,
          target_user: email,
          old_role: previousRole,
          new_role: 'User'
        }
      })

      return true
    } catch (error) {
      console.error('Error removing admin/staff member:', error)
      return false
    }
  }

  const updateUserRole = async ({
    userId,
    email,
    name,
    role
  }: {
    userId: string
    email: string
    name: string
    role: 'Staff' | 'Admin'
  }): Promise<boolean> => {
    try {
      let currentUser = user

      if (!user) {
        currentUser = await getUser()
        setUser(currentUser)
      }

      // Pass 'User' as previous role to ensure only regular users can be promoted
      await adminApiService.updateUserRole(userId, role, 'User')

      await insertAuditLog({
        user_id: currentUser?.user_id || 'unknown',
        action_type: 'role_updated',
        details: {
          message: `${
            currentUser?.user_name || 'Admin'
          } set the role for ${name} as ${role}`,
          target_user: email,
          old_role: 'User',
          new_role: role
        }
      })

      return true
    } catch (error) {
      console.error('Exception adding staff member:', error)
      return false
    }
  }

  return { getAllStaffAndAdmin, removeAdminOrStaffMember, updateUserRole }
}
