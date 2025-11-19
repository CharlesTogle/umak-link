import { IonCard, IonCardContent } from '@ionic/react'
import CardHeader from '@/shared/components/CardHeader'
import { informationCircle } from 'ionicons/icons'
import Header from '@/shared/components/Header'

export default function ReportPostSkeleton () {
  return (
    <div>
      <Header logoShown isProfileAndNotificationShown />
      <IonCard>
        <IonCardContent>
          <CardHeader title='Fraud Report' icon={informationCircle} />

          <div className='mt-4 animate-pulse'>
            <div className='h-40 w-full bg-gray-200 rounded-md' />
            <div className='mt-4 h-6 w-1/3 bg-gray-200 rounded' />
            <div className='mt-2 h-4 w-2/3 bg-gray-200 rounded' />

            <div className='mt-6 space-y-3'>
              <div className='h-6 w-40 bg-gray-200 rounded' />
              <div className='h-24 w-full bg-gray-200 rounded' />
              <div className='h-10 w-1/2 bg-gray-200 rounded' />
            </div>

            <div className='mt-6'>
              <div className='h-10 bg-gray-200 rounded w-full' />
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  )
}
