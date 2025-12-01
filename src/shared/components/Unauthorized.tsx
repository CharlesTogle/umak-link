import { IonButton, IonContent, IonPage } from '@ionic/react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUser } from '@/features/auth/contexts/UserContext'

export default function Unauthorized () {
  const { logout } = useAuth()
  const { clearUser } = useUser()

  const handleGoBack = async () => {
    await clearUser()
    await logout()
    window.location.href = '/auth'
  }

  return (
    <IonPage>
      <IonContent className='ion-padding'>
        <div className='flex flex-col items-center justify-center h-full gap-6'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Unauthorized Access
            </h1>
            <p className='text-gray-600'>
              You don't have permission to view this page.
            </p>
          </div>
          <IonButton
            onClick={handleGoBack}
            style={{
              '--background': 'var(--color-umak-blue)',
              '--color': 'white'
            }}
          >
            Go Back to Auth
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}
