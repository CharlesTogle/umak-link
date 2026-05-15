import type { CSSProperties, RefObject } from 'react'
import {
  IonAvatar,
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
  personCircle,
  qrCodeOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons'
import type {
  ClaimVerifiedClaimerSummary,
  ClaimVerificationSessionStatusResponse
} from '@/shared/lib/api-types'

interface ClaimVerificationPanelProps {
  isSessionLoading: boolean
  isVerifying: boolean
  isScannerSupported: boolean
  joinedClaimer: ClaimVerifiedClaimerSummary | null
  sessionStatus: ClaimVerificationSessionStatusResponse | null
  manualQrSessionId: string
  manualQrSessionToken: string
  scannerState: {
    isOpen: boolean
    message: string
  }
  videoRef: RefObject<HTMLVideoElement | null>
  onCloseCamera: () => void
  onManualQrSessionIdChange: (value: string) => void
  onManualQrSessionTokenChange: (value: string) => void
  onOpenCamera: () => void
  onVerifyManualEntry: () => void
}

function formatStatusLabel (
  sessionStatus: ClaimVerificationSessionStatusResponse | null
): string {
  if (!sessionStatus) return 'Preparing session'

  switch (sessionStatus.status) {
    case 'awaiting_claimer':
      return 'Waiting for student'
    case 'qr_active':
      return 'Ready to scan'
    case 'scanned':
      return 'QR verified'
    case 'completed':
      return 'Completed'
    case 'expired':
      return 'Expired'
    case 'cancelled':
      return 'Cancelled'
    default:
      return sessionStatus.status
  }
}

function getStatusTone (
  sessionStatus: ClaimVerificationSessionStatusResponse | null
): string {
  switch (sessionStatus?.status) {
    case 'scanned':
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'expired':
    case 'cancelled':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    case 'qr_active':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600'
  }
}

export default function ClaimVerificationPanel ({
  isSessionLoading,
  isVerifying,
  isScannerSupported,
  joinedClaimer,
  sessionStatus,
  manualQrSessionId,
  manualQrSessionToken,
  scannerState,
  videoRef,
  onCloseCamera,
  onManualQrSessionIdChange,
  onManualQrSessionTokenChange,
  onOpenCamera,
  onVerifyManualEntry
}: ClaimVerificationPanelProps) {
  const isQrVerified = sessionStatus?.status === 'scanned' || sessionStatus?.status === 'completed'

  return (
    <IonCard className='mb-6 rounded-2xl border border-slate-200/70 shadow-sm'>
      <IonCardContent className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-lg font-extrabold text-umak-blue'>Claim Session</p>
            <p className='mt-1 text-sm leading-relaxed text-slate-600'>
              The claim session starts as soon as this page opens. Ask the student
              to join, generate their unique QR code, then scan it here. Staff can
              still type a claimer manually if needed.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(
              sessionStatus
            )}`}
          >
            {formatStatusLabel(sessionStatus)}
          </span>
        </div>

        <div className='my-4 h-px w-full bg-slate-200' />

        <div className='rounded-2xl border border-[#1D2981]/10 bg-[#1D2981]/5 p-4'>
          <div className='flex items-center gap-2 text-sm font-semibold text-umak-blue'>
            <IonIcon icon={qrCodeOutline} className='text-lg' />
            <span>Join Code</span>
          </div>
          <p className='mt-3 text-2xl font-extrabold tracking-[0.2em] text-slate-900'>
            {isSessionLoading ? 'Loading...' : sessionStatus?.join_code ?? 'Unavailable'}
          </p>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Ask the student to open UMak-LINK, join the claim session, and
            generate the unique claim QR code for this item.
          </p>
        </div>

        {joinedClaimer ? (
          <div className='mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4'>
            <div className='flex items-center gap-3'>
              <IonAvatar className='h-14 w-14 shrink-0'>
                {joinedClaimer.profile_picture_url ? (
                  <img
                    src={joinedClaimer.profile_picture_url}
                    alt={joinedClaimer.user_name}
                    className='object-cover'
                  />
                ) : (
                  <div className='grid h-full w-full place-items-center bg-white text-emerald-600'>
                    <IonIcon icon={personCircle} className='text-4xl' />
                  </div>
                )}
              </IonAvatar>
              <div className='min-w-0 flex-1'>
                <p className='text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700'>
                  {isQrVerified ? 'QR Verified Student' : 'Joined Student'}
                </p>
                <p className='truncate text-base font-semibold text-slate-900'>
                  {joinedClaimer.user_name}
                </p>
                <p className='truncate text-sm text-slate-600'>
                  {joinedClaimer.email}
                </p>
              </div>
              <div className='rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700'>
                {isQrVerified ? 'Autofilled' : 'Waiting for scan'}
              </div>
            </div>
            {!isQrVerified ? (
              <p className='mt-3 text-sm leading-6 text-emerald-800/80'>
                The student joined this session. Scan the live QR to lock the
                claim to this student before submission.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
          <div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
            <IonIcon icon={cameraOutline} className='text-lg text-umak-blue' />
            <span>Camera Scanner</span>
          </div>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Point the camera at the student&apos;s unique claim QR to verify the
            live session.
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
                  Hold the student QR inside the frame until verification completes.
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
                ? 'If the camera cannot scan the code, use manual QR entry below.'
                : 'If this device cannot scan QR codes, use manual QR entry below.'}
            </p>
          </div>
        </div>

        <div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
          <div className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
            <IonIcon icon={shieldCheckmarkOutline} className='text-lg text-umak-blue' />
            <span>Manual QR Entry</span>
          </div>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            Use this only if the camera cannot scan the student&apos;s QR code.
          </p>

          <div className='mt-4 space-y-4'>
            <div>
              <label
                htmlFor='claim-qr-session-id'
                className='text-sm font-semibold text-slate-800'
              >
                Claim QR Session ID
              </label>
              <IonInput
                id='claim-qr-session-id'
                value={manualQrSessionId}
                fill='outline'
                placeholder='Paste the claim_qr_session_id'
                onIonInput={event =>
                  onManualQrSessionIdChange(String(event.detail.value ?? ''))
                }
              />
            </div>

            <div>
              <label
                htmlFor='claim-qr-session-token'
                className='text-sm font-semibold text-slate-800'
              >
                Session Token
              </label>
              <IonInput
                id='claim-qr-session-token'
                value={manualQrSessionToken}
                fill='outline'
                placeholder='Paste the session_token'
                onIonInput={event =>
                  onManualQrSessionTokenChange(String(event.detail.value ?? ''))
                }
              />
            </div>

            <IonButton
              expand='block'
              fill='outline'
              onClick={onVerifyManualEntry}
              disabled={
                isVerifying ||
                !manualQrSessionId.trim() ||
                !manualQrSessionToken.trim()
              }
              style={
                {
                  '--border-color': 'var(--color-umak-blue)',
                  '--color': 'var(--color-umak-blue)'
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
                  <IonIcon icon={checkmarkCircle} slot='start' />
                  Verify Student QR
                </>
              )}
            </IonButton>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  )
}
