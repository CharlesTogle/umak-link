import { memo } from 'react'
import { IonCard, IonCardContent, IonItem } from '@ionic/react'

/**
 * CatalogPostSkeleton
 * A compact skeleton placeholder for catalog post cards (used while loading).
 */
export default memo(function CatalogPostSkeleton ({
  className = ''
}: {
  className?: string
}) {
  return (
    <IonCard
      className={`shadow-sm border border-gray-200 font-default-font overflow-hidden px-2 ${className}`}
    >
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

      <div className='h-px bg-black mx-3 opacity-10' />

      <IonCardContent className='-mt-2'>
        <div className='text-xl font-bold text-gray-900 flex justify-between items-center mb-2'>
          <div className='h-6 w-48 bg-gray-200 rounded animate-pulse' />
          <div className='h-4 w-20 bg-gray-200 rounded animate-pulse' />
        </div>

        <div className='space-y-2 mb-3'>
          <div className='h-3 w-full bg-gray-200 rounded animate-pulse' />
          <div className='h-3 w-5/6 bg-gray-200 rounded animate-pulse' />
        </div>

        <div className='h-40 bg-gray-100 border border-gray-200 rounded-xl animate-pulse mb-3' />

        <div className='flex items-center gap-2 mt-3 text-xs text-gray-500'>
          <div className='h-3 w-20 bg-gray-200 rounded animate-pulse' />
        </div>

        <div className='flex items-center gap-2 mt-3 text-xs text-gray-500'>
          <div className='h-3 w-28 bg-gray-200 rounded animate-pulse' />
        </div>
      </IonCardContent>
    </IonCard>
  )
})
