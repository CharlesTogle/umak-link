import { supabase } from '@/shared/lib/supabase'
import type { User } from '@/features/auth/contexts/UserContext'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import { useUser } from '@/features/auth/contexts/UserContext'
import { useState } from 'react'

export function useAdminServices () {
  const { insertAuditLog } = useAuditLogs()
  const { getUser } = useUser()
  const [user, setUser] = useState<User | null>(null)

  const getAllStaffAndAdmin = async (): Promise<Partial<User>[] | null> => {
    const { data, error } = await supabase
      .from('user_table')
      .select('user_id, user_name, email, profile_picture_url, user_type')
      .in('user_type', ['Admin', 'Staff'])

    if (error) {
      console.error('Error fetching staff and admin users:', error)
      return null
    }
    console.log(data)
    return data || null
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

    // We have the target user's email available as a parameter. To avoid
    // an extra DB call, use the email as the display name in audit logs.

    const { error } = await supabase
      .from('user_table')
      .update({ user_type: 'User' })
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing admin/staff member:', error)
      return false
    }

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

      // Use provided email as the display name for the target user to avoid
      // an extra DB query. If a nicer display name is needed later, enrich
      // the caller or fetch in a non-blocking path.

      const { error } = await supabase
        .from('user_table')
        .update({ user_type: role })
        .eq('user_id', userId)
        .eq('user_type', 'User') // Ensure only regular users can be promoted

      if (error) {
        console.error('Error adding staff member:', error)
        return false
      }

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
