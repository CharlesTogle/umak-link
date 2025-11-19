import React, { useState, useEffect } from 'react'
import {
  IonApp,
  IonRouterOutlet,
  IonContent,
  IonText,
  IonButton,
  IonIcon
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Route, Redirect } from 'react-router-dom'
import { setupIonicReact } from '@ionic/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SearchProvider } from '@/shared/contexts/SearchContext'
import { NotificationProvider } from '@/shared/contexts/NotificationContext'
import ProtectedRoute from '@/shared/components/ProtectedRoute'
import UserRoutes from './routes/UserRoutes'
import Auth from '@/features/auth/pages/Auth'
import StartupLoading from './pages/StartupLoading'
import HomeSkeleton from '@/features/user/components/skeletons/HomeSkeleton'
import { usePushRedirect } from './hooks/usePushRedirect'
import AdminRoutes from './routes/AdminRoutes'
import StaffRoutes from '@/app/routes/StaffRoutes'
import AccountPage from '@/features/user/pages/AccountPage'
import { Network } from '@capacitor/network'
import { cloudOffline, refresh } from 'ionicons/icons'

import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'
import '@/app/styles/tailwind.css'

setupIonicReact({ mode: 'md' })

const App: React.FC = () => {
  usePushRedirect()
  const googleWebClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [isOnline, setIsOnline] = useState(true)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const status = await Network.getStatus()
        setIsOnline(status.connected)
      } catch (error) {
        console.error('Error checking network status:', error)
        setIsOnline(true) // Assume online if we can't check
      } finally {
        setIsChecking(false)
      }
    }

    checkConnection()

    // Listen for network status changes
    let listenerHandle: any
    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected)
    }).then(handle => {
      listenerHandle = handle
    })

    return () => {
      if (listenerHandle) {
        listenerHandle.remove()
      }
    }
  }, [])

  const handleRetry = async () => {
    setIsChecking(true)
    try {
      const status = await Network.getStatus()
      setIsOnline(status.connected)
    } catch (error) {
      console.error('Error checking network status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <IonApp>
        <IonContent className='ion-padding'>
          <div className='flex items-center justify-center h-screen'>
            <div className='text-center'>
              <div className='text-lg text-gray-600'>
                Checking connection...
              </div>
            </div>
          </div>
        </IonContent>
      </IonApp>
    )
  }

  if (!isOnline) {
    return (
      <IonApp>
        <IonContent className='ion-padding'>
          <div className='flex items-center justify-center h-screen'>
            <div className='text-center max-w-md px-4'>
              <IonIcon
                icon={cloudOffline}
                className='text-gray-400 mb-4'
                style={{ fontSize: '80px' }}
              />
              <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                No Internet Connection
              </h1>
              <IonText color='medium' className='block mb-6'>
                Please check your internet connection and try again. This app
                requires an active internet connection to work.
              </IonText>
              <IonButton
                expand='block'
                onClick={handleRetry}
                className='mt-4'
                style={{ '--background': 'var(--color-umak-blue)' }}
              >
                <IonIcon slot='start' icon={refresh} />
                Retry Connection
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonApp>
    )
  }

  return (
    <GoogleOAuthProvider
      clientId={googleWebClientId || 'YOUR_GOOGLE_CLIENT_ID_HERE'}
    >
      <SearchProvider>
        <NotificationProvider>
          <IonApp>
            <IonReactRouter>
              <IonRouterOutlet>
                <Route path='/post/report/:postId' render={() => <></>} />
                <Route path='/test' render={() => <HomeSkeleton />} />
                <Route
                  exact
                  path='/'
                  render={() => <Redirect to='/preload' />}
                />
                <Route path='/preload' render={() => <StartupLoading />} />
                <Route path='/auth' render={() => <Auth />} />
                <Route path='/account' render={() => <AccountPage />} />
                <Route
                  path='/user/*'
                  render={() => (
                    <ProtectedRoute allowedRoles={['user']}>
                      <UserRoutes />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path='/admin/*'
                  render={() => (
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminRoutes />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path='/staff/*'
                  render={() => (
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffRoutes />
                    </ProtectedRoute>
                  )}
                />
              </IonRouterOutlet>
            </IonReactRouter>
          </IonApp>
        </NotificationProvider>
      </SearchProvider>
    </GoogleOAuthProvider>
  )
}

export default App
