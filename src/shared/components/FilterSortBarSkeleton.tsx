import { IonSkeletonText, IonCard, IonCardContent } from '@ionic/react'

export default function FilterSortBarSkeleton ({
  className
}: {
  className?: string
}) {
  return (
    <IonCard className={`px-4 mb-3 ${className}`}>
      <IonCardContent className='flex items-center justify-between gap-3'>
        <div className='flex items-center mb-2 gap-2'>
          <IonSkeletonText
            animated
            style={{ width: '32px', height: '32px', borderRadius: '4px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '80px', height: '20px', borderRadius: '4px' }}
          />
        </div>
        <div className='flex items-center gap-2'>
          <IonSkeletonText
            animated
            style={{
              width: '90px',
              height: '36px',
              borderRadius: '18px'
            }}
          />
          <IonSkeletonText
            animated
            style={{
              width: '100px',
              height: '36px',
              borderRadius: '18px'
            }}
          />
        </div>
      </IonCardContent>
    </IonCard>
  )
}
