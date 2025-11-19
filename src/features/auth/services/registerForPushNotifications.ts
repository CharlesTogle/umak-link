import { PushNotifications } from '@capacitor/push-notifications'

export async function registerForPushNotifications (): Promise<string> {
  // register (Capacitor will prompt for permission if needed)
  await PushNotifications.requestPermissions()
  await PushNotifications.register()

  return new Promise((resolve, reject) => {
    PushNotifications.addListener('registration', async tokenObj => {
      const token = tokenObj.value
      resolve(token)
    })

    PushNotifications.addListener('registrationError', err => {
      console.error('Registration error', err)
      reject(err)
    })

    PushNotifications.addListener('pushNotificationReceived', notif => {
      console.log('pushReceived', notif)
    })
  })
}
