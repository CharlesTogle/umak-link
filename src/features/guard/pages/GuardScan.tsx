import { IonButton, IonContent, IonPage, IonToast } from '@ionic/react'
import { useState } from 'react'
import { qrCodeOutline } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import { useNavigation } from '@/shared/hooks/useNavigation'
import GuardManualEntryForm from '@/features/guard/components/GuardManualEntryForm'
import GuardPageSectionHeader from '@/features/guard/components/GuardPageSectionHeader'
import { useGuardScanMutation } from '@/features/guard/hooks/useGuardCustodyMutations'
import GuardCameraScannerCard from '@/features/guard/components/GuardCameraScannerCard'
import GuardSurfaceCard from '@/features/guard/components/GuardSurfaceCard'
import {
  clearActiveGuardScanSession,
  readActiveGuardScanSession,
  storeActiveGuardScanSession
} from '@/features/guard/state/guardSessionStorage'
import type { GuardScanPayload } from '@/features/guard/types/guard-custody'

export default function GuardScan () {
  const { navigate } = useNavigation()
  const [toastMessage, setToastMessage] = useState('')
  const [toastColor, setToastColor] = useState<'danger' | 'success'>('danger')
  const [showToast, setShowToast] = useState(false)
  const activeSession = readActiveGuardScanSession()
  const guardScanMutation = useGuardScanMutation()

  const openToast = (
    message: string,
    color: 'danger' | 'success' = 'danger'
  ) => {
    setToastColor(color)
    setToastMessage(message)
    setShowToast(true)
  }

  const loadReview = async (payload: GuardScanPayload) => {
    const scan = await guardScanMutation.mutateAsync(payload)
    storeActiveGuardScanSession(scan)
    navigate(`/guard/scan/review/${scan.custody_attempt_id}`)
  }

  const handleLoadReview = async (payload: GuardScanPayload) => {
    try {
      await loadReview(payload)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load the custody review.'
      openToast(message)
    }
  }

  const handleClearSavedSession = () => {
    clearActiveGuardScanSession()
    openToast('Saved guard review cleared.', 'success')
  }

  return (
    <IonPage data-testid='guard-scan-page'>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <IonContent fullscreen className='bg-gray-50'>
        <GuardPageSectionHeader
          title='Scan Handover'
          subtitle='Scan the student QR or use manual entry to open the review.'
          icon={qrCodeOutline}
          testId='guard-scan-section-header'
        />
        <div className='min-h-full bg-gray-50 px-4 pb-24 pt-4'>
          <div className='flex flex-col gap-4'>
            <GuardSurfaceCard
              title='Before You Scan'
              subtitle='Keep the item with the student until you accept the handover in the app.'
              testId='guard-scan-overview'
            >
              <div className='space-y-3 text-sm text-slate-700'>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-6'>
                  Ask the student to show the custody QR on their phone. Scan it here to open the handover review.
                </div>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-6'>
                  Check the item and the handover photo first. Only take the item after you record an accepted decision.
                </div>
              </div>
            </GuardSurfaceCard>

            {activeSession ? (
              <GuardSurfaceCard
                title='Saved Review'
                subtitle='A guard review is already stored on this device.'
                testId='guard-saved-review-card'
              >
                <div className='space-y-3 text-sm text-slate-700'>
                  <p data-testid='guard-saved-review-item'>
                    <span className='font-semibold text-slate-900'>Item:</span>{' '}
                    {activeSession.scan.item_name}
                  </p>
                  <p>
                    <span className='font-semibold text-slate-900'>Guard post:</span>{' '}
                    {activeSession.scan.guard_post_name || 'Unassigned'}
                  </p>
                  <div className='space-y-3'>
                    <IonButton
                      expand='block'
                      onClick={() =>
                        navigate(
                          `/guard/scan/review/${activeSession.scan.custody_attempt_id}`
                        )
                      }
                      data-testid='guard-resume-saved-review'
                    >
                      Continue Saved Review
                    </IonButton>
                    <IonButton
                      fill='outline'
                      expand='block'
                      onClick={handleClearSavedSession}
                      data-testid='guard-clear-saved-review'
                    >
                      Clear Saved Review
                    </IonButton>
                  </div>
                </div>
              </GuardSurfaceCard>
            ) : null}

            <GuardCameraScannerCard
              isSubmitting={guardScanMutation.isPending}
              onScan={handleLoadReview}
            />

            <GuardSurfaceCard
              title='Manual Entry'
              subtitle='Use this only if the camera cannot read the student QR.'
              testId='guard-manual-entry-card'
            >
              <GuardManualEntryForm
                isSubmitting={guardScanMutation.isPending}
                onSubmit={handleLoadReview}
              />
            </GuardSurfaceCard>
          </div>
        </div>
      </IonContent>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color={toastColor}
      />
    </IonPage>
  )
}
