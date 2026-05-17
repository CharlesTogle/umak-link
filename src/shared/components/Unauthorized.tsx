import { IonButton, IonContent, IonPage, useIonRouter } from '@ionic/react'
import { useAuth } from '@/features/auth/hooks/useAuth'

export default function Unauthorized () {
  const router = useIonRouter()
  const { logout } = useAuth()

  const handleGoBack = async () => {
    const { error } = await logout()
    if (error) {
      console.error('[Unauthorized] Logout failed:', error)
      return
    }

    router.push('/auth', 'none', 'replace')
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
