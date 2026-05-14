import UserCustodyQrCode from '@/features/user/custody/components/UserCustodyQrCode'
import { buildUserCustodyQrValue } from '@/features/user/custody/services/userCustodyService'
import type { UserCustodyQrCardProps } from '@/features/user/custody/types/user-custody'

export default function UserCustodyQrCard ({
  activeSession,
  sessionStatus
}: UserCustodyQrCardProps) {
  const hasBeenScanned =
    sessionStatus?.scanned_at !== null && sessionStatus?.attempt_status === 'open'

  return (
    <div
      className='mt-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-[#1e2b87] to-[#25369f] p-5 text-white shadow-md'
      data-testid='user-custody-qr-card'
    >
      <div className='flex flex-col gap-1'>
        <p className='text-lg font-extrabold'>Live Handover QR</p>
        <p className='text-sm text-white/85'>
          This QR code is valid for the whole session.
        </p>
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
