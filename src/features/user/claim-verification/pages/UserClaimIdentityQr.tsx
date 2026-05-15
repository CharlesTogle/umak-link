import { useEffect, useMemo, useRef, useState } from 'react'
import { IonContent, IonIcon } from '@ionic/react'
import { qrCodeOutline, timerOutline } from 'ionicons/icons'
import { useHistory } from 'react-router-dom'
import { HeaderWithBackButton } from '@/shared/components/HeaderVariants'
import { useUser } from '@/features/auth/contexts/UserContext'
import UserCustodyQrCode from '@/features/user/custody/components/UserCustodyQrCode'
import { buildStaffClaimUserQrValue } from '@/features/user/claim-verification/services/userClaimVerificationService'
import { useUserClaimManualEntryCodeQuery } from '@/features/user/claim-verification/hooks/useUserClaimVerificationQueries'
import {
  formatClaimCodeForDisplay
} from '@/shared/utils/claimCode'

const USER_CLAIM_QR_TTL_MS = 5 * 60 * 1000

function formatCountdown (remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function UserClaimIdentityQr () {
  const history = useHistory()
  const { user, getUser, loading } = useUser()
  const [resolvedUser, setResolvedUser] = useState(user)
  const [now, setNow] = useState(() => Date.now())
  const refreshRequestExpiresAtRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (user) {
      setResolvedUser(user)
      return
    }

    void getUser().then(currentUser => {
      if (isMounted) {
        setResolvedUser(currentUser)
      }
    })

    return () => {
      isMounted = false
    }
  }, [getUser, user])

  const claimCodeQuery = useUserClaimManualEntryCodeQuery(Boolean(resolvedUser))
  const {
    data: claimCodeQueryData,
    error: claimCodeError,
    isFetching: isClaimCodeFetching,
    refetch: refetchClaimCode
  } = claimCodeQuery
  const claimCodeState = claimCodeQueryData ?? null
  const expiresAtTimestamp = claimCodeState?.expiresAt
    ? Date.parse(claimCodeState.expiresAt)
    : Number.NaN
  const hasActiveClaimCode =
    claimCodeState !== null &&
    Number.isFinite(expiresAtTimestamp) &&
    expiresAtTimestamp > now
  const remainingMs = hasActiveClaimCode
    ? Math.max(0, expiresAtTimestamp - now)
    : 0
  const countdownText = formatCountdown(remainingMs)
  const countdownProgress = Math.max(
    0,
    Math.min(100, (remainingMs / USER_CLAIM_QR_TTL_MS) * 100)
  )
  const isRefreshingExpiredCode = claimCodeState !== null && !hasActiveClaimCode

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!claimCodeState?.expiresAt) {
      refreshRequestExpiresAtRef.current = null
      return
    }

    if (hasActiveClaimCode) {
      refreshRequestExpiresAtRef.current = null
      return
    }

    if (
      isClaimCodeFetching ||
      refreshRequestExpiresAtRef.current === claimCodeState.expiresAt
    ) {
      return
    }

    refreshRequestExpiresAtRef.current = claimCodeState.expiresAt
    void refetchClaimCode()
  }, [
    isClaimCodeFetching,
    claimCodeState?.expiresAt,
    hasActiveClaimCode,
    refetchClaimCode
  ])

  const qrValue = useMemo(() => {
    if (!claimCodeState || !hasActiveClaimCode) {
      return null
    }

    return buildStaffClaimUserQrValue({
      manualEntryCode: claimCodeState.manualEntryCode
    })
  }, [claimCodeState, hasActiveClaimCode])
  const claimCode = hasActiveClaimCode ? claimCodeState?.manualEntryCode ?? null : null

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack()
      return
    }

    history.push('/user/history')
  }

  return (
    <IonContent>
      <div className='fixed top-0 z-10 w-full'>
        <HeaderWithBackButton onBack={handleBack} />
      </div>

      <div className='mb-5 mt-16 bg-gray-50 font-default-font'>
        <div className='space-y-4 px-4 pt-3'>
          <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
            <div className='flex items-center gap-3'>
              <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1e2b87]/10 text-umak-blue'>
                <IonIcon icon={qrCodeOutline} className='text-2xl' />
              </div>
              <div>
                <p className='text-lg font-extrabold text-umak-blue'>Claim QR</p>
                <p className='text-sm text-slate-500'>Student verification</p>
              </div>
            </div>
            <p className='mt-3 text-sm leading-relaxed text-slate-700'>
              Present this QR to the guard or staff member handling your claim.
              They will scan it to fill in your claimer details.
            </p>
          </div>

          {!loading && !resolvedUser ? (
            <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
              <p className='text-lg font-extrabold text-umak-blue'>
                Unable to load your claim QR
              </p>
              <p className='mt-3 text-sm leading-relaxed text-slate-700'>
                Refresh this page after your account finishes loading.
              </p>
            </div>
          ) : null}

          {resolvedUser && claimCodeError instanceof Error ? (
            <div className='rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-md'>
              <p className='text-lg font-extrabold text-rose-700'>
                Unable to prepare your claim QR
              </p>
              <p className='mt-3 text-sm leading-relaxed text-rose-700/80'>
                {claimCodeError.message}
              </p>
            </div>
          ) : null}

          {resolvedUser ? (
            <div className='rounded-2xl border border-slate-200 bg-gradient-to-b from-[#1e2b87] to-[#25369f] p-5 text-white shadow-md'>
              <div className='flex items-start justify-between gap-4'>
              <div className='flex flex-col gap-1'>
                  <p className='text-lg font-extrabold'>Student Claim QR</p>
                  <p className='text-sm text-white/85'>
                    Keep this screen open while the guard or staff member scans
                    your QR.
                  </p>
                </div>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10'>
                  <IonIcon icon={qrCodeOutline} className='text-2xl text-white' />
                </div>
              </div>

              <div className='mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-white/70'>
                      Time Remaining
                    </p>
                    <p className='mt-1.5 font-mono text-2xl font-bold tracking-[0.16em] text-white'>
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

                <p className='mt-2 text-xs leading-5 text-white/75'>
                  {isRefreshingExpiredCode
                    ? 'This QR expired. UMak-LINK is generating a fresh QR and claim code now.'
                    : 'This QR and its 6-character claim code refresh automatically every 5 minutes.'}
                </p>
              </div>

              <div className='mt-5 flex flex-col items-center gap-4'>
                {qrValue ? (
                  <UserCustodyQrCode
                    alt='Student claim QR code'
                    value={qrValue}
                  />
                ) : (
                  <div className='flex h-[272px] w-full max-w-[272px] items-center justify-center rounded-[28px] bg-white/10 px-6 text-center text-sm font-semibold text-white/85'>
                    {isRefreshingExpiredCode
                      ? 'Refreshing your claim QR...'
                      : 'Preparing your claim QR...'}
                  </div>
                )}

                <div className='w-full rounded-2xl bg-white/10 p-4 text-sm text-white/90'>
                  <p className='text-xs font-semibold uppercase tracking-[0.18em] text-white/70'>
                    Claimer Details
                  </p>
                  <p className='mt-3 text-base font-semibold text-white'>
                    {resolvedUser.user_name}
                  </p>
                  <p className='mt-2 break-all'>{resolvedUser.email}</p>
                </div>

                <div className='w-full rounded-2xl border border-white/15 bg-slate-950/20 p-4 text-sm text-white/85'>
                  <p className='text-xs font-semibold uppercase tracking-[0.18em] text-white/70'>
                    Manual Guard or Staff Entry
                  </p>
                  <p className='mt-2 leading-6'>
                    If the guard or staff member cannot scan the QR, ask them
                    to type this 6-character claim code.
                  </p>
                  <div className='mt-4 rounded-2xl bg-white/10 px-4 py-5 text-center'>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-white/70'>
                      Claim Code
                    </p>
                    <p className='mt-3 font-mono text-3xl font-bold tracking-[0.35em] text-white'>
                      {claimCode
                        ? formatClaimCodeForDisplay(claimCode)
                        : '••• •••'}
                    </p>
                    <p className='mt-3 text-xs leading-5 text-white/70'>
                      {isRefreshingExpiredCode
                        ? 'Refreshing the claim code to keep old screenshots from being reused.'
                        : 'The manual code refreshes together with the QR every 5 minutes.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
              <p className='text-sm text-slate-600'>Preparing your claim QR...</p>
            </div>
          )}
        </div>
      </div>
    </IonContent>
  )
}
