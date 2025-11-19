import { IonContent } from '@ionic/react'
import Header from '@/shared/components/Header'
import SettingsList from '@/shared/components/SettingsList'
import Logout from '@/shared/components/LogOut'
import UserCard from '@/shared/components/UserCard'

export default function AccountPage () {
  return (
    <>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <UserCard />
      <div className='bg-default-bg pb-10 h-full'>
        <IonContent>
          <SettingsList />
          <Logout />
        </IonContent>
      </div>
    </>
  )
}
