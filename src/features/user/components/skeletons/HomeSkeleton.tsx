import { IonPage, IonContent } from '@ionic/react'
import CatalogPostSkeleton from '../../../../shared/components/CatalogPostSkeleton'
import Header from '@/shared/components/Header'

export default function HomeSkeleton () {
  return (
    <IonPage>
      <IonContent>
        <div className='h-screen overflow-y-hidden pointer-events-none'>
          <Header logoShown={true}></Header>
          <div className='flex flex-col gap-4 animate-pulse'>
            {[...Array(2)].map((_, index) => (
              <CatalogPostSkeleton className='w-full' key={index} />
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
