import type { CSSProperties, RefObject } from 'react'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonSpinner
} from '@ionic/react'
import {
  cameraOutline,
  checkmarkCircle,
  closeOutline,
  keyOutline
} from 'ionicons/icons'

interface ClaimVerificationPanelProps {
  mode: 'staff' | 'guard'
  isVerifying: boolean
  isScannerSupported: boolean
  manualClaimCode: string
  scannerState: {
    isOpen: boolean
    message: string
  }
  videoRef: RefObject<HTMLVideoElement | null>
  isResolvingClaimCode: boolean
  onCloseCamera: () => void
  onManualClaimCodeChange: (value: string) => void
  onOpenCamera: () => void
  onResolveClaimCode: () => void
}

export default function ClaimVerificationPanel ({
  mode,
  isVerifying,
  isScannerSupported,
  manualClaimCode,
  scannerState,
  videoRef,
  isResolvingClaimCode,
  onCloseCamera,
  onManualClaimCodeChange,
  onOpenCamera,
  onResolveClaimCode
}: ClaimVerificationPanelProps) {
  const statusTone = 'border-[#1D2981]/20 bg-[#1D2981]/10 text-[#1D2981]'

  return (
    <IonCard className='mb-6 rounded-2xl border border-slate-200/70 shadow-sm'>
      <IonCardContent className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-lg font-extrabold text-umak-blue'>Student Claim QR</p>
            <p className='mt-1 text-sm leading-relaxed text-slate-600'>
              {mode === 'guard'
                ? 'Ask the student to open their claim QR in UMak-LINK, then scan it here. Guards can also use the 6-character claim code if the camera cannot read the QR.'
                : 'Ask the student to open their claim QR in UMak-LINK, then scan it here. Staff can still search or type a claimer manually if needed.'}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}
          >
            Direct QR
          </span>
        </div>

        <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
          <div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
            <IonIcon icon={cameraOutline} className='text-lg text-umak-blue' />
            <span>Camera Scanner</span>
          </div>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Point the camera at the student&apos;s claim QR to fill in the claimer details.
          </p>

          <div className='mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm'>
            {scannerState.isOpen ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className='h-72 w-full object-cover'
              />
            ) : (
              <div className='flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-white/90'>
                <IonIcon icon={cameraOutline} className='text-4xl' />
                <p className='text-base font-semibold'>Camera preview appears here.</p>
                <p className='text-sm leading-6 text-white/75'>
                  Hold the student claim QR inside the frame until the claimer details appear.
                </p>
              </div>
            )}
          </div>

          <p className='mt-3 text-sm leading-6 text-slate-600'>
            {scannerState.message}
          </p>

          <div className='mt-4 space-y-3'>
            {scannerState.isOpen ? (
              <IonButton
                fill='outline'
                expand='block'
                onClick={onCloseCamera}
                disabled={isVerifying}
                style={
                  {
                    '--border-color': 'var(--color-umak-blue)',
                    '--color': 'var(--color-umak-blue)'
                  } as CSSProperties
                }
              >
                <IonIcon icon={closeOutline} slot='start' />
                Close Camera
              </IonButton>
            ) : (
              <IonButton
                expand='block'
                onClick={onOpenCamera}
                disabled={isVerifying}
                style={
                  {
                    '--background': 'var(--color-umak-blue)'
                  } as CSSProperties
                }
              >
                {isVerifying ? (
                  <>
                    <IonSpinner name='crescent' className='mr-2 h-4 w-4' />
                    Verifying Student
                  </>
                ) : (
                  <>
                    <IonIcon icon={cameraOutline} slot='start' />
                    Open Camera
                  </>
                )}
              </IonButton>
            )}

            <p className='text-sm leading-6 text-slate-600'>
              {isScannerSupported
                ? mode === 'guard'
                  ? 'If the camera cannot scan the code, use the claim code below.'
                  : 'If the camera cannot scan the code, use the claimer search or claim code below.'
                : mode === 'guard'
                  ? 'If this device cannot scan QR codes, use the claim code below.'
                  : 'If this device cannot scan QR codes, use the claimer search or claim code below.'}
            </p>
          </div>
        </div>

        <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
          <div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
            <IonIcon icon={keyOutline} className='text-lg text-umak-blue' />
            <span>Manual Claim Code</span>
          </div>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            If the camera cannot scan the student&apos;s QR, ask them to read the
            6-character claim code shown below it.
          </p>

          <div className='mt-4 space-y-4'>
            <div>
              <label
                htmlFor='claim-manual-code'
                className='text-sm font-semibold text-slate-800'
              >
                Claim Code
              </label>
              <IonInput
                id='claim-manual-code'
                value={manualClaimCode}
                fill='outline'
                placeholder='Enter the 6-character code'
                maxlength={6}
                autoCapitalize='characters'
                onIonInput={event =>
                  onManualClaimCodeChange(String(event.detail.value ?? ''))
                }
              />
            </div>

            <IonButton
              expand='block'
              fill='outline'
              onClick={onResolveClaimCode}
              disabled={isResolvingClaimCode || manualClaimCode.trim().length !== 6}
              style={
                {
                  '--border-color': 'var(--color-umak-blue)',
                  '--color': 'var(--color-umak-blue)'
                } as CSSProperties
              }
            >
              {isResolvingClaimCode ? (
                <>
                  <IonSpinner name='crescent' className='mr-2 h-4 w-4' />
                  Loading Claimer
                </>
              ) : (
                <>
                  <IonIcon icon={checkmarkCircle} slot='start' />
                  Use Claim Code
                </>
              )}
            </IonButton>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  )
}
