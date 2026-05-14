import { IonButton, IonSpinner, IonTextarea } from '@ionic/react'
import GuardSurfaceCard from '@/features/guard/components/GuardSurfaceCard'
import type { GuardDecisionCardProps } from '@/features/guard/types/guard-custody'

export default function GuardDecisionCard ({
  decisionReason,
  isSubmitting,
  onDecisionReasonChange,
  onAccept,
  onReject
}: GuardDecisionCardProps) {
  return (
    <GuardSurfaceCard
      title='Decision'
      subtitle='Record your decision for this custody attempt. Rejection keeps the item with the student.'
      testId='guard-decision-card'
    >
      <div className='space-y-4'>
        <div className='space-y-2'>
          <label
            htmlFor='guard-decision-reason'
            className='text-sm font-semibold text-slate-800'
          >
            Optional reason
          </label>
          <IonTextarea
            id='guard-decision-reason'
            fill='outline'
            value={decisionReason}
            rows={4}
            autoGrow={true}
            placeholder='Add a note for the audit trail if needed.'
            onIonInput={event =>
              onDecisionReasonChange(String(event.detail.value ?? ''))
            }
            data-testid='guard-decision-reason'
          />
        </div>

        <div className='space-y-3'>
          <IonButton
            color='success'
            expand='block'
            disabled={isSubmitting}
            onClick={onAccept}
            data-testid='guard-accept-button'
          >
            {isSubmitting ? (
              <>
                <IonSpinner name='crescent' className='mr-2 h-4 w-4' />
                Saving
              </>
            ) : (
              'Accept Handover'
            )}
          </IonButton>

          <IonButton
            color='danger'
            fill='outline'
            expand='block'
            disabled={isSubmitting}
            onClick={onReject}
            data-testid='guard-reject-button'
          >
            Reject Handover
          </IonButton>
        </div>
      </div>
    </GuardSurfaceCard>
  )
}
