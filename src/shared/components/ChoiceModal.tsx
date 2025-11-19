import React, { useEffect, useState } from 'react'
import { IonModal, IonButton } from '@ionic/react'
import CustomRadioGroup from './CustomRadioGroup'

interface ChoiceModalProps {
  isOpen: boolean
  header: string
  subheading1?: string
  subheading2?: string
  choices: string[]
  onSubmit: (choice: string) => void
  onDidDismiss?: () => void
}

export const ChoiceModal: React.FC<ChoiceModalProps> = ({
  isOpen,
  header,
  subheading1,
  subheading2,
  choices,
  onSubmit,
  onDidDismiss
}) => {
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    if (isOpen && choices.length > 0) {
      setSelected(choices[0])
    }
  }, [isOpen, choices])

  const handleSubmit = () => {
    if (!selected) return
    onSubmit(selected)
    onDidDismiss?.()
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      breakpoints={[0, 0.45, 0.6]}
      initialBreakpoint={0.45}
      className='flex items-center justify-center font-default-font '
    >
      <div className='w-full max-w-md bg-white p-6 min-h-full shadow-lg'>
        <div className='mb-1 text-center text-lg font-semibold text-gray-900'>
          {header}
        </div>
        {subheading1 && (
          <div className='mb-3 -mt-1 text-center text-base text-gray-600'>
            {subheading1}
          </div>
        )}
        <div className='mt-2 border-t border-gray-black' />
        <CustomRadioGroup
          value={selected}
          options={choices.map(choice => ({
            label: choice,
            value: choice
          }))}
          onChange={val => setSelected(val as string)}
          direction='horizontal'
          isRequired={false}
          gap='4'
          className='my-3!'
        />
        <div className='border-t mb-1 border-black' />
        {subheading2 && (
          <div className='text-center text-sm text-gray-500'>{subheading2}</div>
        )}
        <div className='mt-4 flex justify-end gap-3'>
          <IonButton
            fill='clear'
            onClick={onDidDismiss}
            className='text-sm font-medium text-gray-600'
          >
            Cancel
          </IonButton>

          <IonButton
            onClick={handleSubmit}
            disabled={!selected}
            className='rounded-md py-2 text-sm shadow-none! text-white disabled:opacity-50'
            style={{
              '--background': 'var(--color-umak-blue)'
            }}
          >
            Submit
          </IonButton>
        </div>
      </div>
    </IonModal>
  )
}
