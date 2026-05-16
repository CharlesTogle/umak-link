import { PushNotifications } from '@capacitor/push-notifications'
import { useEffect } from 'react'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useUser } from '@/features/auth/contexts/UserContext'

function getNotificationsRoute (userType?: string | null) {
  const normalizedUserType = userType?.toLowerCase()
  if (normalizedUserType === 'admin') return '/admin/notifications'
  if (normalizedUserType === 'staff') return '/staff/notifications'
  if (normalizedUserType === 'guard') return '/guard/notifications'
  return '/user/notifications'
}

export function usePushRedirect () {
  const { navigate } = useNavigation()
  const { getUser } = useUser()

  useEffect(() => {
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async notification => {
        const data = notification.notification.data
        const user = await getUser()
        const fallbackNotificationsRoute = getNotificationsRoute(user?.user_type)
        const targetUrl =
          data?.url ??
          data?.href ??
          data?.link ??
          (data?.type === 'match' ? fallbackNotificationsRoute : null)
        if (!targetUrl) return

        if (user?.user_id) {
          console.log(targetUrl)
          navigate(targetUrl)
        } else {
          sessionStorage.setItem('redirect_after_login', targetUrl)
          navigate('/auth')
        }
      }
    )
  }, [navigate, getUser])
}
