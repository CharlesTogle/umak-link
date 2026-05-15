import { useState } from 'react'
import { IonContent, IonToast } from '@ionic/react'
import { HeaderWithBackButton } from '@/shared/components/HeaderVariants'
import { useNavigation } from '@/shared/hooks/useNavigation'
import UserClaimJoinCard from '@/features/user/claim-verification/components/UserClaimJoinCard'
import {
  clearActiveUserClaimSession,
  readActiveUserClaimSession,
  storeActiveUserClaimSession
} from '@/features/user/claim-verification/state/userClaimSessionStorage'
import {
  mapJoinResultToStoredSession
} from '@/features/user/claim-verification/services/userClaimVerificationService'
import { useJoinUserClaimSessionMutation } from '@/features/user/claim-verification/hooks/useUserClaimVerificationQueries'

export default function UserClaimJoinSession () {
  const { navigate } = useNavigation()
  const joinMutation = useJoinUserClaimSessionMutation()
  const [joinCode, setJoinCode] = useState('')
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    color: 'success' | 'warning' | 'danger'
  }>({
    show: false,
    message: '',
    color: 'success'
  })
  const activeSession = readActiveUserClaimSession()

  const handleJoin = async () => {
    const trimmedJoinCode = joinCode.trim()

    if (!trimmedJoinCode) {
      setToast({
        show: true,
        message: 'Enter the join code first.',
        color: 'warning'
      })
      return
    }

    try {
      const result = await joinMutation.mutateAsync(trimmedJoinCode)
      storeActiveUserClaimSession(mapJoinResultToStoredSession(result))
      navigate(
        `/user/claim/session/${result.claim_verification_session_id}`,
        'forward'
      )
    } catch (error) {
      setToast({
        show: true,
        message: error instanceof Error ? error.message : 'Failed to join the claim session.',
        color: 'danger'
      })
    }
  }

  return (
    <IonContent>
      <div className='fixed top-0 z-10 w-full'>
        <HeaderWithBackButton onBack={() => navigate('/user/history', 'back')} />
      </div>

      <div className='mb-5 mt-16 bg-gray-50 font-default-font'>
        <div className='space-y-4 px-4 pt-3'>
          <UserClaimJoinCard
            hasActiveSession={Boolean(activeSession)}
            isJoining={joinMutation.isPending}
            joinCode={joinCode}
            onJoin={() => void handleJoin()}
            onJoinCodeChange={setJoinCode}
            onResume={
              activeSession
                ? () =>
                    navigate(
                      `/user/claim/session/${activeSession.claimVerificationSessionId}`,
                      'forward'
                    )
                : undefined
            }
          />

          {activeSession ? (
            <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
              <p className='text-sm font-semibold text-umak-blue'>Active Session</p>
              <p className='mt-3 text-base font-semibold text-slate-900'>
                {activeSession.foundPost.item_name ?? 'Found item'}
              </p>
              <p className='mt-2 text-sm text-slate-600'>
                Join code: {activeSession.joinCode}
              </p>
              <button
                type='button'
                onClick={() => {
                  clearActiveUserClaimSession()
                  setToast({
                    show: true,
                    message: 'Saved claim session cleared.',
                    color: 'success'
                  })
                }}
                className='mt-4 text-sm font-medium text-rose-600'
              >
                Clear saved session
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <IonToast
        color={toast.color}
        duration={2200}
        isOpen={toast.show}
        message={toast.message}
        onDidDismiss={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </IonContent>
  )
}
