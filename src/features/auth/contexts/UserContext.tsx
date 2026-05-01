import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import api from '@/shared/lib/api';
import type { UserProfile } from '@/shared/lib/api-types';

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

function mapUserProfileToUser(profile: UserProfile): User {
  return {
    user_id: profile.user_id,
    user_name: profile.user_name ?? profile.email ?? 'Unknown User',
    email: profile.email ?? '',
    profile_picture_url: profile.profile_picture_url,
    user_type: profile.user_type,
    notification_token: profile.notification_token,
  };
}

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
      return mapUserProfileToUser(response.user);
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
    async (_userId: string) => {
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
        // Call backend API to update profile
        const response = await api.auth.updateProfile({
          notification_token: updates.notification_token,
          user_name: updates.user_name,
          profile_picture_url: updates.profile_picture_url,
        });

        // Update local state with response from backend
        setUserState((prev) =>
          prev ? { ...prev, ...mapUserProfileToUser(response.user) } : null
        );
        console.log('[UserContext] User profile updated successfully');
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
