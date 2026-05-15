import { IonCard, IonCardContent, IonContent, IonIcon, IonPage } from '@ionic/react'
import { chevronForwardOutline, qrCodeOutline } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import SettingsList from '@/shared/components/SettingsList'
import Logout from '@/shared/components/LogOut'
import UserCard from '@/shared/components/UserCard'
import { useUser } from '@/features/auth/contexts/UserContext'
import { useNavigation } from '@/shared/hooks/useNavigation'

export default function AccountPage () {
  const { navigate } = useNavigation()
  const { user } = useUser()

  return (
    <IonPage className='h-full'>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <IonContent className='bg-default-bg'>
        <div className='min-h-full bg-default-bg pb-10'>
          <UserCard />
          {user?.user_type === 'User' ? (
            <IonCard className='ion-padding mt-3'>
              <IonCardContent className='p-0'>
                <button
                  type='button'
                  onClick={() => navigate('/user/claim/qr')}
                  className='flex w-full items-center gap-4 text-left transition active:scale-[0.99]'
                >
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e2b87]/10 text-umak-blue'>
                    <IonIcon icon={qrCodeOutline} className='text-2xl' />
                  </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-semibold text-umak-blue'>
                    Open Claim QR
                  </p>
                  <p className='mt-1 text-sm leading-6 text-slate-600'>
                    Open your student claim QR so guards or Security Office
                    staff can scan it when releasing your item.
                  </p>
                </div>
                  <IonIcon
                    icon={chevronForwardOutline}
                    className='shrink-0 text-xl text-slate-400'
                  />
                </button>
              </IonCardContent>
            </IonCard>
          ) : null}
          <SettingsList />
          <Logout />
        </div>
      </IonContent>
    </IonPage>
  )
}
