import type { CSSProperties } from 'react'
import { IonButton } from '@ionic/react'
import type { UserCustodyResultModalProps } from '@/features/user/custody/types/user-custody'

export default function UserCustodyResultModal ({
  isOpen,
  title,
  message,
  onClose
}: UserCustodyResultModalProps) {
  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/55 px-4'
      data-testid='user-custody-result-modal'
    >
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl'>
        <p
          className='text-xl font-extrabold text-umak-blue'
          data-testid='user-custody-result-title'
        >
          {title}
        </p>
        <p
          className='mt-3 text-sm leading-relaxed text-slate-700'
          data-testid='user-custody-result-message'
        >
          {message}
        </p>
        <div className='mt-6 flex justify-end'>
          <IonButton
            onClick={onClose}
            style={
              {
                '--background': 'var(--color-umak-blue)'
              } as CSSProperties
            }
          >
            Close
          </IonButton>
        </div>
      </div>
    </div>
  )
}
