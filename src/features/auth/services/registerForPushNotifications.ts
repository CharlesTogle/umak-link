import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

const REGISTRATION_TIMEOUT_MS = 15000

async function removeListeners (
  handles: Array<{ remove: () => Promise<void> }>
): Promise<void> {
  await Promise.allSettled(handles.map(handle => handle.remove()))
}

export async function registerForPushNotifications (): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null
  }

  const permissions = await PushNotifications.requestPermissions()
  if (permissions.receive !== 'granted') {
    console.warn('[push] Notification permission not granted:', permissions.receive)
    return null
  }

  const handles: Array<{ remove: () => Promise<void> }> = []

  try {
    let settled = false
    let resolveToken: ((value: string) => void) | null = null
    let rejectToken: ((reason?: unknown) => void) | null = null

    const resolveOnce = (value: string) => {
      if (settled || !resolveToken) return
      settled = true
      resolveToken(value)
    }

    const rejectOnce = (error: unknown) => {
      if (settled || !rejectToken) return
      settled = true
      rejectToken(error)
    }

    const tokenPromise = new Promise<string>((resolve, reject) => {
      resolveToken = resolve
      rejectToken = reject
    })

    handles.push(
      await PushNotifications.addListener('registration', tokenObj => {
        resolveOnce(tokenObj.value)
      }),
      await PushNotifications.addListener('registrationError', err => {
        console.error('Registration error', err)
        rejectOnce(err)
      }),
      await PushNotifications.addListener('pushNotificationReceived', notif => {
        console.log('pushReceived', notif)
      })
    )

    await PushNotifications.register()

    return await Promise.race([
      tokenPromise,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timed out waiting for push registration token'))
        }, REGISTRATION_TIMEOUT_MS)
      })
    ])
  } finally {
    await removeListeners(handles)
  }
}
