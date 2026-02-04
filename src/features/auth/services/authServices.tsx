import { googleLogout } from '@react-oauth/google';
import { SocialLogin } from '@capgo/capacitor-social-login';
import api from '@/shared/lib/api';
import type { User } from '@/features/auth/contexts/UserContext';
import { saveCachedImage } from '@/shared/utils/fileUtils';
import { makeThumb } from '@/shared/utils/imageUtils';
import { registerForPushNotifications } from '@/features/auth/services/registerForPushNotifications';
import { Capacitor } from '@capacitor/core';

export interface GoogleProfile {
  googleIdToken: string;
  email: string;
  user_name: string;
  profile_picture_url?: string;
}

interface LoginResponse {
  token?: string | null;
  user: User | null;
  error: string | null;
}

async function withRetries<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastError;
}

export const authServices = {
  /**
   * Sign in/register user with Google OAuth
   */
  GetOrRegisterAccount: async (profile: GoogleProfile): Promise<LoginResponse> => {
    try {
      console.log('[authServices] GetOrRegisterAccount called with:', profile);

      // Call backend API to login with Google
      const response = await api.auth.loginWithGoogle(profile.googleIdToken);

      if (!response.token || !response.user) {
        return { user: null, token: null, error: 'Login failed' };
      }

      // Store JWT token in API client
      api.setToken(response.token);

      const user = response.user;

      // Register for push notifications
      const deviceToken = await registerForPushNotifications().catch((err) => {
        console.error('[authServices] Push notification registration failed:', err);
        return null;
      });

      // Update notification token if available
      if (deviceToken && deviceToken !== user.notification_token) {
        // TODO: Add API endpoint to update notification token
        console.log('[authServices] Device token obtained:', deviceToken);
      }

      // Handle profile picture upload if provided and not already set
      let uploadedProfileUrl: string | null = user.profile_picture_url;
      if (profile?.profile_picture_url && !uploadedProfileUrl) {
        try {
          const userId = user.user_id;
          // Retry fetch up to 3 times
          const url = String(profile.profile_picture_url);
          const res = await withRetries(() => fetch(url), 3, 500);
          const srcBlob = await res.blob();

          const fileName = `${userId}_${Date.now()}_thumb.webp`;
          const file = new File([srcBlob], 'profile', {
            type: srcBlob.type || 'image/jpeg',
          });
          const thumbBlob = await makeThumb(file);

          // Get signed upload URL from backend
          const uploadData = await api.storage.getUploadUrl(
            'profilePictures',
            fileName,
            'image/webp'
          );

          // Upload to Supabase Storage using signed URL
          const uploadRes = await fetch(uploadData.uploadUrl, {
            method: 'PUT',
            body: thumbBlob,
            headers: {
              'Content-Type': 'image/webp',
            },
          });

          if (!uploadRes.ok) {
            throw new Error('Failed to upload profile picture');
          }

          // Confirm upload with backend
          await api.storage.confirmUpload('profilePictures', uploadData.objectPath);

          uploadedProfileUrl = uploadData.publicUrl;

          if (uploadedProfileUrl) {
            await saveCachedImage(uploadedProfileUrl, 'profilePicture', 'cache/images');
          }

          // Update user profile with new picture URL
          // TODO: Add API endpoint to update user profile
          console.log('[authServices] Profile picture uploaded:', uploadedProfileUrl);
        } catch (e) {
          console.warn('[authServices] Failed to mirror Google profile image:', e);
        }
      }

      return { user: response.user, token: response.token, error: null };
    } catch (error) {
      console.error('[authServices] Register exception:', error);
      return { user: null, token: null, error: 'Registration failed' };
    }
  },

  /**
   * Logout the current user
   */
  Logout: async (): Promise<{ error: string | null }> => {
    try {
      console.log('[authServices] Logout called');
      const isWeb = Capacitor.getPlatform() === 'web';

      // Clear JWT token from API client
      api.setToken(null);

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
        try {
          const googleWebClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
          await SocialLogin.initialize({
            google: { webClientId: googleWebClientId, mode: 'online' },
          });
          await SocialLogin.logout({ provider: 'google' });
          console.log('[authServices] Social logout successful');
        } catch (socialError) {
          console.log('[authServices] Social logout not needed or failed:', socialError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('[authServices] Logout exception:', error);
      return { error: 'Logout failed' };
    }
  },
};
