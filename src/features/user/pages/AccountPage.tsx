import Header from '@/shared/components/Header'
import SettingsList from '@/shared/components/SettingsList'
import Logout from '@/shared/components/LogOut'
import UserCard from '@/shared/components/UserCard'
import { IonPage } from '@ionic/react'
import { useNavigation } from '@/shared/hooks/useNavigation'

export default function AccountPage () {
  const { navigate } = useNavigation()

  return (
    <IonPage className='h-full'>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <UserCard />
      <div className='bg-default-bg pb-10 h-full'>
        <div className='px-4 pt-4'>
          <button
            type='button'
            onClick={() => navigate('/user/claim/join')}
            className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm'
          >
            <p className='text-sm font-semibold text-umak-blue'>Join Claim Session</p>
            <p className='mt-1 text-sm text-slate-600'>
              Join the staff or guard claim session, then generate your unique
              QR code when they ask to verify your claim.
            </p>
          </button>
        </div>
        <SettingsList />
        <Logout />
      </div>
    </IonPage>
  )
}
