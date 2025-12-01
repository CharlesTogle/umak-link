import {
  IonCard,
  IonCardContent,
  IonImg,
  IonSkeletonText,
  IonIcon
} from '@ionic/react'
import { useState } from 'react'
import { personCircle } from 'ionicons/icons'

export default function PostCard ({
  imgUrl,
  title,
  description,
  owner,
  owner_profile_picture_url,
  onClick
}: {
  imgUrl: string
  title: string
  description: string
  owner: string
  owner_profile_picture_url?: string | null
  onClick?: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <IonCard
      className={`rounded-2xl mt-4 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <IonCardContent>
        <div className='flex items-center space-x-2'>
          {owner_profile_picture_url ? (
            <img
              src={owner_profile_picture_url}
              className='w-8 h-8 rounded-full'
            />
          ) : (
            <IonIcon icon={personCircle} className='text-[32px]'></IonIcon>
          )}
          <div className='text-umak-blue font-default-font font-semibold'>
            {owner}
          </div>
        </div>{' '}
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
