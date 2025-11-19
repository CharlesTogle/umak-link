import { PushNotifications } from '@capacitor/push-notifications'
import { useEffect } from 'react'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useUser } from '@/features/auth/contexts/UserContext'

export function usePushRedirect () {
  const { navigate } = useNavigation()
  const { getUser } = useUser()

  useEffect(() => {
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      async notification => {
        const data = notification.notification.data
        const targetUrl = data?.url
        if (!targetUrl) return

        const user = await getUser()

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
