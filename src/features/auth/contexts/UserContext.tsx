import { createContext, useContext, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/shared/lib/supabase'
// User type enum
export type UserType = 'User' | 'Staff' | 'Admin'

// User interface matching Supabase columns
export interface User {
  user_id: string
  user_name: string
  email: string
  profile_picture_url: string | null
  user_type: UserType
  last_login: string | null
}

interface UserContextType {
  user: User | null
  loading: boolean
  getUser: () => Promise<User | null>
  setUser: (user: User | null) => void
  refreshUser: (userId: string) => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  clearUser: () => Promise<boolean>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider ({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Store setUserState in a ref
  const setUserStateRef = useRef(setUserState)
  setUserStateRef.current = setUserState

  const fetchUser = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_table')
        .select(
          'user_id, user_name, email, profile_picture_url, user_type, last_login'
        )
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data as User
    } catch (error) {
      console.error('[UserContext] Error fetching user:', error)
      return null
    }
  }, [])

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser)
  }, [])

  const getUser = useCallback(async (): Promise<User | null> => {
    // If user already exists in context, return it
    if (user) {
      return user
    }

    // Try to get user from Supabase auth
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user) {
        return null
      }

      console.log('[UserContext] Supabase auth user ID:', authData.user.id)

      // Fetch user data from user_table
      const userData = await fetchUser(authData.user.id)
      console.log('[UserContext] Fetched user data:', userData)

      if (!userData) {
        throw new Error('User data not found in database')
      }

      // Update context with fetched user
      // setUserState(userData)
      return userData
    } catch (error) {
      console.error('[UserContext] Error in getUser:', error)
      throw error
    }
  }, [user, fetchUser])

  const refreshUser = useCallback(
    async (userId: string) => {
      try {
        setLoading(true)
        const userData = await fetchUser(userId)
        if (userData) setUserState(userData)
      } catch (error) {
        console.error('[UserContext] Error refreshing user:', error)
      } finally {
        setLoading(false)
      }
    },
    [fetchUser]
  )

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user?.user_id) {
        console.error('[UserContext] No user to update')
        return
      }

      try {
        const { error } = await supabase
          .from('user_table')
          .update(updates)
          .eq('user_id', user.user_id)

        if (error) throw error
        setUserState(prev => (prev ? { ...prev, ...updates } : null))
      } catch (error) {
        console.error('[UserContext] Error updating user:', error)
        throw error
      }
    },
    [user?.user_id]
  )

  const clearUser = useCallback(async () => {
    setUserStateRef.current(null)
    return true
  }, []) // Now clearUser is stable and never changes

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        getUser,
        setUser,
        refreshUser,
        updateUser,
        clearUser
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser () {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
