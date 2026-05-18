import { useEffect, useState } from 'react'
import { IonIcon } from '@ionic/react'
import { qrCodeOutline, timerOutline } from 'ionicons/icons'
import UserCustodyQrCode from '@/features/user/custody/components/UserCustodyQrCode'
import { buildUserCustodyQrValue } from '@/features/user/custody/services/userCustodyService'
import type { UserCustodyQrCardProps } from '@/features/user/custody/types/user-custody'

function formatCountdown (remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function UserCustodyQrCard ({
  activeSession,
  sessionStatus
}: UserCustodyQrCardProps) {
  const [now, setNow] = useState(() => Date.now())
  const hasBeenScanned =
    sessionStatus?.scanned_at !== null && sessionStatus?.attempt_status === 'open'
  const isRetryAvailable = Boolean(
    sessionStatus?.current_window_expired &&
    sessionStatus.can_retry &&
    !sessionStatus.scanned_at
  )
  const shouldBlurQr = hasBeenScanned || isRetryAvailable
  const qrOverlayMessage = isRetryAvailable
    ? 'QR Expired. Click Get Fresh QR to get a new one.'
    : 'Guard scanned your QR. Waiting for acceptance or rejection.'
  const formattedManualEntryCode = activeSession.manualEntryCode.replace(
    /(.{3})(?=.)/g,
    '$1 '
  )
  const displayedManualEntryCode = hasBeenScanned
    ? '• • • • • •'
    : formattedManualEntryCode
  const expiresAtValue = sessionStatus?.expires_at ?? activeSession.expiresAt
  const expiresAtTimestamp = expiresAtValue ? Date.parse(expiresAtValue) : Number.NaN
  const createdAtTimestamp = activeSession.createdAt
    ? Date.parse(activeSession.createdAt)
    : Number.NaN
  const remainingMs = Number.isFinite(expiresAtTimestamp)
    ? Math.max(0, expiresAtTimestamp - now)
    : 0
  const displayedRemainingMs = isRetryAvailable ? 0 : remainingMs
  const totalWindowMs =
    Number.isFinite(expiresAtTimestamp) && Number.isFinite(createdAtTimestamp)
      ? Math.max(1, expiresAtTimestamp - createdAtTimestamp)
      : Math.max(displayedRemainingMs, 1)
  const countdownText = formatCountdown(displayedRemainingMs)
  const countdownProgress = Math.max(
    0,
    Math.min(100, (displayedRemainingMs / totalWindowMs) * 100)
  )
  const countdownNote = isRetryAvailable
    ? 'This QR expired. Click Get Fresh QR to continue the same handover session.'
    : hasBeenScanned
      ? 'The guard already scanned this QR. Stay on this screen while the handover decision is recorded.'
      : 'This countdown tracks the current QR window. If it reaches 00:00, get a fresh QR to keep the session going.'

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <div
      className='mt-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-[#1e2b87] to-[#25369f] p-5 text-white shadow-md'
      data-testid='user-custody-qr-card'
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-lg font-extrabold'>Live Handover QR</p>
          <p className='text-sm text-white/85'>
            This QR code stays live until the current handover window expires.
          </p>
        </div>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10'>
          <IonIcon icon={qrCodeOutline} className='text-2xl text-white' />
        </div>
      </div>

      <div
        className='mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3'
        data-testid='user-custody-countdown-card'
      >
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-white/70'>
              Time Remaining
            </p>
            <p
              className='mt-1.5 font-mono text-2xl font-bold tracking-[0.16em] text-white'
              data-testid='user-custody-countdown'
            >
              {countdownText}
            </p>
          </div>
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10'>
            <IonIcon icon={timerOutline} className='text-xl text-white' />
          </div>
        </div>

        <div className='mt-3 h-1.5 overflow-hidden rounded-full bg-white/10'>
          <div
            className='h-full rounded-full bg-white transition-[width] duration-1000'
            style={{ width: `${countdownProgress}%` }}
          />
        </div>

        <p
          className='mt-2 text-xs leading-5 text-white/75'
          data-testid='user-custody-countdown-note'
        >
          {countdownNote}
        </p>
      </div>

      <div className='mt-5 flex flex-col items-center gap-4'>
        <div className='relative'>
          <div className={shouldBlurQr ? 'blur-md transition' : 'transition'}>
            <UserCustodyQrCode value={buildUserCustodyQrValue(activeSession)} />
          </div>
          {shouldBlurQr && (
            <div
              className='absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/45 px-6 text-center text-sm font-semibold text-white'
              data-testid='user-custody-qr-overlay'
            >
              {qrOverlayMessage}
            </div>
          )}
        </div>

        <div className='w-full rounded-2xl bg-white/10 p-4 text-sm text-white/90'>
          <p className='font-semibold text-white'>
            Present this QR to the guard at {activeSession.guardPostName}.
          </p>
          <p className='mt-2'>
            The item stays with you until the guard accepts the handover in the
            app.
          </p>
        </div>

        <div
          className='w-full rounded-2xl border border-white/15 bg-slate-950/20 p-4'
          data-testid='user-custody-manual-entry-details'
        >
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-white/70'>
            Manual Guard Entry
          </p>
          <p className='mt-2 text-sm leading-6 text-white/85'>
            If the guard camera cannot scan this QR, ask the guard to type this
            code on the Guard Scan page.
          </p>

          <div className='relative mt-4 rounded-2xl bg-white/10 px-4 py-5 text-center'>
            <div className={isRetryAvailable ? 'blur-md transition' : 'transition'}>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-white/70'>
                Manual Entry Code
              </p>
              <p
                className='mt-3 font-mono text-3xl font-bold tracking-[0.35em] text-white'
                data-testid='user-custody-manual-entry-code'
              >
                {displayedManualEntryCode}
              </p>
              <p className='mt-3 text-xs leading-5 text-white/70'>
                {hasBeenScanned
                  ? 'Manual entry is locked after the guard scans the live QR.'
                  : isRetryAvailable
                    ? 'This manual code expired with the current QR window.'
                    : '6 characters only. The guard does not need the long session ID or token.'}
              </p>
            </div>
            {isRetryAvailable && (
              <div
                className='absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/45 px-6 text-center text-sm font-semibold text-white'
                data-testid='user-custody-manual-entry-overlay'
              >
                QR Expired. Click Get Fresh QR to get a new one.
              </div>
            )}
          </div>
        </div>

        <img
          alt='Uploaded handover evidence'
          className='h-36 w-36 rounded-2xl border border-white/20 object-cover'
          data-testid='user-custody-handover-image-preview'
          src={activeSession.handoverImageUrl}
        />
      </div>
    </div>
  )
}
