import React from 'react'
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
import StartupLoading from './pages/StartupLoading'
import HomeSkeleton from '@/features/user/components/skeletons/HomeSkeleton'
import { usePushRedirect } from './hooks/usePushRedirect'
import AdminRoutes from './routes/AdminRoutes'
import StaffRoutes from '@/app/routes/StaffRoutes'
import AccountPage from '@/features/user/pages/AccountPage'

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
