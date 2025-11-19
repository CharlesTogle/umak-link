import { IonContent, IonSkeletonText } from '@ionic/react'
import Header from '@/shared/components/Header'

export default function ClaimItemLoadingSkeleton () {
  return (
    <IonContent>
      <Header logoShown isProfileAndNotificationShown />

      <div className='ion-padding'>
        {/* Header skeleton */}
        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-3'>
            <IonSkeletonText
              animated
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            />
            <IonSkeletonText
              animated
              style={{ width: '200px', height: '24px' }}
            />
          </div>
          <IonSkeletonText animated style={{ width: '100%', height: '1px' }} />
        </div>

        {/* Item to be claimed skeleton */}
        <div className='mb-6'>
          <IonSkeletonText
            animated
            style={{ width: '150px', height: '20px', marginBottom: '12px' }}
          />
          <div className='bg-white rounded-lg p-4 shadow-sm border border-gray-200'>
            <div className='flex gap-4'>
              <IonSkeletonText
                animated
                style={{ width: '80px', height: '80px', borderRadius: '8px' }}
              />
              <div className='flex-1'>
                <IonSkeletonText
                  animated
                  style={{ width: '70%', height: '20px', marginBottom: '8px' }}
                />
                <IonSkeletonText
                  animated
                  style={{ width: '100%', height: '16px', marginBottom: '4px' }}
                />
                <IonSkeletonText
                  animated
                  style={{ width: '90%', height: '16px', marginBottom: '8px' }}
                />
                <IonSkeletonText
                  animated
                  style={{ width: '40%', height: '14px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Claimer email skeleton */}
        <div className='mb-6'>
          <IonSkeletonText
            animated
            style={{ width: '180px', height: '20px', marginBottom: '12px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '100%', height: '48px', borderRadius: '8px' }}
          />
        </div>

        {/* Contact number skeleton */}
        <div className='mb-6'>
          <IonSkeletonText
            animated
            style={{ width: '150px', height: '20px', marginBottom: '12px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '100%', height: '40px', borderRadius: '8px' }}
          />
        </div>

        {/* Claimed at skeleton */}
        <div className='mb-6'>
          <IonSkeletonText
            animated
            style={{ width: '120px', height: '20px', marginBottom: '12px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '200px', height: '40px', borderRadius: '20px' }}
          />
        </div>

        {/* Lost item post link skeleton */}
        <div className='mb-6'>
          <IonSkeletonText
            animated
            style={{ width: '140px', height: '20px', marginBottom: '12px' }}
          />
          <IonSkeletonText
            animated
            style={{ width: '100%', height: '40px', borderRadius: '8px' }}
          />
        </div>

        {/* Submit button skeleton */}
        <IonSkeletonText
          animated
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '8px',
            marginTop: '24px'
          }}
        />
      </div>
    </IonContent>
  )
}
