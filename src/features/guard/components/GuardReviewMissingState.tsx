import { IonButton } from '@ionic/react'
import GuardSurfaceCard from '@/features/guard/components/GuardSurfaceCard'
import type { GuardReviewMissingStateProps } from '@/features/guard/types/guard-custody'

export default function GuardReviewMissingState ({
  onOpenScan,
  onReturnHome
}: GuardReviewMissingStateProps) {
  return (
    <GuardSurfaceCard
      title='No Saved Review Found'
      subtitle='Open the scan screen and load a handover review before trying to access this page.'
      testId='guard-review-missing-state'
    >
      <div className='space-y-3'>
        <IonButton
          expand='block'
          onClick={onOpenScan}
          data-testid='guard-review-open-scan'
        >
          Go to Scan Screen
        </IonButton>
        <IonButton
          fill='outline'
          expand='block'
          onClick={onReturnHome}
          data-testid='guard-review-back-home'
        >
          Return Home
        </IonButton>
      </div>
    </GuardSurfaceCard>
  )
}
