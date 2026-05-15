import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react'
import { useState } from 'react'
import { useIonViewWillEnter } from '@ionic/react'
import { checkmarkCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import GuardActiveClaimReviewList from '@/features/guard/components/GuardActiveClaimReviewList'
import { getPostFull } from '@/features/posts/data/posts'
import { useGuardActiveClaimReviewsQuery } from '@/features/guard/hooks/useGuardActiveClaimReviewsQuery'
import { useNavigation } from '@/shared/hooks/useNavigation'
import GuardPageSectionHeader from '@/features/guard/components/GuardPageSectionHeader'
import GuardStatusBanner from '@/features/guard/components/GuardStatusBanner'
import GuardSurfaceCard from '@/features/guard/components/GuardSurfaceCard'
import {
  readLastGuardDecision,
  clearLastGuardDecision
} from '@/features/guard/state/guardSessionStorage'
import type {
  GuardDecisionSummary
} from '@/features/guard/types/guard-custody'

export default function GuardHome () {
  const { navigate } = useNavigation()
  const [latestDecision, setLatestDecision] = useState<GuardDecisionSummary | null>(
    () => readLastGuardDecision()
  )
  const activeReviewsQuery = useGuardActiveClaimReviewsQuery()
  const activeReviewPosts = activeReviewsQuery.data?.posts ?? []

  useIonViewWillEnter(() => {
    void activeReviewsQuery.refetch()

    const refreshLatestDecision = async () => {
      const storedDecision = readLastGuardDecision()
      if (!storedDecision) {
        setLatestDecision(null)
        return
      }

      if (!storedDecision.post_id) {
        clearLastGuardDecision()
        setLatestDecision(null)
        return
      }

      try {
        const latestPost = await getPostFull(String(storedDecision.post_id))
        if (!latestPost || latestPost.custody_status !== 'with_guard') {
          clearLastGuardDecision()
          setLatestDecision(null)
          return
        }
      } catch (error) {
        console.error('Failed to refresh the latest guard decision:', error)
      }

      setLatestDecision(storedDecision)
    }

    void refreshLatestDecision()
  })

  return (
    <IonPage data-testid='guard-home-page'>
      <Header logoShown={true} isProfileAndNotificationShown={true} />
      <IonContent fullscreen className='bg-gray-50'>
        <GuardPageSectionHeader
          title='Guard Handover'
          subtitle='Review student handovers and track items currently in your custody.'
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
              title='In Your Custody'
              subtitle='Posts you accepted stay here after relogin until they move out of guard custody.'
              testId='guard-home-session-card'
            >
              <GuardActiveClaimReviewList
                posts={activeReviewPosts}
                isLoading={activeReviewsQuery.isLoading}
                errorMessage={
                  activeReviewsQuery.error instanceof Error
                    ? activeReviewsQuery.error.message
                    : null
                }
                emptyMessage='No accepted handover posts are assigned to your account right now.'
                onPostClick={postId => navigate(`/guard/post-record/view/${postId}`)}
              />
            </GuardSurfaceCard>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}
