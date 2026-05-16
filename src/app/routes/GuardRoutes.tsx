import { Redirect, Route } from 'react-router-dom'
import { IonPage, IonRouterOutlet, IonTabs } from '@ionic/react'
import { home, notifications, qrCode, settings } from 'ionicons/icons'
import Toolbar from '@/app/components/Toolbar'
import Notifications from '@/features/user/pages/Notifications'
import GuardHome from '@/features/guard/pages/GuardHome'
import GuardReview from '@/features/guard/pages/GuardReview'
import GuardScan from '@/features/guard/pages/GuardScan'
import GuardPostRecord from '@/features/guard/pages/GuardPostRecord'
import GuardClaimItem from '@/features/guard/pages/GuardClaimItem'
import Settings from '@/shared/pages/Settings'

function GuardNotificationsRoute () {
  return (
    <IonPage>
      <Notifications />
    </IonPage>
  )
}

function GuardSettingsRoute () {
  return (
    <IonPage>
      <Settings />
    </IonPage>
  )
}

export default function GuardRoutes () {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path='/guard'>
          <Redirect to='/guard/home' />
        </Route>
        <Route exact path='/guard/home' render={() => <GuardHome />} />
        <Route
          exact
          path='/guard/post-record/view/:postId'
          render={() => <GuardPostRecord />}
        />
        <Route
          exact
          path='/guard/post/claim/:postId'
          render={() => <GuardClaimItem />}
        />
        <Route exact path='/guard/scan' render={() => <GuardScan />} />
        <Route
          exact
          path='/guard/scan/review/:custodyAttemptId'
          render={() => <GuardReview />}
        />
        <Route
          exact
          path='/guard/notifications'
          render={() => <GuardNotificationsRoute />}
        />
        <Route exact path='/guard/settings' render={() => <GuardSettingsRoute />} />
      </IonRouterOutlet>
      <Toolbar
        toolbarItems={[
          {
            icon: home,
            route: '/guard/home',
            text: 'Home'
          },
          {
            icon: qrCode,
            route: '/guard/scan',
            text: 'Scan'
          },
          {
            icon: notifications,
            route: '/guard/notifications',
            text: 'Notifications'
          },
          {
            icon: settings,
            route: '/guard/settings',
            text: 'Settings'
          }
        ]}
      />
    </IonTabs>
  )
}
