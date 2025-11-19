import { IonPage, IonContent, IonCard } from '@ionic/react'
import Header from '@/shared/components/Header'
import SettingsList from '@/shared/components/SettingsList'

export default function SettingsPage () {
  return (
    <IonPage>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <IonContent fullscreen className='bg-default-bg'>
        <IonCard className='ion-padding mt-4'>
          <h2 className='text-lg font-semibold'>Settings</h2>
        </IonCard>
        <SettingsList />
      </IonContent>
    </IonPage>
  )
}
