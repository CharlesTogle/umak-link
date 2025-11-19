import { IonCard, IonCardContent, IonImg, IonSkeletonText } from '@ionic/react'
import { useState } from 'react'
import CardHeader from '@/shared/components/CardHeader'
import { personCircle } from 'ionicons/icons'

export default function PostCard ({
  imgUrl,
  title,
  description,
  owner
}: {
  imgUrl: string
  title: string
  description: string
  owner: string
}) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <IonCard className='rounded-2xl mt-4'>
      <IonCardContent>
        <CardHeader title={owner} icon={personCircle} hasLineBelow={false} />
        <div className='flex justify-start items-center mt-3'>
          <div className='aspect-[16/13] overflow-hidden rounded-xl max-w-30 border-2 border-slate-900 relative'>
            {!imageLoaded && (
              <IonSkeletonText
                animated
                className='w-full h-full absolute inset-0'
              />
            )}
            <IonImg
              className='w-full h-full object-cover'
              src={imgUrl}
              alt={title}
              onIonImgDidLoad={() => setImageLoaded(true)}
            />
          </div>
          <div className='ml-4 max-w-1/2 max-h-2/3 overflow-hidden font-default-font font-bold text-black'>
            <p className='font-default-font font-bold! text-lg! truncate!'>
              {title}
            </p>
            <p className='text-slate-900 pb-2 truncate!'>{description}</p>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  )
}
