import { useEffect, useState } from 'react'
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToast,
  IonCard,
  IonAlert
  //   IonToggle
} from '@ionic/react'
import {
  trash,
  camera,
  images,
  lockClosed,
  notifications,
  folderOpen
} from 'ionicons/icons'
import { clearPostsCache } from '@/features/posts/data/postsCache'
import CardHeader from './CardHeader'
import { Camera } from '@capacitor/camera'
import { Filesystem } from '@capacitor/filesystem'
import { PushNotifications } from '@capacitor/push-notifications'

export default function SettingsList () {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  //   const [inAppNotifs, setInAppNotifs] = useState(false)
  //   const [pushNotifs, setPushNotifs] = useState(false)
  const [permState, setPermState] = useState({
    camera: '',
    files: '',
    notifications: ''
  })

  const handleClearPostsCache = async () => {
    try {
      await Promise.all([
        clearPostsCache({
          loadedKey: 'LoadedPosts',
          cacheKey: 'CachedPublicPosts'
        }),
        clearPostsCache({
          loadedKey: 'LoadedPosts:home',
          cacheKey: 'CachedPublicPosts:home'
        }),
        clearPostsCache({
          loadedKey: 'LoadedPosts:history',
          cacheKey: 'CachedPublicPosts:history'
        }),
        clearPostsCache({
          loadedKey: 'LoadedPosts:staff:home',
          cacheKey: 'CachedPublicPosts:staff:home'
        }),
        clearPostsCache({
          loadedKey: 'LoadedPosts:staff:records',
          cacheKey: 'CachedPublicPosts:staff:records'
        }),
        clearPostsCache({
          loadedKey: 'LoadedReports:staff:fraud',
          cacheKey: 'CachedFraudReports:staff'
        })
      ])
      setToastMessage('All caches cleared successfully')
    } catch (e) {
      console.error('Failed to clear caches:', e)
      setToastMessage('Failed to clear caches')
    } finally {
      setToastOpen(true)
    }
  }

  const handleRequestCameraPermission = async () => {
    try {
      console.log('Requesting camera permission...')
      await Camera.requestPermissions()

      // Check actual permission status after request
      const status = await Camera.checkPermissions()
      const granted = status.camera === 'granted' || status.photos === 'granted'

      setPermState(prev => ({
        ...prev,
        camera: granted ? 'granted' : 'denied'
      }))
      setToastMessage(
        granted ? 'Camera permission granted' : 'Camera permission denied'
      )
    } catch (e) {
      console.error(e)
      setToastMessage('Camera permission request failed')
    } finally {
      setToastOpen(true)
    }
  }

  const handleRevokeCameraPermission = () => {
    setToastMessage('Please revoke camera permission in your device settings')
    setToastOpen(true)
  }

  const handleRequestFilesPermission = async () => {
    try {
      await Filesystem.requestPermissions()

      // Check actual permission status after request
      const status = await Filesystem.checkPermissions()
      const granted = status.publicStorage === 'granted'

      setPermState(prev => ({ ...prev, files: granted ? 'granted' : 'denied' }))
      setToastMessage(
        granted
          ? 'File access permission granted'
          : 'File access permission denied'
      )
    } catch (e) {
      console.error(e)
      setToastMessage('File permission request failed')
    } finally {
      setToastOpen(true)
    }
  }

  const handleRevokeFilesPermission = () => {
    setToastMessage(
      'Please revoke file access permission in your device settings'
    )
    setToastOpen(true)
  }

  const handleRequestNotificationsPermission = async () => {
    try {
      await PushNotifications.requestPermissions()

      // Check actual permission status after request
      const permResult = await PushNotifications.checkPermissions()
      const granted = permResult.receive === 'granted'

      setPermState(prev => ({
        ...prev,
        notifications: granted ? 'granted' : 'denied'
      }))
      setToastMessage(
        granted
          ? 'Notifications permission granted'
          : 'Notifications permission denied'
      )

      if (granted) await PushNotifications.register()
    } catch (e) {
      console.error(e)
      setToastMessage('Notifications permission request failed')
    } finally {
      setToastOpen(true)
    }
  }

  const handleRevokeNotificationsPermission = () => {
    setToastMessage(
      'Please revoke notifications permission in your device settings'
    )
    setToastOpen(true)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        // Check actual permissions from native APIs
        const [cameraStatus, filesStatus, notifsStatus] = await Promise.all([
          Camera.checkPermissions(),
          Filesystem.checkPermissions(),
          PushNotifications.checkPermissions()
        ])

        if (!active) return

        setPermState({
          camera:
            cameraStatus.camera === 'granted' ||
            cameraStatus.photos === 'granted'
              ? 'granted'
              : 'denied',
          files: filesStatus.publicStorage === 'granted' ? 'granted' : 'denied',
          notifications:
            notifsStatus.receive === 'granted' ? 'granted' : 'denied'
        })
      } catch (err) {
        console.error('Error checking permissions:', err)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  //   const updateInApp = async (val: boolean) => {
  //     setInAppNotifs(val)
  //     try {
  //       await Preferences.set({ key: 'notifications.inApp', value: String(val) })
  //     } catch {}
  //   }

  //   const updatePush = async (val: boolean) => {
  //     setPushNotifs(val)
  //     try {
  //       await Preferences.set({ key: 'notifications.push', value: String(val) })
  //     } catch {}
  //   }

  return (
    <>
      {/* Permissions */}
      <IonCard className='ion-padding mt-3'>
        <CardHeader title='Permissions' icon={lockClosed} />
        <IonList>
          <IonItem
            button
            onClick={
              permState.camera === 'granted'
                ? handleRevokeCameraPermission
                : handleRequestCameraPermission
            }
          >
            <IonIcon slot='start' icon={camera} className='mr-2' />
            <IonLabel>
              Camera {permState.camera === 'granted' && '(Granted)'}
            </IonLabel>
            <IonLabel slot='end' className='text-sm text-umak-blue'>
              {permState.camera === 'granted' ? 'Revoke' : 'Grant'}
            </IonLabel>
          </IonItem>
          <IonItem
            button
            onClick={
              permState.files === 'granted'
                ? handleRevokeFilesPermission
                : handleRequestFilesPermission
            }
          >
            <IonIcon slot='start' icon={images} className='mr-2' />
            <IonLabel>
              Files {permState.files === 'granted' && '(Granted)'}
            </IonLabel>
            <IonLabel slot='end' className='text-sm text-umak-blue'>
              {permState.files === 'granted' ? 'Revoke' : 'Grant'}
            </IonLabel>
          </IonItem>
          <IonItem
            button
            onClick={
              permState.notifications === 'granted'
                ? handleRevokeNotificationsPermission
                : handleRequestNotificationsPermission
            }
          >
            <IonIcon slot='start' icon={notifications} className='mr-2' />
            <IonLabel>
              Notifications{' '}
              {permState.notifications === 'granted' && '(Granted)'}
            </IonLabel>
            <IonLabel slot='end' className='text-sm text-umak-blue'>
              {permState.notifications === 'granted' ? 'Revoke' : 'Grant'}
            </IonLabel>
          </IonItem>
        </IonList>
      </IonCard>

      {/* Notification Settings */}
      {/* <IonCard className='ion-padding mt-3'>
        <CardHeader title='Notification' icon={notifications} />
        <IonList>
          <IonItem>
            <IonLabel>In App Notifications</IonLabel>
            <IonToggle
              slot='end'
              checked={inAppNotifs}
              onIonChange={e => updateInApp(!!e.detail.checked)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Push Notifications</IonLabel>
            <IonToggle
              slot='end'
              checked={pushNotifs}
              onIonChange={e => updatePush(!!e.detail.checked)}
            />
          </IonItem>
        </IonList>
      </IonCard> */}

      {/* Storage */}
      <IonCard className='ion-padding mt-3'>
        <CardHeader title='Storage' icon={folderOpen} />
        <IonList>
          <IonItem button onClick={() => setConfirmOpen(true)}>
            <IonIcon slot='start' icon={trash} className='mr-2' />
            <IonLabel>Clear Posts Cache</IonLabel>
          </IonItem>
        </IonList>
      </IonCard>

      <IonAlert
        isOpen={confirmOpen}
        header='Clear posts cache?'
        message='Clearing the feed cache will remove saved posts from your device. Your feed may briefly load slower while it refreshes. Proceed?'
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setConfirmOpen(false)
          },
          {
            text: 'Proceed',
            role: 'confirm',
            handler: async () => {
              await handleClearPostsCache()
              setConfirmOpen(false)
            }
          }
        ]}
        onDidDismiss={() => setConfirmOpen(false)}
      />

      <IonToast
        isOpen={toastOpen}
        message={toastMessage}
        duration={1600}
        position='bottom'
        onDidDismiss={() => setToastOpen(false)}
      />
    </>
  )
}
