import type { CSSProperties } from 'react'
import { IonButton, IonIcon, IonSpinner } from '@ionic/react'
import { cameraOutline, closeOutline, qrCodeOutline } from 'ionicons/icons'
import GuardSurfaceCard from '@/features/guard/components/GuardSurfaceCard'
import { useGuardQrScanner } from '@/features/guard/hooks/useGuardQrScanner'
import type { GuardCameraScannerCardProps } from '@/features/guard/types/guard-custody'

export default function GuardCameraScannerCard ({
  isSubmitting,
  onScan
}: GuardCameraScannerCardProps) {
  const {
    closeCamera,
    isSupported,
    openCamera,
    state,
    videoRef
  } = useGuardQrScanner({
    onDetected: onScan
  })

  return (
    <GuardSurfaceCard
      title='Scan with Camera'
      subtitle="Point the camera at the student's QR code to open the review."
      testId='guard-camera-scan-card'
    >
      <div className='space-y-4'>
        <div className='rounded-2xl border border-[#1D2981]/10 bg-[#1D2981]/5 p-4'>
          <div className='flex items-center gap-2 text-sm font-semibold text-umak-blue'>
            <IonIcon icon={qrCodeOutline} className='text-lg' />
            <span>Scan the QR code to open the review automatically.</span>
          </div>
          <p className='mt-2 text-sm leading-6 text-slate-700' data-testid='guard-camera-status'>
            {state.message}
          </p>
        </div>

        <div className='mx-auto w-full max-w-[22rem]'>
          <div
            className='relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 shadow-sm'
            data-testid='guard-camera-preview-shell'
          >
            {state.isOpen ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className='h-72 w-full object-cover'
                  data-testid='guard-camera-preview'
                />
                <div className='pointer-events-none absolute inset-0 flex items-center justify-center px-8'>
                  <div className='h-44 w-full max-w-[15rem] rounded-[1.75rem] border-2 border-white/90 shadow-[0_0_0_999px_rgba(15,23,42,0.18)]' />
                </div>
              </>
            ) : (
              <div className='flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-white/90'>
                <IonIcon icon={cameraOutline} className='text-4xl' />
                <p className='text-base font-semibold'>Camera preview appears here.</p>
                <p className='text-sm leading-6 text-white/75'>
                  Keep the student QR inside the frame until the review screen opens.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className='space-y-3'>
          {state.isOpen ? (
            <IonButton
              fill='outline'
              expand='block'
              onClick={closeCamera}
              disabled={isSubmitting}
              style={
                {
                  '--border-color': 'var(--color-umak-blue)',
                  '--color': 'var(--color-umak-blue)'
                } as CSSProperties
              }
              data-testid='guard-close-camera'
            >
              <IonIcon icon={closeOutline} slot='start' />
              Close Camera
            </IonButton>
          ) : (
            <IonButton
              expand='block'
              onClick={() => {
                void openCamera()
              }}
              disabled={isSubmitting}
              style={
                {
                  '--background': 'var(--color-umak-blue)'
                } as CSSProperties
              }
              data-testid='guard-open-camera'
            >
              {isSubmitting ? (
                <>
                  <IonSpinner name='crescent' className='mr-2 h-4 w-4' />
                  Loading Review
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
            {isSupported
              ? 'If the camera cannot scan the code, use manual entry below.'
              : 'If this device cannot scan QR codes, use manual entry below.'}
          </p>
        </div>
      </div>
    </GuardSurfaceCard>
  )
}
