import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/react'
import { arrowBack } from 'ionicons/icons'
import { useHistory } from 'react-router-dom'

export default function NotFound () {
  const history = useHistory()

  const handleGoBack = () => {
    if (history.length > 1) {
      history.goBack()
    } else {
      // Fallback to home if there's no history
      history.push('/user/home')
    }
  }

  return (
    <IonPage>
      <IonContent className='ion-padding'>
        <div className='flex flex-col items-center justify-center min-h-full py-12 px-4'>
          {/* 404 Error */}
          <div className='text-center mb-8'>
            <h1 className='text-9xl font-bold text-umak-blue mb-4'>404</h1>
            <h2 className='text-3xl font-semibold text-gray-800 mb-4'>
              Page Not Found
            </h2>
            <p className='text-lg text-gray-600 mb-8 max-w-md'>
              Sorry, the page you're looking for doesn't exist or has been
              moved.
            </p>
          </div>

          {/* Go Back Button */}
          <IonButton onClick={handleGoBack} color='primary' className='w-48'>
            <IonIcon icon={arrowBack} slot='start' />
            Go Back
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}
