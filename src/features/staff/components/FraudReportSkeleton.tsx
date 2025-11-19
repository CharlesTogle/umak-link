import { memo } from 'react'
import { IonCard, IonCardContent, IonSkeletonText } from '@ionic/react'

const FraudReportSkeleton = memo(() => (
  <IonCard className='mb-3'>
    <IonCardContent className='p-0'>
      {/* Header skeleton */}
      <div className='p-3 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            <IonSkeletonText
              animated
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%'
              }}
            />
            <div>
              <IonSkeletonText
                animated
                style={{ width: '120px', height: '16px', marginBottom: '4px' }}
              />
              <IonSkeletonText
                animated
                style={{ width: '100px', height: '12px' }}
              />
            </div>
          </div>
          <IonSkeletonText
            animated
            style={{ width: '80px', height: '24px', borderRadius: '12px' }}
          />
        </div>
      </div>

      {/* Content skeleton */}
      <div className='p-3'>
        <div className='flex gap-3 mb-3'>
          <IonSkeletonText
            animated
            style={{ width: '96px', height: '96px', borderRadius: '8px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '96px', height: '96px', borderRadius: '8px' }}
          />
          <div className='flex-1'>
            <IonSkeletonText
              animated
              style={{ width: '70%', height: '18px', marginBottom: '8px' }}
            />
            <IonSkeletonText
              animated
              style={{ width: '90%', height: '14px', marginBottom: '4px' }}
            />
            <IonSkeletonText
              animated
              style={{ width: '80%', height: '14px' }}
            />
          </div>
        </div>
        {/* Buttons skeleton */}
        <div className='flex gap-2 mt-3 pt-3 border-t border-gray-200'>
          <IonSkeletonText
            animated
            style={{ width: '50%', height: '40px', borderRadius: '4px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '50%', height: '40px', borderRadius: '4px' }}
          />
        </div>
      </div>
    </IonCardContent>
  </IonCard>
))

export default FraudReportSkeleton
