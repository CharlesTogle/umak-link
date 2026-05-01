import React, { useEffect } from 'react'
import { IonApp, IonRouterOutlet } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Route, Redirect } from 'react-router-dom'
import { setupIonicReact } from '@ionic/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { SearchProvider } from '@/shared/contexts/SearchContext'
import { NotificationProvider } from '@/shared/contexts/NotificationContext'
import ProtectedRoute from '@/shared/components/ProtectedRoute'
import UserRoutes from './routes/UserRoutes'
import Auth from '@/features/auth/pages/Auth'
import { usePushRedirect } from './hooks/usePushRedirect'
import { useForegroundPush } from './hooks/useForegroundPush'
import AdminRoutes from './routes/AdminRoutes'
import StaffRoutes from '@/app/routes/StaffRoutes'
import AccountPage from '@/features/user/pages/AccountPage'
import { IonPage, IonToast } from '@ionic/react'
import Logout from '@/shared/components/LogOut'
import Unauthorized from '@/shared/components/Unauthorized'

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
  const { toast: pushToast, dismissToast } = useForegroundPush()
  const googleWebClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const apiUrl = import.meta.env.VITE_API_URL

  useEffect(() => {
    if (!googleWebClientId) {
      console.warn('[config] Missing VITE_GOOGLE_CLIENT_ID. Google sign-in will fail.')
    }
    if (!apiUrl) {
      console.warn('[config] Missing VITE_API_URL. Falling back to http://localhost:8080.')
    }
  }, [apiUrl, googleWebClientId])

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
                <Route path='/unauthorized' render={() => <Unauthorized />} />
                <Route
                  path='/test'
                  render={() => (
                    <IonPage>
                      <Logout></Logout>
                    </IonPage>
                  )}
                />
                <Route exact path='/' render={() => <Redirect to='/auth' />} />
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
      <IonToast
        isOpen={!!pushToast}
        onDidDismiss={dismissToast}
        header={pushToast?.title}
        message={pushToast?.body}
        duration={4000}
        position='top'
        color='primary'
      />
    </GoogleOAuthProvider>
  )
}

export default App
