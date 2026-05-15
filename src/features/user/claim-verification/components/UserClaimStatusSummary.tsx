import type { CSSProperties } from 'react'
import { IonButton, IonSpinner } from '@ionic/react'
import type {
  ClaimVerificationSessionStatusResponse
} from '@/shared/lib/api-types'
import type { StoredUserClaimSession } from '@/features/user/claim-verification/types/user-claim-verification'

interface UserClaimStatusSummaryProps {
  activeSession: StoredUserClaimSession
  sessionStatus: ClaimVerificationSessionStatusResponse | null
  onCancel: () => void
  onRetry: () => void
  isCancelling: boolean
  isRetrying: boolean
}

function formatDateTime (value: string | null | undefined): string {
  if (!value) return 'Not available'

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function getStatusMessage (
  sessionStatus: ClaimVerificationSessionStatusResponse | null
): string {
  if (!sessionStatus) return 'Preparing the live claim session.'
  if (sessionStatus.status === 'completed') {
    return 'The staff or guard completed the claim. You can close this session now.'
  }
  if (sessionStatus.status === 'cancelled') {
    return 'The live claim session was cancelled.'
  }
  if (sessionStatus.current_window_expired && sessionStatus.can_retry) {
    return 'This QR window expired. Generate a fresh QR to continue the same claim session.'
  }
  if (sessionStatus.status === 'scanned') {
    return 'The processor scanned your QR. Wait while the claim is finalized.'
  }
  return 'Present this QR to the processor while the session stays active.'
}

export default function UserClaimStatusSummary ({
  activeSession,
  sessionStatus,
  onCancel,
  onRetry,
  isCancelling,
  isRetrying
}: UserClaimStatusSummaryProps) {
  const canRetry = Boolean(sessionStatus?.current_window_expired && sessionStatus.can_retry)
  const canCancel =
    sessionStatus?.status === 'qr_active' || sessionStatus?.status === 'awaiting_claimer'

  return (
    <div className='mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-lg font-extrabold text-umak-blue'>Session Status</p>
        <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600'>
          {sessionStatus?.status ?? activeSession.status}
        </span>
      </div>

      <p className='mt-3 text-sm leading-relaxed text-slate-700'>
        {getStatusMessage(sessionStatus)}
      </p>

      <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <div className='rounded-xl bg-slate-50 p-3'>
          <p className='text-xs uppercase tracking-[0.16em] text-slate-500'>
            Join Code
          </p>
          <p className='mt-2 text-sm font-semibold text-slate-900'>
            {activeSession.joinCode}
          </p>
        </div>
        <div className='rounded-xl bg-slate-50 p-3'>
          <p className='text-xs uppercase tracking-[0.16em] text-slate-500'>
            QR Window
          </p>
          <p className='mt-2 text-sm font-semibold text-slate-900'>
            {sessionStatus?.number_of_attempts ?? activeSession.numberOfAttempts}
            {' / '}
            {sessionStatus?.max_number_of_attempts ?? activeSession.maxNumberOfAttempts}
          </p>
        </div>
        <div className='rounded-xl bg-slate-50 p-3'>
          <p className='text-xs uppercase tracking-[0.16em] text-slate-500'>
            Current Expiry
          </p>
          <p className='mt-2 text-sm font-semibold text-slate-900'>
            {formatDateTime(sessionStatus?.expires_at ?? activeSession.expiresAt)}
          </p>
        </div>
      </div>

      <div className='mt-5 flex flex-wrap justify-end gap-3'>
        {canRetry ? (
          <IonButton
            disabled={isRetrying}
            onClick={onRetry}
            style={
              {
                '--background': 'var(--color-umak-blue)'
              } as CSSProperties
            }
          >
            {isRetrying ? <IonSpinner name='crescent' /> : 'Generate Fresh QR'}
          </IonButton>
        ) : null}
        {canCancel ? (
          <IonButton
            color='danger'
            disabled={isCancelling}
            onClick={onCancel}
          >
            {isCancelling ? <IonSpinner name='crescent' /> : 'Cancel'}
          </IonButton>
        ) : null}
      </div>
    </div>
  )
}
