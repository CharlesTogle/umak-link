import { useEffect, useState, useCallback } from 'react'
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
  lockClosed,
  notifications,
  folderOpen
} from 'ionicons/icons'
import { clearPostsCache } from '@/features/posts/data/postsCache'
import CardHeader from './CardHeader'
import { Camera } from '@capacitor/camera'
import { PushNotifications } from '@capacitor/push-notifications'
// Filesystem permission UI removed — do not import Filesystem here

export default function SettingsList () {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  //   const [inAppNotifs, setInAppNotifs] = useState(false)
  //   const [pushNotifs, setPushNotifs] = useState(false)
  const [permState, setPermState] = useState({
    camera: '',
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
      const granted = status.camera === 'granted' && status.photos === 'granted'

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

  // Storage permission UI removed — we don't request Filesystem permissions here

  // Accept an external permissions snapshot (e.g., from native layer).
  // Re-check authoritative native permissions to avoid marking any
  // permission as granted prematurely.
  const handlePermissionSnapshot = async (snapshot: any) => {
    try {
      console.log(
        'Applying external permission snapshot (rechecking native)',
        snapshot
      )

      // Perform authoritative permission checks and fall back safely

      const [cameraStatus, notifsStatus] = await Promise.all([
        Camera.checkPermissions().catch(() => ({
          camera: 'denied',
          photos: 'denied'
        })),
        PushNotifications.checkPermissions().catch(() => ({
          receive: 'denied'
        }))
      ])

      const cameraGranted =
        cameraStatus?.camera === 'granted' && cameraStatus?.photos === 'granted'
      const notifsGranted = notifsStatus?.receive === 'granted'

      setPermState({
        camera: cameraGranted ? 'granted' : 'denied',
        notifications: notifsGranted ? 'granted' : 'denied'
      })

      // If notifications are truly granted, ensure registration
      if (notifsGranted) {
        try {
          await PushNotifications.register()
        } catch (e) {
          console.warn('Push registration failed after permissions snapshot', e)
        }
      }

      setToastMessage('Permissions synced')
      setToastOpen(true)
    } catch (err) {
      console.error('Failed to apply permission snapshot', err)
    }
  }

  const checkPermissions = useCallback(async () => {
    try {
      // Check actual permissions from native APIs
      const [cameraStatus, notifsStatus] = await Promise.all([
        Camera.checkPermissions(),
        PushNotifications.checkPermissions()
      ])

      console.log(
        'Checked permissions:',
        JSON.stringify({
          camera: cameraStatus,
          notifications: notifsStatus
        })
      )
      setPermState({
        camera:
          cameraStatus.camera === 'granted' && cameraStatus.photos === 'granted'
            ? 'granted'
            : 'denied',
        notifications: notifsStatus.receive === 'granted' ? 'granted' : 'denied'
      })
    } catch (err) {
      console.error('Error checking permissions:', err)
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!active) return
      await checkPermissions()
    })()
    return () => {
      active = false
    }
  }, [checkPermissions])

  // Listen for external permission snapshots (useful for native bridges)
  useEffect(() => {
    const handler = (e: any) => {
      if (!e?.detail) return
      void handlePermissionSnapshot(e.detail)
    }
    window.addEventListener('permissionsSnapshot', handler as EventListener)
    return () =>
      window.removeEventListener(
        'permissionsSnapshot',
        handler as EventListener
      )
  }, [])

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
              Camera and Photos{permState.camera === 'granted' && ' (Granted)'}
            </IonLabel>
            <IonLabel slot='end' className='text-sm text-umak-blue'>
              {permState.camera === 'granted' ? 'Revoke' : 'Grant'}
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

      {/* Storage */}
      <IonCard className='ion-padding mt-3'>
        <CardHeader title='Storage' icon={folderOpen} />
        <IonList>
          <IonItem button onClick={() => setConfirmOpen(true)}>
            <IonIcon slot='start' icon={trash} className='mr-2' />
            <IonLabel>Clear Cache</IonLabel>
          </IonItem>
        </IonList>
      </IonCard>

      <IonAlert
        isOpen={confirmOpen}
        header='Clear cache?'
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
