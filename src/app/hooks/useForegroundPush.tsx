import { PushNotifications } from '@capacitor/push-notifications'
import { useEffect, useState } from 'react'

export interface PushToastData {
  title: string
  body: string
}

export function useForegroundPush () {
  const [toast, setToast] = useState<PushToastData | null>(null)

  useEffect(() => {
    const listenerPromise = PushNotifications.addListener(
      'pushNotificationReceived',
      notification => {
        setToast({
          title: notification.title ?? 'New Notification',
          body: notification.body ?? '',
        })
      }
    )

    return () => {
      listenerPromise.then(l => l.remove())
    }
  }, [])

  const dismissToast = () => setToast(null)

  return { toast, dismissToast }
}
