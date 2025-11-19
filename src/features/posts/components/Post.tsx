import React, { memo } from 'react'
import {
  IonCard,
  IonCardContent,
  IonItem,
  IonAvatar,
  IonLabel,
  IonIcon,
  IonButtons,
  IonButton,
  IonText,
  IonChip
} from '@ionic/react'
import { ellipsisVertical, personCircle } from 'ionicons/icons'
import ExpandableImage from '@/shared/components/ExpandableImage'

import { IonActionSheet } from '@ionic/react'

export type CatalogPostProps = {
  username?: string | null
  user_profile_picture_url?: string | null
  itemName?: string | null
  description?: string | null
  category?: string | null
  lastSeen?: string | null
  imageUrl?: string | null
  locationLastSeenAt?: string | null
  className?: string | null
  onKebabButtonClick?: () => void | undefined
  itemStatus?: string | null
  showAnonIndicator?: boolean
  // New props for external action sheet control
  actionSheetOpen?: boolean
  onActionSheetDismiss?: () => void
  actionSheetButtons?: any[]
}

const Post: React.FC<CatalogPostProps> = ({
  username = 'Profile Picture and Username',
  user_profile_picture_url = null,
  itemName = 'Item Name',
  description = 'Some really really really really long description that should be truncated.',
  lastSeen = 'MM/DD/YYYY 00:00 AM/PM',
  imageUrl,
  className = '',
  category,
  locationLastSeenAt = 'Location where item was last seen',
  onKebabButtonClick = undefined,
  itemStatus = null,
  showAnonIndicator = false,
  actionSheetOpen = false,
  onActionSheetDismiss,
  actionSheetButtons
}) => {
  const normalizedStatus = (itemStatus || '').toLowerCase()
  const statusColorClass =
    normalizedStatus === 'unclaimed'
      ? 'text-red-600'
      : normalizedStatus === 'claimed'
      ? 'text-green-600'
      : ''
  return (
    <IonCard
      className={`shadow-md border border-gray-200 font-default-font min-h-[93%] px-2 ${className}`}
    >
      {/* Header with avatar + username + kebab menu */}
      <IonItem lines='none' className='py-2 -mx-2'>
        <IonAvatar slot='start'>
          {user_profile_picture_url ? (
            <img
              src={user_profile_picture_url}
              alt={username ?? 'Profile Picture'}
              className='w-full h-full object-cover'
            />
          ) : (
            <IonIcon
              icon={personCircle}
              className='w-full h-full text-gray-400'
            />
          )}
        </IonAvatar>
        <IonLabel>
          <div className='font-semibold text-umak-blue pl-3 flex items-center gap-2'>
            <p>{username}</p>
            {showAnonIndicator && (
              <IonChip color='medium' className='ml-2 text-xs px-2 py-0 h-6'>
                Anonymous
              </IonChip>
            )}
          </div>
        </IonLabel>
        <IonButtons slot='end'>
          <IonButton
            fill='clear'
            color='medium'
            aria-label='More options'
            onClick={() => onKebabButtonClick?.()}
          >
            <IonIcon icon={ellipsisVertical} />
          </IonButton>
        </IonButtons>
      </IonItem>
      <div className='h-px bg-black mx-3'></div>

      <IonCardContent className='-mt-2'>
        <div className='text-xl font-bold text-gray-900 flex justify-between items-center'>
          <span>{itemName}</span>{' '}
          <span className={`text-sm ${statusColorClass}`}>
            {itemStatus
              ? itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1)
              : null}
          </span>
        </div>
        <div className='h-px w-full my-2 bg-gray-300' />
        <p className='text-slate-900 pb-2 leading-snug line-clamp-2'>
          {description}
        </p>
        <React.Suspense
          fallback={
            <div className='h-56 bg-gray-50 border border-gray-200 rounded-xl animate-pulse' />
          }
        >
          {imageUrl && (
            <ExpandableImage
              src={imageUrl}
              alt={itemName ?? 'Post Image'}
              className='justify-center w-full! h-100! items-center overflow-hidden  rounded-xl'
            />
          )}
        </React.Suspense>
        <div className='flex flex-col my-3 text-xl text-slate-900'>
          <IonText class='font-extrabold'>
            <strong>Last seen:</strong>
          </IonText>
          <IonText className='text-base '>{lastSeen}</IonText>
        </div>
        {category && (
          <div className='flex flex-col my-3 text-xl text-slate-900'>
            <IonText class='font-extrabold'>
              <strong>Categories:</strong>
            </IonText>
            <IonChip className='w-fit bg-umak-blue text-white px-10 mt-1'>
              {category}
            </IonChip>
          </div>
        )}
        <div className='flex flex-col text-xl text-slate-900'>
          <IonText class='font-extrabold'>
            <strong>Location:</strong>
          </IonText>
          <IonText className='text-base'>{locationLastSeenAt}</IonText>
        </div>
      </IonCardContent>
      {/* Render ActionSheet if props provided */}
      {typeof actionSheetOpen !== 'undefined' && actionSheetButtons && (
        <IonActionSheet
          isOpen={actionSheetOpen}
          onDidDismiss={onActionSheetDismiss}
          header='Post actions'
          buttons={actionSheetButtons}
        />
      )}
    </IonCard>
  )
}

export default memo(Post)
