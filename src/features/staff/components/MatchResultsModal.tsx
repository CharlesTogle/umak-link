import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonSpinner
} from '@ionic/react'
import { closeOutline, checkmarkCircleOutline } from 'ionicons/icons'
import type { PublicPost } from '@/features/posts/types/post'

interface MatchResultsModalProps {
  isOpen: boolean
  onClose: () => void
  missingPost: PublicPost | null
  matches: Array<PublicPost & { score: number }>
  onSelectMatch?: (foundPostId: string) => void
  loading?: boolean
}

export default function MatchResultsModal ({
  isOpen,
  onClose,
  missingPost,
  matches,
  onSelectMatch,
  loading = false
}: MatchResultsModalProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success'
    if (score >= 0.6) return 'warning'
    return 'medium'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent Match'
    if (score >= 0.6) return 'Good Match'
    if (score >= 0.4) return 'Possible Match'
    return 'Weak Match'
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Match Results</IonTitle>
          <IonButtons slot='end'>
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className='ion-padding'>
        {loading ? (
          <div className='flex flex-col items-center justify-center h-full'>
            <IonSpinner name='crescent' />
            <p className='mt-4 text-gray-600'>Searching for matches...</p>
          </div>
        ) : (
          <>
            {/* Missing Post Info */}
            {missingPost && (
              <div className='mb-4'>
                <h3 className='text-lg font-semibold mb-2 text-gray-900'>
                  Missing Item
                </h3>
                <IonCard className='bg-blue-50'>
                  <IonCardContent>
                    <div className='flex items-start gap-3'>
                      {missingPost.item_image_url && (
                        <div className='w-20 h-20 rounded-lg overflow-hidden flex-shrink-0'>
                          <img
                            src={missingPost.item_image_url}
                            alt={missingPost.item_name}
                            className='w-full h-full object-cover'
                          />
                        </div>
                      )}
                      <div className='flex-1'>
                        <h4 className='font-semibold text-base'>
                          {missingPost.item_name}
                        </h4>
                        <p className='text-sm text-gray-600'>
                          Category: {missingPost.category || 'N/A'}
                        </p>
                        <p className='text-sm text-gray-600'>
                          Location: {missingPost.last_seen_location || 'N/A'}
                        </p>
                        <p className='text-sm text-gray-600'>
                          Date:{' '}
                          {formatDate(
                            missingPost.last_seen_at ||
                              missingPost.submission_date
                          )}
                        </p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            )}

            {/* Match Results */}
            <div>
              <h3 className='text-lg font-semibold mb-2 text-gray-900'>
                Potential Matches ({matches.length})
              </h3>

              {matches.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-gray-500'>
                    No potential matches found for this missing item.
                  </p>
                  <p className='text-sm text-gray-400 mt-2'>
                    Try checking again later or manually search for similar
                    items.
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {matches.map(match => (
                    <IonCard key={match.post_id}>
                      <IonCardContent>
                        <div className='flex items-start gap-3'>
                          {/* Match Image */}
                          {match.item_image_url && (
                            <div className='w-24 h-24 rounded-lg overflow-hidden flex-shrink-0'>
                              <img
                                src={match.item_image_url}
                                alt={match.item_name}
                                className='w-full h-full object-cover'
                              />
                            </div>
                          )}

                          {/* Match Details */}
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between gap-2'>
                              <h4 className='font-semibold text-base text-gray-900'>
                                {match.item_name}
                              </h4>
                              <IonBadge color={getScoreColor(match.score)}>
                                {Math.round(match.score * 100)}%
                              </IonBadge>
                            </div>
                            <p className='text-xs text-gray-500 mb-2'>
                              {getScoreLabel(match.score)}
                            </p>
                            <p className='text-sm text-gray-600'>
                              Posted by: {match.username}
                            </p>
                            <p className='text-sm text-gray-600'>
                              Category: {match.category || 'N/A'}
                            </p>
                            <p className='text-sm text-gray-600'>
                              Location: {match.last_seen_location || 'N/A'}
                            </p>
                            <p className='text-sm text-gray-600'>
                              Date:{' '}
                              {formatDate(
                                match.last_seen_at || match.submission_date
                              )}
                            </p>
                            {match.item_description && (
                              <p className='text-sm text-gray-700 mt-2 line-clamp-2'>
                                {match.item_description}
                              </p>
                            )}

                            {/* Select Match Button */}
                            {onSelectMatch && (
                              <IonButton
                                size='small'
                                className='mt-3'
                                onClick={() => onSelectMatch(match.post_id)}
                              >
                                <IonIcon
                                  icon={checkmarkCircleOutline}
                                  slot='start'
                                />
                                Select This Match
                              </IonButton>
                            )}
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </IonContent>
    </IonModal>
  )
}
