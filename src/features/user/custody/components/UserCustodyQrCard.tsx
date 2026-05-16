import { IonIcon } from '@ionic/react'
import { qrCodeOutline } from 'ionicons/icons'
import UserCustodyQrCode from '@/features/user/custody/components/UserCustodyQrCode'
import { buildUserCustodyQrValue } from '@/features/user/custody/services/userCustodyService'
import type { UserCustodyQrCardProps } from '@/features/user/custody/types/user-custody'

export default function UserCustodyQrCard ({
  activeSession,
  sessionStatus
}: UserCustodyQrCardProps) {
  const hasBeenScanned =
    sessionStatus?.scanned_at !== null && sessionStatus?.attempt_status === 'open'
  const formattedManualEntryCode = activeSession.manualEntryCode.replace(
    /(.{3})(?=.)/g,
    '$1 '
  )
  const displayedManualEntryCode = hasBeenScanned
    ? '• • • • • •'
    : formattedManualEntryCode

  return (
    <div
      className='mt-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-[#1e2b87] to-[#25369f] p-5 text-white shadow-md'
      data-testid='user-custody-qr-card'
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-lg font-extrabold'>Live Handover QR</p>
          <p className='text-sm text-white/85'>
            This QR code is valid for the whole session.
          </p>
        </div>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10'>
          <IonIcon icon={qrCodeOutline} className='text-2xl text-white' />
        </div>
      </div>

      <div className='mt-5 flex flex-col items-center gap-4'>
        <div className='relative'>
          <div className={hasBeenScanned ? 'blur-md transition' : 'transition'}>
            <UserCustodyQrCode value={buildUserCustodyQrValue(activeSession)} />
          </div>
          {hasBeenScanned && (
            <div
              className='absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/45 px-6 text-center text-sm font-semibold text-white'
              data-testid='user-custody-qr-overlay'
            >
              Guard scanned your QR. Waiting for acceptance or rejection.
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

          <div className='mt-4 rounded-2xl bg-white/10 px-4 py-5 text-center'>
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
                : '6 characters only. The guard does not need the long session ID or token.'}
            </p>
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
