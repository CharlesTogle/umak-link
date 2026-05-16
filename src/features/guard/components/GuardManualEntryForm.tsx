import type { CSSProperties } from 'react'
import { useState } from 'react'
import { IonButton, IonInput, IonSpinner } from '@ionic/react'
import type { GuardManualEntryFormProps } from '@/features/guard/types/guard-custody'

export default function GuardManualEntryForm ({
  isSubmitting,
  onSubmit
}: GuardManualEntryFormProps) {
  const [manualEntryCode, setManualEntryCode] = useState('')
  const [validationError, setValidationError] = useState('')

  const normalizeManualEntryCode = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)

  const handleSubmit = async () => {
    const trimmedManualEntryCode = normalizeManualEntryCode(manualEntryCode)

    if (!trimmedManualEntryCode) {
      setValidationError('Manual entry code is required.')
      return
    }

    setValidationError('')
    await onSubmit({
      manualEntryCode: trimmedManualEntryCode
    })
  }

  return (
    <div className='space-y-4 font-default-font' data-testid='guard-manual-entry-form'>
      <div className='space-y-2'>
        <label
          htmlFor='guard-manual-entry-code'
          className='text-sm font-semibold text-slate-800'
        >
          Manual Entry Code
        </label>
        <IonInput
          id='guard-manual-entry-code'
          value={manualEntryCode}
          fill='outline'
          placeholder='Enter the 6-character code'
          onIonInput={event => {
            setValidationError('')
            setManualEntryCode(
              normalizeManualEntryCode(String(event.detail.value ?? ''))
            )
          }}
          maxlength={6}
          autoCapitalize='characters'
          data-testid='guard-manual-entry-code-input'
        />
        <p className='text-sm leading-6 text-slate-600'>
          Only the code shown on the student&apos;s screen is needed here.
        </p>
      </div>

      {validationError ? (
        <p className='text-sm text-rose-600' data-testid='guard-entry-error'>
          {validationError}
        </p>
      ) : null}

      <IonButton
        expand='block'
        style={
          {
            '--background': 'var(--color-umak-blue)'
          } as CSSProperties
        }
        onClick={() => {
          void handleSubmit()
        }}
        disabled={isSubmitting}
        data-testid='guard-scan-submit'
      >
        {isSubmitting ? (
          <>
            <IonSpinner
              name='crescent'
              className='mr-2 h-4 w-4'
              data-testid='guard-scan-loading'
            />
            Loading Review
          </>
        ) : (
          'Load Handover Review'
        )}
      </IonButton>
    </div>
  )
}
