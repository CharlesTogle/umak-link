import UserCustodyQrCode from '@/features/user/custody/components/UserCustodyQrCode'
import { buildUserClaimQrValue } from '@/features/user/claim-verification/services/userClaimVerificationService'
import type { ClaimVerificationSessionStatusResponse } from '@/shared/lib/api-types'
import type { StoredUserClaimSession } from '@/features/user/claim-verification/types/user-claim-verification'

interface UserClaimQrCardProps {
  activeSession: StoredUserClaimSession
  sessionStatus: ClaimVerificationSessionStatusResponse | null
}

export default function UserClaimQrCard ({
  activeSession,
  sessionStatus
}: UserClaimQrCardProps) {
  const hasBeenScanned = sessionStatus?.status === 'scanned'
  const isCompleted = sessionStatus?.status === 'completed'

  return (
    <div className='mt-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-[#1e2b87] to-[#25369f] p-5 text-white shadow-md'>
      <div className='flex flex-col gap-1'>
        <p className='text-lg font-extrabold'>Unique Claim QR</p>
        <p className='text-sm text-white/85'>
          Present this QR to the guard or staff member handling the claim.
        </p>
      </div>

      <div className='mt-5 flex flex-col items-center gap-4'>
        <div className='relative'>
          <div
            className={
              hasBeenScanned || isCompleted ? 'blur-md transition' : 'transition'
            }
          >
            <UserCustodyQrCode value={buildUserClaimQrValue(activeSession)} />
          </div>
          {hasBeenScanned || isCompleted ? (
            <div className='absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/45 px-6 text-center text-sm font-semibold text-white'>
              {isCompleted
                ? 'Claim completed successfully.'
                : 'The processor scanned your QR. Wait while the claim is finalized.'}
            </div>
          ) : null}
        </div>

        <div className='w-full rounded-2xl bg-white/10 p-4 text-sm text-white/90'>
          <p className='font-semibold text-white'>
            Claiming: {activeSession.foundPost.item_name ?? 'Found item'}
          </p>
          <p className='mt-2'>
            Confirm the item details before presenting the QR to the processor.
          </p>
        </div>

        <div className='w-full rounded-2xl border border-white/15 bg-slate-950/20 p-4 text-sm text-white/85'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-white/70'>
            Manual Processor Entry
          </p>
          <p className='mt-2 leading-6'>
            If the processor camera cannot scan this QR, let them type these two
            values on the claim screen.
          </p>

          <div className='mt-4 grid gap-3'>
            <div className='rounded-2xl bg-white/10 px-4 py-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-white/70'>
                Claim QR Session ID
              </p>
              <p className='mt-2 break-all font-mono text-sm text-white'>
                {activeSession.claimQrSessionId}
              </p>
            </div>

            <div className='rounded-2xl bg-white/10 px-4 py-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-white/70'>
                Session Token
              </p>
              <p className='mt-2 break-all font-mono text-sm text-white'>
                {activeSession.sessionToken}
              </p>
            </div>
          </div>
        </div>

        <div className='w-full rounded-2xl border border-white/15 bg-slate-950/20 p-4 text-sm text-white/85'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-white/70'>
            Found Post Summary
          </p>
          <p className='mt-3 font-semibold text-white'>
            {activeSession.foundPost.item_name ?? 'Untitled item'}
          </p>
          <p className='mt-2 leading-6'>
            {activeSession.foundPost.item_description ?? 'No description provided.'}
          </p>
        </div>
      </div>
    </div>
  )
}
