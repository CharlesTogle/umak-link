import { googleLogout } from '@react-oauth/google';
import { SocialLogin } from '@capgo/capacitor-social-login';
import api from '@/shared/lib/api';
import { clearE2eAuthOverride } from '@/shared/lib/e2eAuth';
import { getUiErrorMessage } from '@/shared/lib/errorHandling';
import { supabase } from '@/shared/lib/supabase';
import type { UserProfile } from '@/shared/lib/api-types';
import type { User } from '@/features/auth/contexts/UserContext';
import { Capacitor } from '@capacitor/core';
import { registerForPushNotifications } from '@/features/auth/services/registerForPushNotifications';
import { deleteCachedFile } from '@/shared/utils/fileUtils';
import { normalizeUserType } from '@/features/auth/utils/userRole';

const PROFILE_PICTURE_CACHE_FILE_NAME = 'profilePicture.webp';

export interface GoogleProfile {
  googleIdToken: string;
  email: string;
  user_name: string;
  profile_picture_url?: string;
}

interface LoginResponse {
  user: User | null;
  error: string | null;
}

function getErrorMessage(error: unknown): string {
  return getUiErrorMessage(error, {
    context: 'auth',
    fallback: 'Unable to complete sign in. Please try again.'
  });
}

function mapUserProfileToUser(profile: UserProfile): User {
  const normalizedUserType = normalizeUserType(profile.user_type) ?? 'User';

  return {
    user_id: profile.user_id,
    user_name: profile.user_name ?? profile.email ?? 'Unknown User',
    email: profile.email ?? '',
    profile_picture_url: profile.profile_picture_url,
    user_type: normalizedUserType,
    notification_token: profile.notification_token,
  };
}

export const authServices = {
  /**
   * Sign in/register user with Google OAuth via Supabase
   */
  GetOrRegisterAccount: async (profile: GoogleProfile): Promise<LoginResponse> => {
    try {
      console.log('[authServices] GetOrRegisterAccount called with:', profile.email);

      // Exchange Google ID token for a Supabase session
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: profile.googleIdToken,
      });

      if (signInError) {
        console.error('[authServices] Supabase signInWithIdToken failed:', signInError);
        return { user: null, error: getErrorMessage(signInError) };
      }

      // Fetch user profile from backend (backend resolves via supabase token)
      const response = await api.auth.getMe();

      if (!response.user) {
        return { user: null, error: 'Failed to fetch user profile' };
      }

      const user = mapUserProfileToUser(response.user);

      if (user.user_type === 'Staff' || user.user_type === 'Admin' || user.user_type === 'Guard') {
        void api.auth.appLoginAudit().catch((error) => {
          console.error('[authServices] App login audit failed:', error)
        })
      }

      // Register for push notifications
      const deviceToken = await registerForPushNotifications().catch((err) => {
        console.error('[authServices] Push notification registration failed:', err);
        return null;
      });

      if (deviceToken && deviceToken !== user.notification_token) {
        try {
          await api.auth.updateProfile({ notification_token: deviceToken });
          console.log('[authServices] Device token registered successfully');
        } catch (error) {
          console.error('[authServices] Failed to register device token:', error);
        }
      }

      return { user, error: null };
    } catch (error) {
      console.error('[authServices] Register exception:', error);
      return { user: null, error: getErrorMessage(error) };
    }
  },

  /**
   * Logout the current user
   */
  Logout: async (): Promise<{ error: string | null }> => {
    try {
      console.log('[authServices] Logout called');
      const isWeb = Capacitor.getPlatform() === 'web';
      clearE2eAuthOverride();

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }

      // Google logout for web
      if (isWeb) {
        try {
          googleLogout();
        } catch (googleError) {
          console.log('[authServices] Google logout not needed or failed:', googleError);
        }
      }

      // SocialLogin logout for native
      if (!isWeb) {
        const googleWebClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
        void (async () => {
          try {
            await SocialLogin.initialize({
              google: { webClientId: googleWebClientId, mode: 'online' },
            });
            await SocialLogin.logout({ provider: 'google' });
            console.log('[authServices] Social logout successful');
          } catch (socialError) {
            console.log('[authServices] Social logout not needed or failed:', socialError);
          }
        })();
      }

      const didDeleteCachedProfilePicture = await deleteCachedFile(
        PROFILE_PICTURE_CACHE_FILE_NAME,
        'cache/images'
      );
      if (!didDeleteCachedProfilePicture) {
        console.warn('[authServices] Cached profile picture was already missing or could not be deleted');
      }

      return { error: null };
    } catch (error) {
      console.error('[authServices] Logout exception:', error);
      return { error: 'Logout failed' };
    }
  },
};
