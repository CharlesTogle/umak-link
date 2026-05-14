import { IonContent, IonToast } from '@ionic/react'
import { useParams } from 'react-router-dom'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { HeaderWithButtons } from '@/shared/components/HeaderVariants'
import UserCustodyFormCard from '@/features/user/custody/components/UserCustodyFormCard'
import UserCustodyQrCard from '@/features/user/custody/components/UserCustodyQrCard'
import UserCustodyResultModal from '@/features/user/custody/components/UserCustodyResultModal'
import UserCustodyStatusSummary from '@/features/user/custody/components/UserCustodyStatusSummary'
import UserCustodyTimelineCard from '@/features/user/custody/components/UserCustodyTimelineCard'
import { useUserCustodyPageFlow } from '@/features/user/custody/hooks/useUserCustodyPageFlow'
import type { UserCustodyRouteParams } from '@/features/user/custody/types/user-custody'

export default function UserCustodyHandover () {
  const { postId } = useParams<UserCustodyRouteParams>()
  const numericPostId = Number(postId)
  const {
    activeSession,
    cancelMutation,
    custodyHistoryQuery,
    dispatch,
    guardPostsQuery,
    handleCancelSession,
    handleGoBack,
    handleOpenQrCode,
    handleResultClose,
    handleRetry,
    isEligibleForHandover,
    postQuery,
    resultCopy,
    retryMutation,
    sessionStatusQuery,
    startAttemptMutation,
    state
  } = useUserCustodyPageFlow(numericPostId)

  const shouldShowUnavailableState =
    !isEligibleForHandover &&
    !postQuery.isLoading &&
    !custodyHistoryQuery.isLoading

  return (
    <IonContent>
      <div className='fixed top-0 z-10 w-full'>
        <HeaderWithButtons
          loading={false}
          onCancel={handleGoBack}
          withSubmit={false}
        />
      </div>

      <div className='mb-5 mt-16 bg-gray-50 font-default-font'>
        <div className='px-4 pt-3' data-testid='user-custody-page'>
          {shouldShowUnavailableState && (
            <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-md'>
              <p className='text-lg font-extrabold text-umak-blue'>
                Handover unavailable
              </p>
              <p className='mt-3 text-sm leading-relaxed text-slate-700'>
                This found item is no longer in the reporter-held custody state.
              </p>
            </div>
          )}

          {isEligibleForHandover && !activeSession && (
            <UserCustodyFormCard
              guardPosts={guardPostsQuery.data ?? []}
              isGuardPostsLoading={guardPostsQuery.isLoading}
              guardPostsErrorMessage={
                guardPostsQuery.error instanceof Error
                  ? guardPostsQuery.error.message
                  : null
              }
              selectedGuardPostId={state.selectedGuardPostId}
              handoverImage={state.handoverImage}
              isSubmitting={startAttemptMutation.isPending}
              onGuardPostChange={guardPostId =>
                dispatch({ type: 'guardPostChanged', guardPostId })
              }
              onHandoverImageChange={handoverImage =>
                dispatch({ type: 'handoverImageChanged', handoverImage })
              }
              onOpenQrCode={() => void handleOpenQrCode()}
            />
          )}

          {activeSession && (
            <>
              <UserCustodyQrCard
                activeSession={activeSession}
                sessionStatus={sessionStatusQuery.data ?? null}
              />
              <UserCustodyStatusSummary
                activeSession={activeSession}
                sessionStatus={sessionStatusQuery.data ?? null}
                onCancel={() => dispatch({ type: 'cancelModalShown' })}
                onRetry={() => void handleRetry()}
                isCancelling={cancelMutation.isPending}
                isRetrying={retryMutation.isPending}
              />
            </>
          )}

          {custodyHistoryQuery.data && (
            <UserCustodyTimelineCard
              history={custodyHistoryQuery.data}
              isLoading={custodyHistoryQuery.isLoading}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={state.showCancelModal}
        heading='Cancel handover session?'
        subheading='This closes the current live QR session and records the cancellation in the custody trail.'
        submitLabel='Cancel Session'
        onCancel={() => dispatch({ type: 'cancelModalDismissed' })}
        onSubmit={() => void handleCancelSession()}
      />
      <UserCustodyResultModal
        isOpen={state.resultModalStatus !== null}
        title={resultCopy.title}
        message={resultCopy.message}
        onClose={handleResultClose}
      />
      <IonToast
        color={state.toast.color}
        duration={2200}
        isOpen={state.toast.isOpen}
        message={state.toast.message}
        onDidDismiss={() => dispatch({ type: 'toastDismissed' })}
      />
    </IonContent>
  )
}
