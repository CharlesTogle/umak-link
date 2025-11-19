import { Route } from 'react-router-dom'
import { IonTabs, IonRouterOutlet } from '@ionic/react'
import Toolbar from '@/app/components/Toolbar'
import { home, time, helpCircle, megaphone } from 'ionicons/icons'
import Dashboard from '@/features/admin/pages/Dashboard'
import StaffManagement from '@/features/admin/pages/StaffManagement'
import AddRole from '@/features/admin/pages/AddRole'
import AuditTrail from '@/features/admin/pages/AuditTrail'
import Announcement from '@/features/admin/pages/Announcement'
import GenerateAnnouncement from '@/features/admin/pages/GenerateAnnouncement'
import Notifications from '@/features/user/pages/Notifications'

export default function AdminRoutes () {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path='/admin/notifications' render={() => <Notifications />} />
        <Route path='/admin/dashboard' render={() => <Dashboard />} />
        <Route path='/admin/announcement' render={() => <Announcement />} />
        <Route
          path='/admin/generate-announcement'
          render={() => <GenerateAnnouncement />}
        />
        <Route path='/admin/audit-trail' render={() => <AuditTrail />} />
        <Route
          path='/admin/staff-management'
          render={() => <StaffManagement />}
        />
        <Route path='/admin/staff/add' render={() => <AddRole />} />
      </IonRouterOutlet>
      <Toolbar
        toolbarItems={[
          {
            icon: home,
            route: '/admin/dashboard',
            text: 'Dashboard'
          },
          {
            icon: time,
            route: '/admin/audit-trail',
            text: 'Audit Trail'
          },
          {
            icon: helpCircle,
            route: '/admin/staff-management',
            text: 'Staff Management'
          },
          {
            icon: megaphone,
            route: '/admin/announcement',
            text: 'Announcements'
          }
        ]}
      />
    </IonTabs>
  )
}
