import { IonCard, IonCardContent, IonSkeletonText } from '@ionic/react'

export default function PostCardSkeleton () {
  return (
    <IonCard className='rounded-2xl w-full'>
      <IonCardContent>
        <div className='flex items-center space-x-2'>
          <IonSkeletonText animated className='w-8 h-8 rounded-full' />
          <IonSkeletonText animated className='w-24 h-4 rounded' />
        </div>
        <div className='flex justify-start items-center mt-3'>
          <div className='aspect-[16/13] overflow-hidden rounded-xl w-30'>
            <IonSkeletonText animated className='w-full h-full' />
          </div>
          <div className='ml-4 max-w-1/2 space-y-2'>
            <IonSkeletonText animated className='w-32 h-5 rounded' />
            <IonSkeletonText animated className='w-40 h-4 rounded' />
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  )
}
