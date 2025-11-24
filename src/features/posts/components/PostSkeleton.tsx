import React, { memo } from 'react'
import { IonCard, IonCardContent, IonItem } from '@ionic/react'

export type CatalogPostProps = {
  className?: string
  withStatusCard?: boolean
}

/**
 * ExpandedPostSkeleton
 * A lightweight skeleton placeholder for the expanded post view.
 */
const ExpandedPostSkeleton: React.FC<CatalogPostProps> = ({
  className = '',
  withStatusCard = false
}) => {
  return (
    <IonCard
      className={` shadow-md border border-gray-200 font-default-font px-2 ${className}`}
    >
      {withStatusCard && (
        <IonCard className='my-4'>
          <IonCardContent>
            <div className='flex flex-col place-items-center text-center'>
              <div className='h-7 w-32 bg-gray-200 rounded animate-pulse mb-2' />
              <div className='h-5 w-48 bg-gray-200 rounded animate-pulse' />
            </div>
          </IonCardContent>
        </IonCard>
      )}
      {/* Header skeleton */}
      <IonItem lines='none' className='py-2 -mx-2 items-center'>
        <div
          className='w-10 h-10 rounded-full bg-gray-200 animate-pulse'
          style={{ flexShrink: 0 }}
        />
        <div className='ml-3 flex-1'>
          <div className='h-4 w-36 bg-gray-200 rounded animate-pulse mb-2' />
          <div className='h-3 w-20 bg-gray-200 rounded animate-pulse' />
        </div>
        <div className='w-6 h-6 bg-gray-200 rounded animate-pulse' />
      </IonItem>

      <div className='h-px bg-black mx-3 opacity-10'></div>

      <IonCardContent className='-mt-2'>
        {/* Title + status */}
        <div className='flex justify-between items-center mb-3'>
          <div className='h-6 w-48 bg-gray-200 rounded animate-pulse' />
          <div className='h-4 w-20 bg-gray-200 rounded animate-pulse' />
        </div>
        {/* short description lines */}
        <div className='space-y-2 mb-3'>
          <div className='h-3 w-full bg-gray-200 rounded animate-pulse' />
          <div className='h-3 w-5/6 bg-gray-200 rounded animate-pulse' />
        </div>
        {/* image placeholder */}
        <div className='h-90 bg-gray-100 border border-gray-200 rounded-xl animate-pulse mb-4' />
        {/* Last seen */}
        <div className='mb-3'>
          <div className='h-4 w-32 bg-gray-200 rounded animate-pulse mb-1' />
          <div className='h-3 w-40 bg-gray-200 rounded animate-pulse' />
        </div>
        {/* category chip placeholder */}
        <div className='mb-3'>
          <div className='inline-block h-6 px-5 bg-gray-200 rounded-full animate-pulse' />
        </div>
        {/* Location */}
        <div>
          <div className='h-4 w-28 bg-gray-200 rounded animate-pulse mb-1' />
          <div className='h-3 w-48 bg-gray-200 rounded animate-pulse mb-3' />
        </div>
        <div className='mb-3'>
          <div className='h-4 w-32 bg-gray-200 rounded animate-pulse mb-1' />
          <div className='h-3 w-40 bg-gray-200 rounded animate-pulse mb-3' />
        </div>
        <div className='mb-3'>
          <div className='h-4 w-32 bg-gray-200 rounded animate-pulse mb-1' />
          <div className='h-3 w-40 bg-gray-200 rounded animate-pulse mb-3' />
        </div>
      </IonCardContent>
    </IonCard>
  )
}

export default memo(ExpandedPostSkeleton)
