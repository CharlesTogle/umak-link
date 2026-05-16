import { IonContent, IonPage, IonToast } from '@ionic/react'
import { useReducer, useState } from 'react'
import { useParams } from 'react-router-dom'
import { documentTextOutline } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import { useNavigation } from '@/shared/hooks/useNavigation'
import GuardDecisionCard from '@/features/guard/components/GuardDecisionCard'
import GuardPageSectionHeader from '@/features/guard/components/GuardPageSectionHeader'
import GuardReviewMissingState from '@/features/guard/components/GuardReviewMissingState'
import GuardReviewSummaryCard from '@/features/guard/components/GuardReviewSummaryCard'
import GuardStatusBanner from '@/features/guard/components/GuardStatusBanner'
import { useGuardDecisionMutation } from '@/features/guard/hooks/useGuardCustodyMutations'
import {
  clearActiveGuardScanSession,
  readActiveGuardScanSession,
  storeLastGuardDecision
} from '@/features/guard/state/guardSessionStorage'
import {
  guardReviewReducer,
  initialGuardReviewState
} from '@/features/guard/state/guardReviewState'
import type {
  GuardDecisionRequest,
  GuardRouteParams,
  StoredGuardScanSession
} from '@/features/guard/types/guard-custody'

function findStoredSession (
  custodyAttemptId: string
): StoredGuardScanSession | null {
  const storedSession = readActiveGuardScanSession()
  if (!storedSession) return null

  return storedSession.scan.custody_attempt_id === custodyAttemptId
    ? storedSession
    : null
}

export default function GuardReview () {
  const { custodyAttemptId } = useParams<GuardRouteParams>()
  const { navigate } = useNavigation()
  const [state, dispatch] = useReducer(guardReviewReducer, initialGuardReviewState)
  const [pendingDecision, setPendingDecision] = useState<GuardDecisionRequest['decision'] | null>(null)
  const storedSession = findStoredSession(custodyAttemptId)
  const guardDecisionMutation = useGuardDecisionMutation(custodyAttemptId)

  if (!storedSession) {
    return (
      <IonPage data-testid='guard-review-page-missing'>
        <Header logoShown={true} isProfileAndNotificationShown={true} />
        <IonContent fullscreen className='bg-gray-50'>
          <GuardPageSectionHeader
            title='Review Handover'
            subtitle='Open a saved scan review before making a guard decision.'
            icon={documentTextOutline}
            testId='guard-review-section-header'
          />
          <div className='min-h-full bg-gray-50 px-4 pb-24 pt-4'>
            <GuardReviewMissingState
              onOpenScan={() => navigate('/guard/scan')}
              onReturnHome={() => navigate('/guard/home')}
            />
          </div>
        </IonContent>
      </IonPage>
    )
  }

  const { scan } = storedSession

  const handleDecision = async (
    decision: GuardDecisionRequest['decision']
  ) => {
    setPendingDecision(decision)

    try {
      const payload: GuardDecisionRequest = {
        qr_code_session_id: scan.qr_code_session_id,
        decision,
        ...(state.decisionReason.trim()
          ? { decision_reason: state.decisionReason.trim() }
          : {})
      }
      const response = await guardDecisionMutation.mutateAsync(payload)

      clearActiveGuardScanSession()
      storeLastGuardDecision({
        post_id: scan.post_id,
        custody_attempt_id: response.custody_attempt_id,
        qr_code_session_id: response.qr_code_session_id,
        attempt_status: response.attempt_status,
        decision_at: response.decision_at,
        item_name: scan.item_name,
        guard_post_name: scan.guard_post_name
      })

      dispatch({
        type: 'toastShown',
        message: decision === 'accepted'
          ? 'Handover accepted successfully.'
          : 'Handover rejected successfully.',
        color: 'success'
      })
      navigate('/guard/home')
    } catch (error) {
      dispatch({
        type: 'toastShown',
        message: error instanceof Error
          ? error.message
          : 'Unable to save the guard decision.',
        color: 'danger'
      })
      setPendingDecision(null)
    }
  }

  return (
    <IonPage data-testid='guard-review-page'>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <IonContent fullscreen className='bg-gray-50'>
        <GuardPageSectionHeader
          title='Review Handover'
          subtitle='Check the student handover details before accepting or rejecting.'
          icon={documentTextOutline}
          testId='guard-review-section-header'
        />
        <div className='min-h-full bg-gray-50 px-4 pb-24 pt-4'>
          <div className='flex flex-col gap-4'>
            <GuardStatusBanner
              tone='warning'
              title='Review before acting'
              description='Verify that the item, the selected post, and the handover image match the physical handover before you accept custody.'
              testId='guard-review-banner'
            />
            <GuardReviewSummaryCard scan={scan} />
            <GuardDecisionCard
              decisionReason={state.decisionReason}
              isSubmitting={guardDecisionMutation.isPending}
              pendingDecision={pendingDecision}
              onDecisionReasonChange={value =>
                dispatch({
                  type: 'decisionReasonChanged',
                  value
                })
              }
              onAccept={() => {
                void handleDecision('accepted')
              }}
              onReject={() => {
                void handleDecision('rejected')
              }}
            />
          </div>
        </div>
      </IonContent>
      <IonToast
        isOpen={state.toast.isOpen}
        onDidDismiss={() => dispatch({ type: 'toastDismissed' })}
        message={state.toast.message}
        duration={3000}
        position='top'
        color={state.toast.color}
      />
    </IonPage>
  )
}
