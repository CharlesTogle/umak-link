import { useState } from 'react'
import { IonContent, IonToast } from '@ionic/react'
import { useParams } from 'react-router-dom'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { HeaderWithButtons } from '@/shared/components/HeaderVariants'
import { useNavigation } from '@/shared/hooks/useNavigation'
import UserClaimQrCard from '@/features/user/claim-verification/components/UserClaimQrCard'
import UserClaimStatusSummary from '@/features/user/claim-verification/components/UserClaimStatusSummary'
import { useUserClaimSessionFlow } from '@/features/user/claim-verification/hooks/useUserClaimSessionFlow'
import type { UserClaimRouteParams } from '@/features/user/claim-verification/types/user-claim-verification'

export default function UserClaimQrSession () {
  const { claimVerificationSessionId } = useParams<UserClaimRouteParams>()
  const { navigate } = useNavigation()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    color: 'success' | 'danger'
  }>({
    show: false,
    message: '',
    color: 'success'
  })

  const {
    activeSession,
    cancelMutation,
    handleCancel,
    handleRetry,
    retryMutation,
    sessionStatusQuery
  } = useUserClaimSessionFlow(claimVerificationSessionId ?? '')

  if (!claimVerificationSessionId) {
    return (
      <IonContent>
        <div className='fixed top-0 z-10 w-full'>
          <HeaderWithButtons loading={false} onCancel={() => navigate('/user/claim/join', 'back')} withSubmit={false} />
        </div>
        <div className='mt-20 px-4'>
          <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
            <p className='text-lg font-extrabold text-umak-blue'>Session not found</p>
          </div>
        </div>
      </IonContent>
    )
  }

  if (!activeSession) {
    return (
      <IonContent>
        <div className='fixed top-0 z-10 w-full'>
          <HeaderWithButtons loading={false} onCancel={() => navigate('/user/claim/join', 'back')} withSubmit={false} />
        </div>
        <div className='mt-20 px-4'>
          <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
            <p className='text-lg font-extrabold text-umak-blue'>No active claim session</p>
            <p className='mt-3 text-sm text-slate-700'>
              Rejoin the claim session from the join page if the processor is waiting for you.
            </p>
          </div>
        </div>
      </IonContent>
    )
  }

  return (
    <IonContent>
      <div className='fixed top-0 z-10 w-full'>
        <HeaderWithButtons
          loading={false}
          onCancel={() => navigate('/user/claim/join', 'back')}
          withSubmit={false}
        />
      </div>

      <div className='mb-5 mt-16 bg-gray-50 font-default-font'>
        <div className='px-4 pt-3'>
          <UserClaimQrCard
            activeSession={activeSession}
            sessionStatus={sessionStatusQuery.data ?? null}
          />
          <UserClaimStatusSummary
            activeSession={activeSession}
            sessionStatus={sessionStatusQuery.data ?? null}
            onCancel={() => setShowCancelModal(true)}
            onRetry={async () => {
              try {
                await handleRetry()
                setToast({
                  show: true,
                  message: 'A fresh QR is now active for this claim session.',
                  color: 'success'
                })
              } catch (error) {
                setToast({
                  show: true,
                  message: error instanceof Error ? error.message : 'Failed to refresh the QR.',
                  color: 'danger'
                })
              }
            }}
            isCancelling={cancelMutation.isPending}
            isRetrying={retryMutation.isPending}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={showCancelModal}
        heading='Cancel claim session?'
        subheading='This closes the live claim QR and releases the processor session.'
        submitLabel='Cancel Session'
        onCancel={() => setShowCancelModal(false)}
        onSubmit={async () => {
          try {
            await handleCancel()
          } catch (error) {
            setToast({
              show: true,
              message: error instanceof Error ? error.message : 'Failed to cancel the claim session.',
              color: 'danger'
            })
          } finally {
            setShowCancelModal(false)
          }
        }}
      />

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
