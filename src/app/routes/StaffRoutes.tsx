import { Route, Redirect } from 'react-router-dom'
import { IonTabs, IonRouterOutlet } from '@ionic/react'
import Home from '../../features/staff/pages/Home'
import PostRecords from '../../features/staff/pages/PostRecords'
import FraudReport from '../../features/staff/pages/FraudReports'
import ExpandedFraudReport from '../../features/staff/pages/ExpandedFraudReport'
import ExpandedPostRecord from '../../features/staff/pages/ExpandedPostRecord'
import Settings from '../../features/staff/pages/Settings'
import ClaimItem from '../../features/staff/pages/ClaimItem'
import Toolbar from '@/app/components/Toolbar'
import { home, create, documentText, settings } from 'ionicons/icons'
import Notifications from '@/features/user/pages/Notifications'
import StaffExpandedPost from '@/features/staff/pages/StaffExpandedPost'

export default function StaffRoutes () {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path='/staff'>
          <Redirect to='/staff/home' />
        </Route>
        <Route
          exact
          path='/staff/view-post/:postId'
          render={() => <StaffExpandedPost />}
        />
        <Route
          exact
          path='/staff/post/claim/:postId'
          render={() => <ClaimItem />}
        />
        <Route path='/staff/notifications' render={() => <Notifications />} />
        <Route exact path='/staff/home' render={() => <Home />} />
        <Route
          exact
          path='/staff/post-records'
          render={() => <PostRecords />}
        />
        <Route
          exact
          path='/staff/post-record/view/:postId'
          render={() => <ExpandedPostRecord />}
        />
        <Route
          exact
          path='/staff/fraud-reports'
          render={() => <FraudReport />}
        />
        <Route
          exact
          path='/staff/fraud-report/view/:reportId'
          render={() => <ExpandedFraudReport />}
        />
        <Route exact path='/staff/settings' render={() => <Settings />} />
      </IonRouterOutlet>
      <Toolbar
        toolbarItems={[
          {
            icon: home,
            route: '/staff/home',
            text: 'Home'
          },
          {
            icon: create,
            route: '/staff/post-records',
            text: 'Post Records'
          },
          {
            icon: documentText,
            route: '/staff/fraud-reports',
            text: 'Fraud Reports'
          },
          {
            icon: settings,
            route: '/staff/settings',
            text: 'Settings'
          }
        ]}
      />
    </IonTabs>
  )
}
