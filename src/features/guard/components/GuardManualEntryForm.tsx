import type { CSSProperties } from 'react'
import { useState } from 'react'
import { IonButton, IonInput, IonSpinner } from '@ionic/react'
import type { GuardManualEntryFormProps } from '@/features/guard/types/guard-custody'

export default function GuardManualEntryForm ({
  isSubmitting,
  onSubmit
}: GuardManualEntryFormProps) {
  const [qrCodeSessionId, setQrCodeSessionId] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = async () => {
    const trimmedQrCodeSessionId = qrCodeSessionId.trim()
    const trimmedSessionToken = sessionToken.trim()

    if (!trimmedQrCodeSessionId || !trimmedSessionToken) {
      setValidationError('QR session ID and session token are required.')
      return
    }

    setValidationError('')
    await onSubmit({
      qrCodeSessionId: trimmedQrCodeSessionId,
      sessionToken: trimmedSessionToken
    })
  }

  return (
    <div className='space-y-4 font-default-font' data-testid='guard-manual-entry-form'>
      <div className='space-y-2'>
        <label
          htmlFor='guard-qr-session-id'
          className='text-sm font-semibold text-slate-800'
        >
          QR Session ID
        </label>
        <IonInput
          id='guard-qr-session-id'
          value={qrCodeSessionId}
          fill='outline'
          placeholder='Paste the QR session ID'
          onIonInput={event => setQrCodeSessionId(String(event.detail.value ?? ''))}
          data-testid='guard-qr-session-id-input'
        />
      </div>

      <div className='space-y-2'>
        <label
          htmlFor='guard-session-token'
          className='text-sm font-semibold text-slate-800'
        >
          Session Token
        </label>
        <IonInput
          id='guard-session-token'
          value={sessionToken}
          fill='outline'
          placeholder='Paste the session token'
          onIonInput={event => setSessionToken(String(event.detail.value ?? ''))}
          data-testid='guard-session-token-input'
        />
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
