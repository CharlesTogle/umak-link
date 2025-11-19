import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList
} from '@ionic/react'
import { logOut } from 'ionicons/icons'
import { useUser } from '@/features/auth/contexts/UserContext'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'

export default function Logout () {
  const { clearUser } = useUser()
  const { navigate } = useNavigation()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    clearUser()
    navigate('/auth')
  }
  return (
    <div>
      <IonCard className='mt-3 mb-20 bg-transparent shadow-none'>
        <IonCardContent>
          <IonList>
            <IonItem
              button
              style={{ '--background': 'var(--color-umak-red)' }}
              className='text-white font-default-font rounded-lg'
              onClick={handleLogout}
            >
              <IonIcon icon={logOut} className='mr-3 text-white' />
              <IonLabel className='text-red-600'>Log out</IonLabel>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>{' '}
    </div>
  )
}
