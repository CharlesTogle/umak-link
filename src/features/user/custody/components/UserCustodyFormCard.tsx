import type { CSSProperties } from 'react'
import { IonButton, IonIcon, IonSpinner } from '@ionic/react'
import { qrCodeOutline } from 'ionicons/icons'
import ImageUpload from '@/shared/components/ImageUpload'
import { create } from 'ionicons/icons'
import UserCustodyGuardPostField from '@/features/user/custody/components/UserCustodyGuardPostField'
import type { UserCustodyFormCardProps } from '@/features/user/custody/types/user-custody'

export default function UserCustodyFormCard ({
  guardPosts,
  isGuardPostsLoading,
  guardPostsErrorMessage = null,
  selectedGuardPostId,
  handoverImage,
  isSubmitting,
  onGuardPostChange,
  onHandoverImageChange,
  onOpenQrCode
}: UserCustodyFormCardProps) {
  return (
    <div className='mt-3 shadow-md p-4 border border-gray-200 bg-white'>
      <div className='flex items-center space-x-2'>
        <IonIcon
          icon={create}
          className='text-[#1e2b87]'
          style={{ fontSize: '32px', ['--ionicon-stroke-width']: '40px' }}
        />
        <div className='text-umak-blue font-default-font text-base font-normal'>
          Handover to Guard
        </div>
      </div>
      <div className='w-full h-px bg-slate-900 my-3' />
      <p className='mb-4 text-sm leading-relaxed text-slate-700'>
        Match the handover workflow already used in custody: choose the guard
        post, upload one image showing the item and guard, then open the unique
        QR for this handover session.
      </p>

      <UserCustodyGuardPostField
        guardPosts={guardPosts}
        isLoading={isGuardPostsLoading}
        errorMessage={guardPostsErrorMessage}
        selectedGuardPostId={selectedGuardPostId}
        onGuardPostChange={onGuardPostChange}
      />
      <ImageUpload
        label='Upload Image of Item and Guard'
        image={handoverImage}
        isRequired={true}
        onImageChange={onHandoverImageChange}
      />

      <div className='mt-6 flex justify-end'>
        <IonButton
          data-testid='user-custody-open-qr'
          disabled={
            isSubmitting ||
            !selectedGuardPostId ||
            handoverImage === null
          }
          onClick={onOpenQrCode}
          style={
            {
              '--background': 'var(--color-umak-blue)'
            } as CSSProperties
          }
        >
          {isSubmitting
            ? (
              <IonSpinner name='crescent' />
              )
            : (
              <>
                <IonIcon icon={qrCodeOutline} slot='start' />
                Open Unique QR Code
              </>
              )}
        </IonButton>
      </div>
    </div>
  )
}
