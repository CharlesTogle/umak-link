import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react'
import { useState } from 'react'
import { useIonViewWillEnter } from '@ionic/react'
import { checkmarkCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import { useNavigation } from '@/shared/hooks/useNavigation'
import GuardPageSectionHeader from '@/features/guard/components/GuardPageSectionHeader'
import GuardSessionSummary from '@/features/guard/components/GuardSessionSummary'
import GuardStatusBanner from '@/features/guard/components/GuardStatusBanner'
import GuardSurfaceCard from '@/features/guard/components/GuardSurfaceCard'
import {
  clearLastGuardDecision,
  readActiveGuardScanSession,
  readLastGuardDecision
} from '@/features/guard/state/guardSessionStorage'
import type {
  GuardDecisionSummary,
  StoredGuardScanSession
} from '@/features/guard/types/guard-custody'

export default function GuardHome () {
  const { navigate } = useNavigation()
  const [activeSession, setActiveSession] = useState<StoredGuardScanSession | null>(
    () => readActiveGuardScanSession()
  )
  const [latestDecision, setLatestDecision] = useState<GuardDecisionSummary | null>(
    () => readLastGuardDecision()
  )

  useIonViewWillEnter(() => {
    setActiveSession(readActiveGuardScanSession())
    setLatestDecision(readLastGuardDecision())
  })

  const handleDismissDecision = () => {
    clearLastGuardDecision()
    setLatestDecision(null)
  }

  return (
    <IonPage data-testid='guard-home-page'>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <IonContent fullscreen className='bg-gray-50'>
        <GuardPageSectionHeader
          title='Guard Handover'
          subtitle='Review student handovers and continue saved guard sessions.'
          icon={shieldCheckmarkOutline}
          testId='guard-home-section-header'
        />
        <div className='min-h-full bg-gray-50 px-4 pb-24 pt-4'>
          <div className='flex flex-col gap-4'>
            {latestDecision ? (
              <GuardStatusBanner
                tone={latestDecision.attempt_status === 'accepted' ? 'success' : 'warning'}
                title={
                  latestDecision.attempt_status === 'accepted'
                    ? 'Handover accepted'
                    : 'Handover rejected'
                }
                description={`The latest guard decision for ${latestDecision.item_name} was recorded successfully.`}
                testId='guard-decision-banner'
              />
            ) : null}

            <GuardSurfaceCard
              title='Start Review'
              subtitle='Open the scan flow when a student presents a custody QR. The item stays with the student until you accept.'
              testId='guard-home-overview'
            >
              <div className='space-y-4'>
                <div className='rounded-2xl bg-[#1D2981] px-4 py-5 text-white shadow-sm'>
                  <div>
                    <p className='text-sm font-semibold text-blue-100'>
                      Start from the scan flow whenever a student presents the QR.
                    </p>
                    <h1 className='mt-2 text-xl font-extrabold' data-testid='guard-home-title'>
                      Review custody handovers with a clear audit trail.
                    </h1>
                    <p className='mt-2 text-sm leading-relaxed text-blue-50'>
                      Validate the session, check the item and evidence, then record the decision before the item changes hands.
                    </p>
                  </div>
                  <IonButton
                    expand='block'
                    onClick={() => navigate('/guard/scan')}
                    data-testid='guard-start-scan'
                    className='mt-4'
                  >
                    Open Scan
                  </IonButton>
                </div>

                <div className='space-y-3 text-sm text-slate-700'>
                  <div className='flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                    <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10 font-extrabold text-umak-blue'>
                      1
                    </div>
                    <div>
                      <p className='font-extrabold text-slate-900'>Validate</p>
                      <p className='mt-1 leading-6'>
                      Confirm the QR session is still active and tied to the student’s handover attempt.
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                    <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10 font-extrabold text-umak-blue'>
                      2
                    </div>
                    <div>
                      <p className='font-extrabold text-slate-900'>Review</p>
                      <p className='mt-1 leading-6'>
                      Check the item details, the evidence image, and the selected guard post before acting.
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                    <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1D2981]/10 text-umak-blue'>
                      <IonIcon icon={checkmarkCircleOutline} className='text-lg' />
                    </div>
                    <div>
                      <p className='font-extrabold text-slate-900'>Decide</p>
                      <p className='mt-1 leading-6'>
                      Accept to take custody or reject to keep the item with the student and close that attempt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GuardSurfaceCard>

            <GuardSurfaceCard
              title='Current Session'
              subtitle='Resume an active review or confirm the last recorded decision.'
              testId='guard-home-session-card'
            >
              <GuardSessionSummary
                activeSession={activeSession}
                latestDecision={latestDecision}
              />

              <div className='mt-4 space-y-3'>
                {activeSession ? (
                  <IonButton
                    expand='block'
                    onClick={() =>
                      navigate(
                        `/guard/scan/review/${activeSession.scan.custody_attempt_id}`
                      )}
                    data-testid='guard-resume-review'
                  >
                    Continue Review
                  </IonButton>
                ) : (
                  <IonButton
                    expand='block'
                    onClick={() => navigate('/guard/scan')}
                    data-testid='guard-open-scan-secondary'
                  >
                    Start New Review
                  </IonButton>
                )}

                {latestDecision ? (
                  <IonButton
                    fill='outline'
                    expand='block'
                    onClick={handleDismissDecision}
                    data-testid='guard-dismiss-decision'
                  >
                    Dismiss Latest Result
                  </IonButton>
                ) : null}
              </div>
            </GuardSurfaceCard>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
