import React, { lazy, memo } from 'react'
import { useNavigation } from '@/shared/hooks/useNavigation'
const LazyImage = lazy(() => import('@/shared/components/LazyImage'))
import {
  IonCard,
  IonCardContent,
  IonAvatar,
  IonIcon,
  IonText
} from '@ionic/react'
import { personCircle } from 'ionicons/icons'
import { IonImg } from '@ionic/react'
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

  return (
    <IonCard
      className={`mb-4 py-2 px-4 ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={handleCardClick}
    >
      <IonCardContent className='p-0'>
        {/* Header: Reporter avatar + name + status badge. Header text is the concern/reason */}
        <div className='pb-2'>
          <div className=' flex items-center flex-row p-0 -ml-1'>
            <IonAvatar slot='start' className='w-10 h-10'>
              {reporterProfilePictureUrl ? (
                <LazyImage
                  src={reporterProfilePictureUrl}
                  alt={`${reporterName} profile`}
                  className='w-full h-full object-cover rounded-full'
                />
              ) : (
                <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500 rounded-full'>
                  <IonIcon icon={personCircle} className='text-3xl' />
                </div>
              )}
            </IonAvatar>
            <div className='ml-2 text-umak-blue font-medium truncate'>
              {reporterName}
            </div>
          </div>
          <div className='h-px w-full my-2 bg-black'></div>

          {/* Concern / Reason as the header */}
          <div className='flex justify-between items-start flex-row'>
            <div className='w-[75%] text-lg font-semibold text-slate-900'>
              <span>{reason}</span>
            </div>
            <div className={`flex items-center gap-1 text-${getStatusColor()}`}>
              <span className='font-semibold capitalize'>
                {(reportStatus || 'under_review').replaceAll('_', ' ')}
              </span>
            </div>
          </div>
          <div className='h-px w-full my-1 bg-gray-200'></div>

          {details && (
            <div className='mt-2 text-sm text-slate-900'>
              <span className='font-normal'>{details}</span>
            </div>
          )}
        </div>
        {/* Item preview card with poster info */}
        <IonCard className='rounded-2xl mt-1'>
          <IonCardContent>
            <div className='flex flex-row items-center gap-2'>
              <IonAvatar slot='start' className='w-8 h-8'>
                {posterProfilePictureUrl ? (
                  <LazyImage
                    src={posterProfilePictureUrl}
                    alt={`${posterName} profile`}
                    className='w-full h-full object-cover rounded-full'
                  />
                ) : (
                  <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500 rounded-full'>
                    <IonIcon icon={personCircle} className='text-2xl' />
                  </div>
                )}
              </IonAvatar>
              <div className='font-medium font-default-font text-umak-blue truncate'>
                {posterName}
              </div>
            </div>
            <div className='h-px w-full my-2 bg-black'></div>
            <div className='flex justify-start items-center mt-3'>
              <div className='aspect-[16/13] overflow-hidden rounded-xl max-w-30 border-2 border-slate-900'>
                <IonImg
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
              </div>
            </div>
          </IonCardContent>
        </IonCard>
        {/* Footer: Date reported only */}
        <div className='mt-3'>
          <IonText className='text-xs text-slate-500'>
            <span className='font-medium text-slate-600'>Date reported: </span>
            {formatDateTime(dateReported) || 'Unknown'}
          </IonText>
        </div>
      </IonCardContent>
    </IonCard>
  )
}

export default memo(FraudReportCard)
