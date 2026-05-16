import React, { memo } from 'react'
import { useNavigation } from '@/shared/hooks/useNavigation'
import LazyImage from '@/shared/components/LazyImage'
import {
  IonCard,
  IonCardContent,
  IonIcon
} from '@ionic/react'
import { personCircle } from 'ionicons/icons'
import { parseReasonForReporting } from '@/features/staff/utils/parseReasonForReporting'

export type FraudReportCardProps = {
  reportId: string
  // Poster info
  posterName?: string
  posterProfilePictureUrl?: string | null
  // Reporter info
  reporterName?: string
  reporterProfilePictureUrl?: string | null
  // Post/Item info
  itemName?: string
  itemDescription?: string
  itemImageUrl?: string | null
  lastSeenAt?: string | null
  // Report info
  reasonForReporting?: string
  dateReported?: string
  reportStatus?: string | null
  onClick?: (reportId: string) => void
  className?: string
}

const FraudReportCard: React.FC<FraudReportCardProps> = ({
  reportId,
  posterName = 'Unknown User',
  posterProfilePictureUrl = null,
  reporterName = 'Anonymous Reporter',
  reporterProfilePictureUrl = null,
  itemName = 'Item Name',
  itemDescription = 'No description',
  itemImageUrl = null,
  lastSeenAt = null,
  reasonForReporting = 'No reason provided',
  dateReported,
  reportStatus = 'under_review',
  onClick,
  className = ''
}) => {
  const { navigate } = useNavigation()

  const handleCardClick = () => {
    onClick?.(reportId)
    navigate(`/staff/fraud-report/view/${reportId}`)
    // ignore navigation errors
  }

  // Parse reason_for_reporting which contains both reason and additional details

  const { reason, details } = parseReasonForReporting(reasonForReporting)

  const getStatusColor = () => {
    switch ((reportStatus || '').toLowerCase()) {
      case 'open':
        return 'amber-600'
      case 'resolved':
        return 'green-600'
      case 'rejected':
        return 'umak-red'
      default:
        return 'amber-500'
    }
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return ''
    const d = new Date(value)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formattedDateReported = formatDateTime(dateReported) || 'Unknown'

  const renderProfileImage = (
    imageUrl: string | null | undefined,
    name: string,
    sizeClassName: string,
    iconClassName: string
  ) => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={`${name} profile`}
          className={`${sizeClassName} shrink-0 rounded-full object-cover`}
        />
      )
    }

    return (
      <div
        className={`${sizeClassName} grid shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500`}
      >
        <IonIcon icon={personCircle} className={iconClassName} />
      </div>
    )
  }

  return (
    <IonCard
      className={`mb-4 py-2 px-4 ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={handleCardClick}
    >
      <IonCardContent className='p-0'>
        <div className='pb-2'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-3'>
              {renderProfileImage(
                reporterProfilePictureUrl,
                reporterName,
                'h-10 w-10',
                'text-3xl'
              )}
              <div className='min-w-0 text-sm text-slate-500'>
                <span className='truncate font-medium text-slate-700'>
                  {reporterName}
                </span>
                <span className='px-2 text-slate-300'>&bull;</span>
                <span>{formattedDateReported}</span>
              </div>
            </div>
            <div className={`shrink-0 text-${getStatusColor()}`}>
              <span className='font-semibold capitalize'>
                {(reportStatus || 'under_review').replaceAll('_', ' ')}
              </span>
            </div>
          </div>

          <div className='mt-4 text-lg font-semibold text-slate-900'>
            <span>{reason}</span>
          </div>

          {details && (
            <div className='mt-2 text-sm text-slate-900'>
              <span className='font-normal'>{details}</span>
            </div>
          )}
        </div>

        <IonCard className='rounded-2xl mt-1'>
          <IonCardContent>
            <div className='flex justify-start items-center mt-3'>
              <div className='aspect-[16/13] overflow-hidden rounded-xl min-w-30 max-w-30 border-2 border-slate-900'>
                <LazyImage
                  className='w-full h-full object-cover'
                  src={itemImageUrl || undefined}
                  alt={itemName}
                />
              </div>
              <div className='ml-4 max-w-1/2 max-h-2/3 overflow-hidden font-default-font font-bold text-black'>
                <p className='font-default-font font-bold! text-lg! truncate!'>
                  {itemName}
                </p>
                <p className='text-slate-900 pb-2 truncate!'>
                  {itemDescription}
                </p>
                <div className='mt-2 flex items-center gap-2 text-sm font-normal text-slate-500'>
                  {renderProfileImage(
                    posterProfilePictureUrl,
                    posterName,
                    'h-6 w-6',
                    'text-xl'
                  )}
                  <span className='truncate'>Poster: {posterName}</span>
                </div>
                {lastSeenAt ? (
                  <p className='text-sm font-normal text-slate-500'>
                    Last seen: {formatDateTime(lastSeenAt)}
                  </p>
                ) : null}
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </IonCardContent>
    </IonCard>
  )
}

export default memo(FraudReportCard)
