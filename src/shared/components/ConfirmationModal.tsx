import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const portalElRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const el = document.createElement('div')
    el.className = 'confirmation-modal-portal'
    portalElRef.current = el
    document.body.appendChild(el)
    return () => {
      if (portalElRef.current && portalElRef.current.parentNode) {
        portalElRef.current.parentNode.removeChild(portalElRef.current)
      }
      portalElRef.current = null
    }
  }, [])

  const modal = (
    <>
      {isOpen && (
        <div
          className='fixed inset-0 flex items-center justify-center bg-black/50'
          style={{ zIndex: 99999 }}
        >
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg mx-4'>
            <div className='flex flex-row'>
              <div className='w-1/3 flex items-center mr-2'>
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
                style={
                  {
                    '--background': 'var(--color-green-600)'
                  } as any
                }
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

  if (portalElRef.current) {
    return createPortal(modal, portalElRef.current)
  }

  return null
}
