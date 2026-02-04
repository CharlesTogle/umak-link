import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import api from '@/shared/lib/api';

// User type enum
export type UserType = 'User' | 'Staff' | 'Admin';

// User interface matching backend API
export interface User {
  user_id: string;
  user_name: string;
  email: string;
  profile_picture_url: string | null;
  user_type: UserType;
  notification_token?: string | null;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  getUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  refreshUser: (userId: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearUser: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Store setUserState in a ref
  const setUserStateRef = useRef(setUserState);
  setUserStateRef.current = setUserState;

  const fetchUser = useCallback(async () => {
    try {
      // Check if we have a token
      if (!api.getToken()) {
        return null;
      }

      // Fetch user from backend API
      const response = await api.auth.getMe();
      return response.user as User;
    } catch (error) {
      console.error('[UserContext] Error fetching user:', error);
      // Clear token if unauthorized
      if ((error as any).statusCode === 401) {
        api.setToken(null);
      }
      return null;
    }
  }, []);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
  }, []);

  const getUser = useCallback(async (): Promise<User | null> => {
    // If user already exists in context, return it
    if (user) {
      return user;
    }

    // Try to get user from backend API
    try {
      const userData = await fetchUser();
      console.log('[UserContext] Fetched user data:', userData);

      if (!userData) {
        return null;
      }

      // Update context with fetched user
      // setUserState(userData)
      return userData;
    } catch (error) {
      console.error('[UserContext] Error in getUser:', error);
      throw error;
    }
  }, [user, fetchUser]);

  const refreshUser = useCallback(
    async (userId: string) => {
      try {
        setLoading(true);
        const userData = await fetchUser();
        if (userData) setUserState(userData);
      } catch (error) {
        console.error('[UserContext] Error refreshing user:', error);
      } finally {
        setLoading(false);
      }
    },
    [fetchUser]
  );

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user?.user_id) {
        console.error('[UserContext] No user to update');
        return;
      }

      try {
        // TODO: Add API endpoint to update user profile
        // For now, just update local state
        console.warn('[UserContext] User update API not yet implemented');
        setUserState((prev) => (prev ? { ...prev, ...updates } : null));
      } catch (error) {
        console.error('[UserContext] Error updating user:', error);
        throw error;
      }
    },
    [user?.user_id]
  );

  const clearUser = useCallback(async () => {
    setUserStateRef.current(null);
    api.setToken(null);
    return true;
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        getUser,
        setUser,
        refreshUser,
        updateUser,
        clearUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
