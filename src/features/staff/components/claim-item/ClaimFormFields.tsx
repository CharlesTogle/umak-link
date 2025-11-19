import { IonIcon, IonText } from '@ionic/react'
import { alertCircle } from 'ionicons/icons'
import FormSectionHeader from '@/shared/components/FormSectionHeader'
import DateTimeSelector from '@/shared/components/DateTimeSelector'
import PostCard from '@/features/posts/components/PostCard'
import PostSkeleton from '@/features/posts/components/PostSkeleton'
import type { PublicPost } from '@/features/posts/types/post'

interface ClaimFormFieldsProps {
  contactNumber: string
  onContactNumberChange: (value: string) => void
  dateTimeValue: string
  onDateTimeChange: (iso: string) => void
  maxDateTime: string
  lostItemPostLink: string
  onLostItemPostLinkChange: (value: string) => void
  lostItemPost: PublicPost | null
  lostItemPostLoading: boolean
  lostItemPostError: string | null
}

export default function ClaimFormFields ({
  contactNumber,
  onContactNumberChange,
  dateTimeValue,
  onDateTimeChange,
  maxDateTime,
  lostItemPostLink,
  onLostItemPostLinkChange,
  lostItemPost,
  lostItemPostLoading,
  lostItemPostError
}: ClaimFormFieldsProps) {
  return (
    <>
      {/* Contact Number Field */}
      <div className='mb-6'>
        <FormSectionHeader header='Contact Number' isRequired={true} />
        <input
          type='tel'
          placeholder='0912 345 6789'
          value={contactNumber}
          onChange={e => onContactNumberChange(e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-umak-blue'
        />
      </div>

      {/* Claimed At Field */}
      <DateTimeSelector
        dateTimeButtonClassName='date-time-claim'
        header='Claimed At'
        isRequired={true}
        datetimeId='claimed-datetime'
        value={dateTimeValue}
        onChange={onDateTimeChange}
        max={maxDateTime}
      />

      {/* Lost Item Post Link Field */}
      <div className='mb-6'>
        <FormSectionHeader header='Lost Item Post' isRequired={false} />
        <p className='text-sm text-gray-600 mb-3'>
          Paste only the link of the claimer&apos;s Missing Item post.
        </p>
        <input
          type='url'
          placeholder='https://'
          value={lostItemPostLink}
          onChange={e => onLostItemPostLinkChange(e.target.value)}
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-umak-blue'
        />
      </div>

      {/* Claimer's Lost Item Post Display (if available) */}
      {lostItemPostLink && (
        <div className='mb-6'>
          <FormSectionHeader header="Claimer's Lost Item Post" />
          {lostItemPostLoading ? (
            <div className='w-full grid place-items-center py-8'>
              <PostSkeleton />
            </div>
          ) : lostItemPost ? (
            <PostCard
              imgUrl={lostItemPost.item_image_url || ''}
              title={lostItemPost.item_name || 'Item'}
              description={lostItemPost.item_description || ''}
              owner={
                lostItemPost.is_anonymous
                  ? 'Anonymous'
                  : lostItemPost.username || 'Unknown'
              }
            />
          ) : lostItemPostError ? (
            <div className='p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2'>
              <IonIcon
                icon={alertCircle}
                className='text-red-600 text-xl flex-shrink-0 mt-0.5'
              />
              <IonText color='danger' className='text-sm'>
                {lostItemPostError}
              </IonText>
            </div>
          ) : (
            <div className='p-4 bg-slate-50 border border-slate-200 rounded-lg'>
              <IonText className='text-sm text-slate-600'>
                Enter a valid Missing item post link to preview
              </IonText>
            </div>
          )}
        </div>
      )}
    </>
  )
}
