import { useEffect, useState } from 'react'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useUser, type User } from '@/features/auth/contexts/UserContext'
import { SocialLogin } from '@capgo/capacitor-social-login'
import AdminBuilding from '@/shared/assets/umak-admin-building.jpg'
import UmakSeal from '@/shared/assets/umak-seal.png'
import OhsoLogo from '@/shared/assets/umak-ohso.png'
import { IonPage, IonImg } from '@ionic/react'
import Auth from '@/features/auth/pages/Auth'

export default function StartupLoading () {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const { navigate } = useNavigation()
  const { refreshUser, getUser, clearUser } = useUser()

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getUser()
        setUser(currentUser)
        if (currentUser) {
          await refreshUser(currentUser.user_id)
          setIsAuthed(true)
        } else {
          await SocialLogin.logout({ provider: 'google' })
          clearUser()
          setIsAuthed(false)
        }
      } catch (error) {
        console.error(error)
        setIsAuthed(false)
      }
    }

    checkAuth()
  }, [refreshUser, getUser, clearUser])

  // Navigate after auth check
  useEffect(() => {
    if (isAuthed === null) return

    const getRouteByUserType = (userType: string): string => {
      const type = userType.toLowerCase()
      const routeMap: Record<string, string> = {
        admin: '/admin/dashboard',
        staff: '/staff/home'
      }
      return routeMap[type] || '/user/home'
    }

    const targetRoute =
      isAuthed && user ? getRouteByUserType(user.user_type) : '/auth'

    // If user is authenticated, navigate to their dashboard
    if (isAuthed && user) {
      setTimeout(() => {
        navigate(targetRoute, 'auth')
      }, 3000)
    } else {
      // If not authenticated, show auth screen with transition
      setTimeout(() => {
        setShowAuth(true)
      }, 3000)
    }
  }, [isAuthed, user, navigate])

  // If auth screen should be shown, render it
  if (showAuth) {
    return <Auth />
  }

  return (
    <IonPage className='relative'>
      <div className='relative h-full overflow-hidden'>
        <img
          src={AdminBuilding}
          className='absolute inset-0 h-full w-130 scale-150 object-cover object-center -translate-y-25 '
          aria-hidden='true'
        />
        <div className='absolute inset-0 bg-gradient-to-b from-umak-blue/90 to-black/60' />
      </div>
      <div className='absolute top-45 w-full flex items-center justify-center gap-10 animate-pulse'>
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
    </IonPage>
  )
}
