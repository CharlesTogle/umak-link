import { IonContent } from '@ionic/react'
import Header from '@/shared/components/Header'
import SettingsList from '@/shared/components/SettingsList'

export default function Settings () {
  return (
    <div className='w-full'>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <IonContent fullscreen className='bg-default-bg'>
        <div className='mx-4 mt-5'>
          <h1 className='text-2xl font-semibold mb-2'>Settings</h1>
        </div>
        <SettingsList />
      </IonContent>
    </div>
  )
}
