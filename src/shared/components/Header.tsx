import ohsoIcon from '@/shared/assets/umak-ohso.svg'
import {
  IonHeader,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonButton,
  IonBadge
} from '@ionic/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { cachedFileExists } from '../utils/fileUtils'
import { getCachedImage } from '../utils/fileUtils'
import { useNavigation } from '../hooks/useNavigation'
import { notifications, personCircle } from 'ionicons/icons'
import { useUser } from '@/features/auth/contexts/UserContext'
import { useUnreadNotificationCount } from '@/features/user/hooks/useUnreadNotificationCount'
import createCache from '@/shared/lib/cache'
import type { User } from '@/features/auth/contexts/UserContext'

type CachedCount = {
  count: number
  timestamp: number
}

const toolbarStyle = {
  ['--background']: 'var(--color-umak-blue, #1D2981)'
} as React.CSSProperties

function Header ({
  children,
  logoShown,
  isProfileAndNotificationShown = true,
  isNotificationPage = false
}: {
  children?: React.ReactNode
  logoShown: boolean
  unreadCount?: number
  isProfileAndNotificationShown?: boolean
  isNotificationPage?: boolean
}) {
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  const [cachedCount, setCachedCount] = useState<number>(0)
  const [user, setUser] = useState<User | null>(null)
  const profilePicRef = useRef<string | null>(null)
  const { navigate } = useNavigation()
  const { getUser } = useUser()

  useEffect(() => {
    if (!user) {
      getUser().then(currentUser => {
        setUser(currentUser)
      })
    }
  }, [])

  useEffect(() => {
    if (!user?.user_id) return
    const loadCachedCount = async () => {
      try {
        const userCountCache = createCache<CachedCount>({
          keys: {
            loadedKey: `LoadedNotificationCount:${user.user_id}`,
            cacheKey: `CachedNotificationCount:${user.user_id}`
          },
          idSelector: () => 'count'
        })

        const cached = await userCountCache.loadCache()
        if (cached.length > 0) {
          const cachedData = cached[0]

          setCachedCount(cachedData.count)
        }
      } catch (err) {
        console.log('Header: No cached count available')
      }
    }

    loadCachedCount()
  }, [user?.user_id])

  const { unreadCount, error } = useUnreadNotificationCount(
    user?.user_id,
    cachedCount
  )
  useEffect(() => {
    if (error) {
      console.warn('Notification count fetch error:', error.message)
    }
  }, [error])
  useEffect(() => {
    const getProfilePicture = async () => {
      if (profilePicRef.current) return
      const exists = await cachedFileExists(
        'profilePicture.webp',
        'cache/images'
      )
      if (exists) {
        const url = await getCachedImage('profilePicture.webp', 'cache/images')
        profilePicRef.current = url
        setProfilePicUrl(url)
      }
    }
    getProfilePicture()
  }, [])
  const handleNotificationClick = useCallback(() => {
    if (!user?.user_type) {
      navigate('/notifications')
      return
    }

    const userType = user.user_type.toLowerCase()
    if (userType === 'staff') {
      navigate('/staff/notifications')
    } else if (userType === 'admin') {
      navigate('/admin/notifications')
    } else {
      navigate('/user/notifications')
    }
  }, [navigate, user?.user_type])
  const handleProfileClick = useCallback(() => {
    navigate('/account')
  }, [navigate])
  const handleLogoClick = useCallback(() => {
    if (!user?.user_type) {
      navigate('/home')
      return
    }

    const userType = user.user_type.toLowerCase()
    if (userType === 'admin') {
      navigate('/admin/dashboard')
    } else {
      navigate(`/${userType}/home`)
    }
  }, [navigate, user?.user_type])
  const notificationIconClass = isNotificationPage
    ? 'text-amber-500 '
    : 'text-white'
  return (
    <IonHeader className='ion-no-border'>
      <IonToolbar style={toolbarStyle}>
        <IonButtons slot='start'>
          {logoShown && (
            <IonButton onClick={handleLogoClick}>
              <IonIcon
                icon={ohsoIcon}
                slot='icon-only'
                size='large'
                className='text-white'
              />
            </IonButton>
          )}
        </IonButtons>
        {children}
        {isProfileAndNotificationShown && (
          <>
            {/* Notification Icon with Badge */}
            <IonButtons slot='end'>
              <IonButton className='relative' onClick={handleNotificationClick}>
                <IonIcon
                  icon={notifications}
                  slot='icon-only'
                  className={`text-3xl ${notificationIconClass}`}
                />
                {!isNotificationPage && Number(unreadCount) > 0 && (
                  <IonBadge
                    color='danger'
                    className='absolute -top-1 -right-2 text-[10px] px-1.5 py-0.5 rounded-full'
                  >
                    {unreadCount}
                  </IonBadge>
                )}
              </IonButton>
            </IonButtons>

            {/* Profile Icon */}
            <IonButtons slot='end'>
              <IonButton onClick={handleProfileClick}>
                {profilePicUrl ? (
                  <img
                    src={profilePicUrl}
                    alt='Profile'
                    className='w-8 h-8 rounded-full object-cover'
                  />
                ) : (
                  <IonIcon
                    icon={personCircle}
                    slot='icon-only'
                    className='text-white text-2xl'
                  />
                )}
              </IonButton>
            </IonButtons>
          </>
        )}
      </IonToolbar>
    </IonHeader>
  )
}

export default Header
