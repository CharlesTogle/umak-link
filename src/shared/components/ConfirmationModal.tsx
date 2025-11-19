import React from 'react'
import { IonIcon, IonButton } from '@ionic/react'
import { alertCircle } from 'ionicons/icons'

interface ConfirmationModalProps {
  isOpen: boolean
  heading: string
  subheading: string
  onSubmit: () => void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  heading,
  subheading,
  onSubmit,
  onCancel,
  submitLabel = 'Accept',
  cancelLabel = 'Cancel'
}) => {
  return (
    <>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg mx-4'>
            <div className='flex flex-row'>
              <div className='w-1/3 flex items-center'>
                <IonIcon
                  icon={alertCircle}
                  className='text-umak-blue text-4xl'
                />
              </div>
              <div>
                {/* Icon and heading */}
                <div className='flex-1'>
                  <h2 className='text-lg! mb-0! font-bold! text-gray-900'>
                    {heading}
                  </h2>
                </div>

                {/* Subheading */}
                <p className='text-gray-600 text-sm mb-6 leading-relaxed'>
                  {subheading}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className='border-t border-gray-300 mb-6' />

            {/* Action buttons */}
            <div className='flex justify-end gap-3'>
              <IonButton
                fill='clear'
                onClick={onCancel}
                className='text-gray-700 font-medium'
              >
                {cancelLabel}
              </IonButton>
              <IonButton
                fill='solid'
                onClick={onSubmit}
                style={{
                  '--background': '#10B981'
                }}
                className='text-white font-medium'
              >
                {submitLabel}
              </IonButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
