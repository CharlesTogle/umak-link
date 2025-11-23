import React, { useCallback, useState, useEffect, useRef } from 'react'
import {
  IonPage,
  IonToast,
  IonImg,
  IonText,
  IonIcon,
  IonSpinner
} from '@ionic/react'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { arrowForward } from 'ionicons/icons'
import { jwtDecode } from 'jwt-decode'
import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { useNavigation } from '@/shared/hooks/useNavigation'
import AdminBuilding from '@/shared/assets/umak-admin-building.jpg'
import UmakSeal from '@/shared/assets/umak-seal.png'
import OhsoLogo from '@/shared/assets/umak-ohso.png'
import { useAuth } from '../hooks/useAuth'
import type { GoogleLoginResponse } from '@capgo/capacitor-social-login'
import { useUser } from '@/features/auth/contexts/UserContext'
import '@/features/auth/styles/auth.css'

type GoogleResponseOnline = Awaited<ReturnType<typeof SocialLogin.login>>

interface GoogleJwtPayload {
  iss: string
  nbf: number
  aud: string
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name: string
  family_name: string
  iat: number
  exp: number
  jti?: string
}

const toSentenceCaseFull = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const RATE_LIMIT_MS = 3000 // 3 seconds

const Auth: React.FC = () => {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const { navigate } = useNavigation()
  const isWeb = Capacitor.getPlatform() === 'web'
  const [googleLoading, setGoogleLoading] = useState(false)
  const [socialLoginLoading, setSocialLoginLoading] = useState(false)

  // Rate limiting state
  const lastLoginAttempt = useRef<number>(0)
  const [isRateLimited, setIsRateLimited] = useState(false)

  const { refreshUser } = useUser()
  const { getOrRegisterAccount } = useAuth()

  useEffect(() => {
    const images = [AdminBuilding, UmakSeal, OhsoLogo]
    images.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  // Rate limiting check function
  const checkRateLimit = (): boolean => {
    const now = Date.now()
    const timeSinceLastAttempt = now - lastLoginAttempt.current

    if (timeSinceLastAttempt < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil(
        (RATE_LIMIT_MS - timeSinceLastAttempt) / 1000
      )
      setToastMessage(
        `Please wait ${remainingTime} second${
          remainingTime > 1 ? 's' : ''
        } before trying again.`
      )
      setShowToast(true)
      setIsRateLimited(true)
      return false
    }

    lastLoginAttempt.current = now
    setIsRateLimited(false)
    return true
  }

  const handleSocialLogin = useCallback(async () => {
    // Check rate limit
    if (!checkRateLimit()) {
      return
    }

    try {
      const googleWebClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
      await SocialLogin.initialize({
        google: { webClientId: googleWebClientId, mode: 'online' }
      })
      setSocialLoginLoading(true)
      const res: GoogleResponseOnline = await SocialLogin.login({
        provider: 'google',
        options: { scopes: ['profile', 'email'] }
      })
      if (res.provider === 'google') {
        const result = res.result as GoogleLoginResponse
        if ('profile' in result && 'idToken' in result) {
          const { name, email, imageUrl } = result.profile

          // Only allow org emails (e.g., must contain '@umak.edu.ph')
          if (!email || !/@umak\.edu\.ph$/i.test(email)) {
            setToastMessage(
              'Access Denied. Please use your organization email to sign in.'
            )
            setShowToast(true)
            setSocialLoginLoading(false)
            return
          }
          const { user, error } = await getOrRegisterAccount({
            googleIdToken: result.idToken || '',
            email: email || '',
            user_name: toSentenceCaseFull(name || 'New User'),
            profile_picture_url: imageUrl || ''
          })
          if (error || !user) {
            setToastMessage(
              'Login Failed. Authentication with Google was unsuccessful. Please try again.'
            )
            setShowToast(true)
            setSocialLoginLoading(false)
            return
          }
          await refreshUser(user?.user_id || '')
          const redirect = sessionStorage.getItem('redirect_after_login')
          if (redirect) {
            navigate(redirect)
            sessionStorage.removeItem('redirect_after_login')
          } else {
            const getRouteByUserType = (userType: string): string => {
              const type = userType.toLowerCase()
              const routeMap: Record<string, string> = {
                admin: '/admin/dashboard',
                staff: '/staff/home'
              }
              return routeMap[type] || '/user/home'
            }
            navigate(getRouteByUserType(user.user_type), 'auth')
          }
          setSocialLoginLoading(false)
        }
      }
    } catch (error) {
      console.error('Social login failed:', error)
      setToastMessage(
        `Sign-in failed. Please use your organization email to sign in or try again at a different time`
      )
      setShowToast(true)
    } finally {
      setSocialLoginLoading(false)
    }
  }, [navigate])

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    // Check rate limit
    if (!checkRateLimit()) {
      return
    }

    try {
      if (!credentialResponse.credential)
        throw new Error('No credential received')
      setGoogleLoading(true)
      const token = credentialResponse.credential
      const googleResponse = jwtDecode<GoogleJwtPayload>(token)
      // Only allow org emails (e.g., must contain '@umak.edu.ph')
      if (
        !googleResponse.email ||
        !/@umak\.edu\.ph$/i.test(googleResponse.email)
      ) {
        setToastMessage(
          'Access Denied. Please use your organization email to sign in.'
        )
        setShowToast(true)
        setGoogleLoading(false)
        return
      }
      const { user, error } = await getOrRegisterAccount({
        googleIdToken: token,
        email: googleResponse.email,
        user_name: toSentenceCaseFull(googleResponse.name),
        profile_picture_url: googleResponse.picture
      })
      if (error || !user) {
        setToastMessage(
          'Login Failed. Authentication with Google was unsuccessful.'
        )
        setShowToast(true)
        setGoogleLoading(false)
        return
      }
      await refreshUser(user?.user_id || '')
      const getRouteByUserType = (userType: string): string => {
        const type = userType.toLowerCase()
        const routeMap: Record<string, string> = {
          admin: '/admin/dashboard',
          staff: '/staff/home'
        }
        return routeMap[type] || '/user/home'
      }
      navigate(getRouteByUserType(user.user_type), 'auth')
      setGoogleLoading(false)
    } catch (error) {
      console.error('Google sign-in error:', error)
      setToastMessage(
        `Sign-in failed. Please try again. ${JSON.stringify(error)}`
      )
      setShowToast(true)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    setToastMessage(
      `Sign-in failed. Please use your organization email to sign in or try again at a different time`
    )
    setShowToast(true)
  }

  return (
    <IonPage>
      <div className='flex flex-col h-screen w-full relative overflow-hidden'>
        <div className='relative h-2/3 overflow-hidden'>
          <img
            src={AdminBuilding}
            className='absolute inset-0 h-full w-130 scale-150 object-cover object-center -translate-y-25'
            aria-hidden='true'
          />
          <div className='absolute inset-0 bg-gradient-to-b from-umak-blue/90 to-black/60' />
        </div>
        {/*  CHILD #2 — BOTTOM (50% height) : content container */}
        <div className='h-1/2 bottom-0 bg-white absolute w-full rounded-tr-4xl rounded-tl-4xl bg-gradient-to-b from-white/90 to-umak-blue/15'>
          {/*  FLEX + JUSTIFY-EVENLY for three sections */}
          <div className='h-full flex flex-col justify-evenly mx-10'>
            {/* PICTURES CONTAINER */}
            <div className='flex items-center justify-center gap-6'>
              <div className='flex justify-center items-center'>
                <IonImg
                  src={UmakSeal}
                  alt='University of Makati'
                  style={{ width: 120, height: 120 }}
                />
              </div>
              <div className='flex justify-center items-center'>
                <IonImg
                  src={OhsoLogo}
                  alt='UMAK OHSO'
                  style={{ width: 120, height: 120 }}
                />
              </div>
            </div>
            {/* TEXT CONTAINER */}
            <div className='text-center'>
              <p className='font-default-default text-5xl font-bold tracking-tight text-umak-blue'>
                UMak LINK
              </p>
              <IonText className='font-default-default text-lg leading-snug font-default-font text-slate-900'>
                <p className='mt-2'>
                  A place where you look for your
                  <br />
                  lost and found items
                </p>
              </IonText>
            </div>

            {/* BUTTONS CONTAINER */}
            <div className='w-full flex justify-center'>
              {isWeb ? (
                <div className='w-full flex justify-center'>
                  <div className='w-full google-login-button relative'>
                    {googleLoading && (
                      <div className='absolute inset-0 flex items-center justify-center bg-white/80 z-10'>
                        <IonSpinner name='crescent' color='primary' />
                      </div>
                    )}
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme='filled_blue'
                      size='large'
                      text='continue_with'
                      shape='square'
                      logo_alignment='center'
                      ux_mode='popup'
                    />
                  </div>
                </div>
              ) : (
                <button
                  className='w-full flex justify-center items-center bg-umak-blue! text-white font-default-font! p-4! rounded-lg!'
                  onClick={handleSocialLogin}
                  disabled={socialLoginLoading || isRateLimited}
                >
                  {socialLoginLoading ? (
                    <IonSpinner name='crescent' />
                  ) : (
                    <>
                      <p className='mr-3 font-default-font!'>
                        SIGN IN WITH UMAK EMAIL
                      </p>
                      <IonIcon icon={arrowForward} slot='end' />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position='top'
          color='danger'
        />
      </div>
    </IonPage>
  )
}

export default Auth
