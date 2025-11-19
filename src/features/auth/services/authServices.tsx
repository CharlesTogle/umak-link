import { googleLogout } from '@react-oauth/google'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { supabase } from '@/shared/lib/supabase'
import type { User } from '@/features/auth/contexts/UserContext'
import { saveCachedImage } from '@/shared/utils/fileUtils'
import { makeThumb } from '@/shared/utils/imageUtils'
import { registerForPushNotifications } from '@/features/auth/services/registerForPushNotifications'

export interface GoogleProfile {
  googleIdToken: string
  email: string
  user_name: string
  profile_picture_url?: string
}

interface LoginResponse {
  token?: string | null
  user: User | null
  error: string | null
}

async function withRetries<T> (
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  let lastError: any
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < retries - 1) await new Promise(res => setTimeout(res, delay))
    }
  }
  throw lastError
}

export const authServices = {
  /**
   * Sign in an existing user with email and password
   */

  GetOrRegisterAccount: async (
    profile: GoogleProfile
  ): Promise<LoginResponse> => {
    try {
      console.log('[authServices] GetOrRegisterAccount called with:', profile)

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: profile.googleIdToken
        })

      if (signInError) return { user: null, error: signInError.message }

      const session = signInData.session
      const supabaseUser = signInData.user
      if (!session || !supabaseUser)
        return { user: null, token: null, error: 'No session returned' }

      const deviceToken = await registerForPushNotifications().catch(err => {
        console.error(
          '[authServices] Push notification registration failed:',
          err
        )
      })

      const authoritativeEmail = supabaseUser.email ?? profile?.email ?? null

      if (!authoritativeEmail) {
        return {
          user: null,
          token: null,
          error: 'No email available from identity provider'
        }
      }

      let uploadedProfileUrl: string | null = null
      if (profile?.profile_picture_url) {
        try {
          const userId = supabaseUser.id
          // Retry fetch up to 3 times
          const url = String(profile.profile_picture_url)
          const res = await withRetries(() => fetch(url), 3, 500)
          const srcBlob = await res.blob()

          const basePath = `users/${userId}/${Date.now()}`
          const file = new File([srcBlob], 'profile', {
            type: srcBlob.type || 'image/jpeg'
          })
          const thumbBlob = await makeThumb(file)

          const bucket = supabase.storage.from('profilePictures')
          const thumbPath = `${basePath}_thumb.webp`
          const { error: upErr } = await bucket.upload(thumbPath, thumbBlob, {
            contentType: 'image/webp',
            upsert: true
          })
          if (upErr) throw upErr
          const { data: pub } = bucket.getPublicUrl(thumbPath)
          uploadedProfileUrl = pub.publicUrl || null

          if (uploadedProfileUrl) {
            await saveCachedImage(
              uploadedProfileUrl,
              'profilePicture',
              'cache/images'
            )
          }
        } catch (e) {
          console.warn(
            '[authServices] Failed to mirror Google profile image:',
            e
          )
        }
      }

      const newUserRow = {
        user_id: supabaseUser.id,
        user_name:
          profile?.user_name ?? supabaseUser.user_metadata?.name ?? 'New User',
        email: authoritativeEmail,
        last_login: new Date().toISOString(),
        ...(uploadedProfileUrl
          ? { profile_picture_url: uploadedProfileUrl }
          : {}),
        ...(deviceToken ? { notification_token: deviceToken } : {})
      }

      const { data: userRow, error: upsertErr } = await supabase
        .from('user_table')
        .upsert(newUserRow, { onConflict: 'user_id' })
        .select()
        .single()

      if (upsertErr)
        return { user: null, token: null, error: upsertErr.message }

      return { user: userRow, token: session.access_token, error: null }
    } catch (error) {
      console.error('[authServices] Register exception:', error)
      return { user: null, token: null, error: 'Registration failed' }
    }
  },

  /**
   * Logout the current user
   */
  Logout: async (): Promise<{ error: string | null }> => {
    try {
      console.log('[authServices] Logout called')
      // 1. Sign out from Supabase
      const { error: supabaseError } = await supabase.auth.signOut()

      if (supabaseError) {
        console.error('[authServices] Logout supabase error:', supabaseError)
        return { error: supabaseError.message }
      }
      try {
        googleLogout()
      } catch (googleError) {
        console.log(
          '[authServices] Google logout not needed or failed:',
          googleError
        )
      }
      try {
        await SocialLogin.logout({ provider: 'google' })
      } catch (socialError) {
        console.log(
          '[authServices] Social logout not needed or failed:',
          socialError
        )
      }
      return { error: null }
    } catch (error) {
      console.error('[authServices] Logout exception:', error)
      return { error: 'Logout failed' }
    }
  }
}
