import type { CSSProperties } from 'react'
import { IonButton, IonSpinner } from '@ionic/react'
import type { UserCustodyStatusSummaryProps } from '@/features/user/custody/types/user-custody'

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
  sessionStatus: UserCustodyStatusSummaryProps['sessionStatus']
): string {
  if (!sessionStatus) return 'Preparing live session details.'
  const canRetry = Boolean(
    sessionStatus.current_window_expired &&
    sessionStatus.can_retry &&
    !sessionStatus.scanned_at
  )
  if (sessionStatus.attempt_status === 'accepted') {
    return 'The guard accepted the handover. Give the item to the guard now.'
  }
  if (sessionStatus.attempt_status === 'rejected') {
    return 'The guard rejected the handover. Try again later or choose a different guard post.'
  }
  if (sessionStatus.attempt_status === 'timed_out') {
    return 'The handover session timed out. Start a new handover session if you still need to continue.'
  }
  if (canRetry) {
    return 'The current QR window expired. Generate a fresh QR to continue the same session.'
  }
  if (sessionStatus.scanned_at) {
    return 'The guard scanned your QR. Wait for the decision while polling continues.'
  }

  return 'Waiting for the guard to scan and decide on this handover.'
}

export default function UserCustodyStatusSummary ({
  activeSession,
  sessionStatus,
  onCancel,
  onRetry,
  isCancelling,
  isRetrying
}: UserCustodyStatusSummaryProps) {
  const canRetry = Boolean(
    sessionStatus?.current_window_expired &&
    sessionStatus.can_retry &&
    !sessionStatus.scanned_at
  )
  const canCancel = sessionStatus?.attempt_status === 'open'

  return (
    <div
      className='mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md'
      data-testid='user-custody-status-summary'
    >
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-lg font-extrabold text-umak-blue'>Session Status</p>
        <span
          className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600'
          data-testid='user-custody-attempt-status'
        >
          {sessionStatus?.attempt_status ?? activeSession?.attemptStatus ?? 'open'}
        </span>
      </div>

      <p
        className='mt-3 text-sm leading-relaxed text-slate-700'
        data-testid='user-custody-status-message'
      >
        {getStatusMessage(sessionStatus)}
      </p>

      <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <div className='rounded-xl bg-slate-50 p-3'>
          <p className='text-xs uppercase tracking-[0.16em] text-slate-500'>
            Guard Post
          </p>
          <p className='mt-2 text-sm font-semibold text-slate-900'>
            {activeSession?.guardPostName ?? 'Not selected'}
          </p>
        </div>
        <div className='rounded-xl bg-slate-50 p-3'>
          <p className='text-xs uppercase tracking-[0.16em] text-slate-500'>
            Attempt Window
          </p>
          <p
            className='mt-2 text-sm font-semibold text-slate-900'
            data-testid='user-custody-attempt-counter'
          >
            {sessionStatus?.number_of_attempts ?? activeSession?.numberOfAttempts ?? 0}
            {' / '}
            {sessionStatus?.max_number_of_attempts ?? activeSession?.maxNumberOfAttempts ?? 0}
          </p>
        </div>
        <div className='rounded-xl bg-slate-50 p-3'>
          <p className='text-xs uppercase tracking-[0.16em] text-slate-500'>
            Current Expiry
          </p>
          <p className='mt-2 text-sm font-semibold text-slate-900'>
            {formatDateTime(sessionStatus?.expires_at ?? activeSession?.expiresAt)}
          </p>
        </div>
      </div>

      <div className='mt-5 flex flex-wrap justify-end gap-3'>
        {canRetry && (
          <IonButton
            data-testid='user-custody-retry'
            disabled={isRetrying}
            onClick={onRetry}
            style={
              {
                '--background': 'var(--color-umak-blue)'
              } as CSSProperties
            }
          >
            {isRetrying ? <IonSpinner name='crescent' /> : 'Get Fresh QR'}
          </IonButton>
        )}
        {canCancel && (
          <IonButton
            color='danger'
            data-testid='user-custody-cancel'
            disabled={isCancelling}
            onClick={onCancel}
          >
            {isCancelling ? <IonSpinner name='crescent' /> : 'Cancel'}
          </IonButton>
        )}
      </div>
    </div>
  )
}
