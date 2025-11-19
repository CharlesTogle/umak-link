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
import { Preferences } from '@capacitor/preferences'
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
      // Clear both home and history caches to avoid stale data in either feed
      await Promise.all([
        clearPostsCache({
          loadedKey: 'LoadedPosts:home',
          cacheKey: 'CachedPublicPosts:home'
        }),
        clearPostsCache({
          loadedKey: 'LoadedPosts:history',
          cacheKey: 'CachedPublicPosts:history'
        })
      ])
      setToastMessage('Posts cache cleared (home & history)')
    } catch (e) {
      console.error('Failed to clear posts cache:', e)
      setToastMessage('Failed to clear posts cache')
    } finally {
      setToastOpen(true)
    }
  }

  const handleRequestCameraPermission = async () => {
    try {
      const status = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      })
      const granted = status.camera === 'granted' || status.photos === 'granted'

      await Preferences.set({
        key: 'perm.camera',
        value: granted ? 'granted' : 'denied'
      })
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

  const handleRequestFilesPermission = async () => {
    try {
      const status = await Filesystem.requestPermissions()
      const granted = status.publicStorage === 'granted'

      await Preferences.set({
        key: 'perm.files',
        value: granted ? 'granted' : 'denied'
      })
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

  const handleRequestNotificationsPermission = async () => {
    try {
      const permResult = await PushNotifications.requestPermissions()
      const granted = permResult.receive === 'granted'

      await Preferences.set({
        key: 'perm.notifications',
        value: granted ? 'granted' : 'denied'
      })
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

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [camera, files, notifs] = await Promise.all([
          Preferences.get({ key: 'notifications.inApp' }),
          Preferences.get({ key: 'notifications.push' }),
          Preferences.get({ key: 'perm.camera' }),
          Preferences.get({ key: 'perm.files' }),
          Preferences.get({ key: 'perm.notifications' })
        ])
        if (!active) return
        // setInAppNotifs(inApp.value === 'true')
        // setPushNotifs(push.value === 'true')
        setPermState({
          camera: camera.value || '',
          files: files.value || '',
          notifications: notifs.value || ''
        })
      } catch {}
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
            disabled={permState.camera === 'granted'}
            onClick={handleRequestCameraPermission}
          >
            <IonIcon slot='start' icon={camera} className='mr-2' />
            <IonLabel>
              Camera {permState.camera === 'granted' && '(Granted)'}
            </IonLabel>
          </IonItem>
          <IonItem
            button
            disabled={permState.files === 'granted'}
            onClick={handleRequestFilesPermission}
          >
            <IonIcon slot='start' icon={images} className='mr-2' />
            <IonLabel>
              Files {permState.files === 'granted' && '(Granted)'}
            </IonLabel>
          </IonItem>
          <IonItem
            button
            disabled={permState.notifications === 'granted'}
            onClick={handleRequestNotificationsPermission}
          >
            <IonIcon slot='start' icon={notifications} className='mr-2' />
            <IonLabel>
              Notifications{' '}
              {permState.notifications === 'granted' && '(Granted)'}
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
