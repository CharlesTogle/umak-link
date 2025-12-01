import { useEffect, useState, useRef } from 'react'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useUser } from '@/features/auth/contexts/UserContext'
import { SocialLogin } from '@capgo/capacitor-social-login'
import AdminBuilding from '@/shared/assets/umak-admin-building.jpg'
import UmakSeal from '@/shared/assets/umak-seal.png'
import OhsoLogo from '@/shared/assets/umak-ohso.png'
import {
  IonPage,
  IonImg,
  IonText,
  IonIcon,
  IonSpinner,
  IonToast
} from '@ionic/react'
import { arrowForward } from 'ionicons/icons'
import { Capacitor } from '@capacitor/core'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { GoogleLoginResponse } from '@capgo/capacitor-social-login'
import '@/features/auth/styles/auth.css'

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
  const [showAuth, setShowAuth] = useState(false)
  const { navigate } = useNavigation()
  const { refreshUser, getUser } = useUser()

  // Auth-related state
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const isWeb = Capacitor.getPlatform() === 'web'
  const [googleLoading, setGoogleLoading] = useState(false)
  const [socialLoginLoading, setSocialLoginLoading] = useState(false)

  // Rate limiting state
  const lastLoginAttempt = useRef<number>(0)
  const [isRateLimited, setIsRateLimited] = useState(false)

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

  const getRouteByUserType = (userType: string): string => {
    const type = userType.toLowerCase()
    const routeMap: Record<string, string> = {
      admin: '/admin/dashboard',
      staff: '/staff/home'
    }
    return routeMap[type] || '/user/home'
  }

  const handleSocialLogin = async () => {
    // Check rate limit
    // if (!checkRateLimit()) {
    //   return
    // }

    // Prevent re-entry if already loading
    if (socialLoginLoading) return

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
      console.log('[Auth] SocialLogin result:', res)

      if (res.provider === 'google') {
        const result = res.result as GoogleLoginResponse
        console.log('[Auth] SocialLogin result.payload:', result)

        if ('profile' in result && 'idToken' in result) {
          const { name, email, imageUrl } = result.profile

          // Only allow org emails (e.g., must contain '@umak.edu.ph')
          if (!email || !/@umak\.edu\.ph$/i.test(email)) {
            setToastMessage(
              'Access Denied. Please use your organization email to sign in.'
            )
            setShowToast(true)
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
            return
          }

          await refreshUser(user?.user_id || '')
          const redirect = sessionStorage.getItem('redirect_after_login')
          if (redirect) {
            navigate(redirect)
            sessionStorage.removeItem('redirect_after_login')
          } else {
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
      setSocialLoginLoading(false)
    }
  }

  // useEffect(() => {})
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

      navigate(getRouteByUserType(user.user_type), 'auth')
      setGoogleLoading(false)
    } catch (error) {
      console.error('Google sign-in error:', error)
      setToastMessage(
        `Sign-in failed. Please try again. ${JSON.stringify(error)}`
      )
      setShowToast(true)
      setGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    setToastMessage(
      `Sign-in failed. Please use your organization email to sign in or try again at a different time`
    )
    setShowToast(true)
  }

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getUser()
        if (currentUser) {
          console.log('[Auth] User is authenticated:', currentUser)
          await refreshUser(currentUser.user_id)
          navigate(getRouteByUserType(currentUser.user_type), 'auth')
        } else {
          setShowAuth(true)
        }
      } catch (error) {
        console.error(error)
        setShowAuth(true)
      }
    }

    checkAuth()
  }, [])

  return (
    <IonPage className='relative h-full'>
      <div
        className='relative overflow-hidden transition-all duration-1500'
        style={{
          height: showAuth ? '66.666667%' : '100%',
          opacity: showAuth ? 1 : 1
        }}
      >
        <img
          src={AdminBuilding}
          className='absolute inset-0 h-full w-130 scale-150 object-cover object-center -translate-y-25'
          aria-hidden='true'
        />
        <div className='absolute inset-0 bg-gradient-to-b from-umak-blue/90 to-black/60' />
      </div>
      <div className='absolute top-45 w-full flex items-center justify-center gap-10 transition-all duration-1000'>
        <div
          className='flex justify-center items-center transition-all duration-1000 animate-pulse'
          style={{
            transform: showAuth ? 'translateX(-200px)' : 'translateX(0)',
            opacity: showAuth ? 0 : 1,
            transition: 'transform 1000ms ease, opacity 1000ms ease'
          }}
        >
          <IonImg
            src={UmakSeal}
            alt='University of Makati'
            style={{ width: 120, height: 120 }}
          />
        </div>
        <div
          className='flex justify-center items-center transition-all duration-1000 animate-pulse'
          style={{
            transform: showAuth ? 'translateX(200px)' : 'translateX(0)',
            opacity: showAuth ? 0 : 1,
            transition: 'transform 1000ms ease, opacity 1000ms ease'
          }}
        >
          <IonImg
            src={OhsoLogo}
            alt='UMAK OHSO'
            style={{ width: 120, height: 120 }}
          />
        </div>
      </div>

      <div
        className='h-1/2 bottom-0 bg-white absolute w-full rounded-tr-4xl rounded-tl-4xl bg-gradient-to-b from-white/90 to-umak-blue/15 transition-transform duration-1500'
        style={{ transform: showAuth ? 'translateY(0)' : 'translateY(120%)' }}
      >
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
    </IonPage>
  )
}

export default Auth
