/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import api from '@/shared/lib/api';
import { getE2EAuthUser } from '@/shared/lib/e2eAuth';
import { supabase } from '@/shared/lib/supabase';
import type { UserProfile } from '@/shared/lib/api-types';
import { makeDisplay } from '@/shared/utils/imageUtils';
import { saveCachedBlob } from '@/shared/utils/fileUtils';

// User type enum
export type UserType = 'User' | 'Staff' | 'Admin' | 'Guard';

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
const PROFILE_PICTURE_CACHE_FILE_NAME = 'profilePicture.webp';

function hasStatusCode(error: unknown, statusCode: number): boolean {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return false;
  }

  return error.statusCode === statusCode;
}

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

function getNonEmptyString (value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getSessionProfileFallbacks (metadata: unknown): {
  userName: string | null;
  profilePictureUrl: string | null;
} {
  if (typeof metadata !== 'object' || metadata === null) {
    return {
      userName: null,
      profilePictureUrl: null,
    };
  }

  const record = metadata as Record<string, unknown>;

  return {
    userName:
      getNonEmptyString(record.full_name) ??
      getNonEmptyString(record.name),
    profilePictureUrl:
      getNonEmptyString(record.avatar_url) ??
      getNonEmptyString(record.picture),
  };
}

function isManagedProfilePictureUrl (value: string | null): boolean {
  if (!value) {
    return false;
  }

  return value.includes('/profilePictures/') || value.includes('profilePictures');
}

async function uploadProfilePictureFromRemoteUrl (
  userId: string,
  imageUrl: string
): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote profile image: ${response.status}`);
  }

  const sourceBlob = await response.blob();
  const sourceType = sourceBlob.type || 'image/jpeg';
  const sourceExtension = sourceType.split('/')[1]?.split(';')[0] || 'jpg';
  const sourceFile = new File(
    [sourceBlob],
    `profile.${sourceExtension}`,
    { type: sourceType }
  );

  const displayBlob = await makeDisplay(sourceFile);
  const objectPath = `users/${userId}/${Date.now()}_profile.webp`;
  const uploadData = await api.storage.getUploadUrl(
    'profilePictures',
    objectPath,
    'image/webp'
  );

  const uploadRes = await fetch(uploadData.uploadUrl, {
    method: 'PUT',
    body: displayBlob,
    headers: {
      'Content-Type': 'image/webp',
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload profile image: ${uploadRes.status}`);
  }

  await api.storage.confirmUpload('profilePictures', uploadData.objectPath);
  await saveCachedBlob(displayBlob, PROFILE_PICTURE_CACHE_FILE_NAME, 'cache/images');

  return uploadData.publicUrl;
}

async function syncMissingProfileFieldsFromSession (
  profile: UserProfile,
  metadata: unknown
): Promise<UserProfile> {
  const fallbacks = getSessionProfileFallbacks(metadata);
  const currentUserName = getNonEmptyString(profile.user_name);
  const currentProfilePictureUrl = getNonEmptyString(profile.profile_picture_url);
  const updates: {
    user_name?: string | null;
    profile_picture_url?: string | null;
  } = {};

  if (!currentUserName && fallbacks.userName) {
    updates.user_name = fallbacks.userName;
  }

  let resolvedProfilePictureUrl = currentProfilePictureUrl;

  if (fallbacks.profilePictureUrl) {
    const shouldUploadManagedProfilePicture =
      !currentProfilePictureUrl ||
      !isManagedProfilePictureUrl(currentProfilePictureUrl);

    if (shouldUploadManagedProfilePicture) {
      try {
        resolvedProfilePictureUrl = await uploadProfilePictureFromRemoteUrl(
          profile.user_id,
          fallbacks.profilePictureUrl
        );
      } catch (error) {
        console.warn('[UserContext] Failed to upload Google profile picture to storage:', error);
        resolvedProfilePictureUrl = currentProfilePictureUrl ?? fallbacks.profilePictureUrl;
      }
    }
  }

  if (resolvedProfilePictureUrl && resolvedProfilePictureUrl !== currentProfilePictureUrl) {
    updates.profile_picture_url = resolvedProfilePictureUrl;
  }

  if (!updates.user_name && !updates.profile_picture_url) {
    return {
      ...profile,
      user_name: currentUserName ?? fallbacks.userName,
      profile_picture_url:
        resolvedProfilePictureUrl ??
        fallbacks.profilePictureUrl,
    };
  }

  try {
    const response = await api.auth.updateProfile(updates);
    return response.user;
  } catch (error) {
    console.warn('[UserContext] Failed to sync profile fields from session metadata:', error);
    return {
      ...profile,
      user_name: currentUserName ?? fallbacks.userName,
      profile_picture_url:
        resolvedProfilePictureUrl ??
        fallbacks.profilePictureUrl,
    };
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Store setUserState in a ref
  const setUserStateRef = useRef(setUserState);
  setUserStateRef.current = setUserState;
  const hasHydratedPersistedSessionRef = useRef(false);

  const fetchUser = useCallback(async () => {
    try {
      const e2eUser = getE2EAuthUser();
      if (e2eUser) {
        return mapUserProfileToUser(e2eUser);
      }

      // Check if we have a Supabase session
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        return null;
      }

      // Fetch user from backend API
      const response = await api.auth.getMe();
      const syncedProfile = await syncMissingProfileFieldsFromSession(
        response.user,
        data.session.user.user_metadata
      );
      return mapUserProfileToUser(syncedProfile);
    } catch (error) {
      console.error('[UserContext] Error fetching user:', error);
      if (hasStatusCode(error, 401)) {
        await supabase.auth.signOut();
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
        setUserState(null);
        return null;
      }

      setUserState(userData);
      return userData;
    } catch (error) {
      console.error('[UserContext] Error in getUser:', error);
      throw error;
    }
  }, [user, fetchUser]);

  const hydratePersistedSession = useCallback(async () => {
    setLoading(true);

    try {
      const userData = await fetchUser();
      setUserState(userData);
    } catch (error) {
      console.error('[UserContext] Error hydrating persisted session:', error);
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    if (hasHydratedPersistedSessionRef.current) {
      return;
    }

    hasHydratedPersistedSessionRef.current = true;
    void hydratePersistedSession();
  }, [hydratePersistedSession]);

  const refreshUser = useCallback(
    async (userId: string) => {
      void userId;

      try {
        setLoading(true);
        const userData = await fetchUser();
        setUserState(userData);
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
    await supabase.auth.signOut();
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
