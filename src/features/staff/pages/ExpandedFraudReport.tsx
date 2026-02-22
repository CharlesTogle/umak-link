import { memo, useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { fraudReportApiService } from '@/shared/services'
import { getPostRecordByItemId } from '@/features/posts/data/posts'
import type { PostRecordDetails } from '@/features/posts/data/posts'
import type { PublicPost } from '@/features/posts/types/post'
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonIcon,
  IonToast,
  IonText,
  IonButton,
  IonSpinner
} from '@ionic/react'
import { personCircle, arrowBack } from 'ionicons/icons'
import { useFraudReports } from '@/features/staff/hooks/useFraudReports'
import type { FraudReportPublic } from '@/features/staff/hooks/useFraudReports'
import LazyImage from '@/shared/components/LazyImage'
import ExpandableImage from '@/shared/components/ExpandableImage'
import { HeaderWithButtons } from '@/shared/components/HeaderVariants'
import { ChoiceModal } from '@/shared/components/ChoiceModal'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { parseReasonForReporting } from '../utils/parseReasonForReporting'
import { isConnected } from '@/shared/utils/networkCheck'
import { useCallback } from 'react'
import { useUser } from '@/features/auth/contexts/UserContext'
import { type User } from '@/features/auth/contexts/UserContext'
import PostSkeleton from '@/features/posts/components/PostSkeleton'
import { sendFraudReportAcceptedEmail } from '@/shared/utils/emailService'
import PostCard from '@/features/posts/components/PostCard'

type RejectReasonKey =
  | 'insufficient_evidence'
  | 'original_claim_valid'
  | 'misidentification'
  | 'spam_or_malicious'
  | 'duplicate'

const REJECT_REASONS: { key: RejectReasonKey; label: string }[] = [
  {
    key: 'insufficient_evidence',
    label: 'Reporter has insufficient evidence.'
  },
  {
    key: 'original_claim_valid',
    label: 'Original Claim was verified as legitimate.'
  },
  { key: 'misidentification', label: 'Item misidentification.' },
  { key: 'spam_or_malicious', label: 'This is a spam or malicious report.' },
  { key: 'duplicate', label: 'The report is duplicated.' }
]

export default memo(function ExpandedFraudReport () {
  const { reportId } = useParams<{ reportId: string }>()
  const { navigate } = useNavigation()

  const [report, setReport] = useState<FraudReportPublic | null>(null)
  const [loading, setLoading] = useState(false)
  const [linkedMissingItem, setLinkedMissingItem] = useState<
    PublicPost | PostRecordDetails | null
  >(null)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  })

  const {
    getSingleReport,
    acceptReport,
    rejectReport,
    closeReport,
    setReports
  } = useFraudReports({
    cacheKeys: {
      loadedKey: 'LoadedReports:staff:fraud',
      cacheKey: 'CachedFraudReports:staff'
    }
  })

  // reject modal local state
  const [isProcessing, setIsProcessing] = useState(false)
  const [showChoiceModal, setShowChoiceModal] = useState(false)
  const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false)
  const [closeReportConfirmed, setCloseReportConfirmed] = useState(false)
  const [showCloseChoiceModal, setShowCloseChoiceModal] = useState(false)
  const { getUser } = useUser()
  const [user, setUser] = useState<User | any>(null)
  // Debounce refs
  const acceptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rejectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rejectChoices = REJECT_REASONS.map(r => r.label)
  const closeReportChoices = linkedMissingItem
    ? [
        'Yes, delete the claim and set item as unclaimed. The linked missing item will be reset to lost status.',
        'No, keep the claim and keep item as claimed'
      ]
    : [
        'Yes, delete the claim and set item as unclaimed',
        'No, keep the claim and keep item as claimed'
      ]

  useEffect(() => {
    const fetchUser = async () => {
      const u = await getUser()
      setUser(u)
    }
    fetchUser()
  }, [])

  const { details, reason } = parseReasonForReporting(
    report?.reason_for_reporting || ''
  )

  const fetchReport = useCallback(async () => {
    if (!reportId) return
    let mounted = true
    setLoading(true)

    try {
      const connected = await isConnected()
      if (!connected) {
        setToast({
          show: true,
          message: 'Failed to load Report - No Internet Connection'
        })
        setLoading(false)
        return
      }

      const r = await getSingleReport(reportId)
      if (!r) {
        setToast({ show: true, message: 'Report not found' })
        setLoading(false)
        return
      }
      if (mounted) {
        setReport(r)

        // Fetch linked missing item if it exists
        if (r.linked_lost_item_id) {
          const missingItem = await getPostRecordByItemId(r.linked_lost_item_id)
          if (missingItem && mounted) {
            setLinkedMissingItem(missingItem)
          }
        } else {
          setLinkedMissingItem(null)
        }
      }
    } catch (err) {
      console.error('Error loading fraud report', err)
      setToast({ show: true, message: 'Failed to load report' })
    } finally {
      setLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

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

  const handleAccept = async () => {
    // Clear any existing timeout (debounce)
    if (acceptTimeoutRef.current) {
      clearTimeout(acceptTimeoutRef.current)
    }

    // Debounce the action
    acceptTimeoutRef.current = setTimeout(async () => {
      // ensure any open modal is closed
      setShowChoiceModal(false)
      setShowAcceptConfirmModal(false)
      if (!report || isProcessing) return
      setIsProcessing(true)

      try {
        const result = await acceptReport({
          reportId: report.report_id,
          postTitle: report.item_name || 'Unknown Item',
          reporterId: report.reporter_id || undefined
        })

        if (result.success) {
          // Send email notification to claimer
          if (
            user &&
            report.claimer_school_email &&
            report.claimer_name &&
            report.reporter_name
          ) {
            const emailResult = await sendFraudReportAcceptedEmail({
              claimerEmail: report.claimer_school_email,
              claimerName: report.claimer_name,
              postTitle: report.item_name || 'Unknown Item',
              reporterName: report.reporter_name,
              staffName: user.user_name || 'Staff',
              staffUuid: user.user_id
            })

            if (!emailResult.success) {
              console.error(
                'Failed to send email notification:',
                emailResult.error
              )
              // Don't fail the entire operation if email fails
            }
          }

          setToast({
            show: true,
            message: 'Fraud report opened'
          })
          // Navigate back after a short delay to show the toast
          setTimeout(() => {
            navigate('/staff/fraud-reports')
          }, 1500)
        } else {
          setToast({ show: true, message: 'Failed to accept report' })
        }
      } catch (err) {
        console.error('Error in handleAccept:', err)
        setToast({ show: true, message: 'Action failed' })
      } finally {
        setIsProcessing(false)
      }
    }, 500) // 500ms debounce
  }

  const handleAcceptClick = () => {
    // Show confirmation modal before accepting
    setShowAcceptConfirmModal(true)
  }

  const handleReject = () => {
    setShowChoiceModal(true)
  }

  const handleRejectSubmit = async (choice: string) => {
    // Clear any existing timeout (debounce)
    if (rejectTimeoutRef.current) {
      clearTimeout(rejectTimeoutRef.current)
    }

    // Debounce the action
    rejectTimeoutRef.current = setTimeout(async () => {
      if (!report || isProcessing) return
      setShowChoiceModal(false)
      setIsProcessing(true)

      try {
        const result = await rejectReport({
          reporterId: report.reporter_id,
          reportId: report.report_id,
          postId: report.post_id,
          postTitle: report.item_name || 'Unknown Item',
          reason: choice
        })

        if (result.success) {
          setToast({
            show: true,
            message: 'Fraud report rejected successfully'
          })
          // Navigate back after a short delay to show the toast
          setTimeout(() => {
            navigate('/staff/fraud-reports', 'back')
          }, 1500)
        } else {
          setToast({ show: true, message: 'Failed to reject report' })
        }
      } catch (err) {
        console.error('Error rejecting report', err)
        setToast({ show: true, message: 'Failed to reject report' })
      } finally {
        setIsProcessing(false)
      }
    }, 500) // 500ms debounce
  }

  const handleCloseReport = () => {
    if (!report || isProcessing || !closeReportConfirmed) return
    // Show choice modal for claim deletion
    setShowCloseChoiceModal(true)
  }

  const handleCloseReportSubmit = async (choice: string) => {
    // Clear any existing timeout (debounce)
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }

    // Debounce the action
    closeTimeoutRef.current = setTimeout(async () => {
      if (!report || isProcessing) return
      setShowCloseChoiceModal(false)
      setIsProcessing(true)

      const shouldDeleteClaim = choice.startsWith('Yes')

      try {
        const result = await closeReport({
          reportId: report.report_id,
          postTitle: report.item_name || 'Unknown Item',
          deleteClaim: shouldDeleteClaim,
          itemId: report.item_id,
          reporterId: report.reporter_id
        })

        if (result.success) {
          setToast({ show: true, message: 'Report closed successfully' })
          // Refresh the report data
          const updatedReport = await getSingleReport(report.report_id)
          if (updatedReport) {
            setReport(updatedReport)
          }
          setTimeout(() => {
            navigate('/staff/fraud-reports', 'back')
          }, 1500)
        } else {
          setToast({ show: true, message: 'Failed to close report' })
        }
      } catch (err) {
        console.error('Error closing report', err)
        setToast({ show: true, message: 'Failed to close report' })
      } finally {
        setIsProcessing(false)
        setCloseReportConfirmed(false)
      }
    }, 500) // 500ms debounce
  }

  const handleReviewReport = async () => {
    // Clear any existing timeout (debounce)
    if (reviewTimeoutRef.current) {
      clearTimeout(reviewTimeoutRef.current)
    }

    // Debounce the action
    reviewTimeoutRef.current = setTimeout(async () => {
      if (!report || isProcessing) return
      setIsProcessing(true)

      try {
        await fraudReportApiService.updateStatus(report.report_id, 'under_review')

        setToast({ show: true, message: 'Report moved to under review' })
        // Refresh the report data
        const updatedReport = await getSingleReport(report.report_id)
        if (updatedReport) {
          setReport(updatedReport)
        }
      } catch (err) {
        console.error('Error reviewing report', err)
        setToast({ show: true, message: 'Failed to review report' })
      } finally {
        setIsProcessing(false)
      }
    }, 500) // 500ms debounce
  }

  const handleDeleteReport = async () => {
    // Clear any existing timeout (debounce)
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current)
    }

    // Debounce the action
    deleteTimeoutRef.current = setTimeout(async () => {
      if (!report || isProcessing) return
      setIsProcessing(true)

      try {
        await fraudReportApiService.deleteReport(report.report_id)

        // Remove deleted report from cache
        setReports(prev => prev.filter(r => r.report_id !== report.report_id))

        setToast({ show: true, message: 'Report deleted successfully' })
        setTimeout(() => {
          navigate('/staff/fraud-reports', 'back')
        }, 1500)
      } catch (err) {
        console.error('Error deleting report', err)
        setToast({ show: true, message: 'Failed to delete report' })
      } finally {
        setIsProcessing(false)
      }
    }, 500) // 500ms debounce
  }

  const getStatusColor = () => {
    switch ((report?.report_status || '').toLowerCase()) {
      case 'open':
        return 'text-amber-600'
      case 'resolved':
        return 'text-green-600'
      case 'rejected':
        return 'text-umak-red'
      default:
        return 'text-amber-500'
    }
  }

  return (
    <IonContent>
      <div className='fixed top-0 w-full z-10'>
        <HeaderWithButtons
          loading={isProcessing}
          onCancel={() => navigate('/staff/fraud-reports')}
          withSubmit={false}
        />
      </div>

      {loading && <PostSkeleton withStatusCard className='mt-15' />}

      {!loading && !report && (
        <div className='flex flex-col items-center justify-center h-full px-6'>
          <div className='text-center mb-6'>
            <p className='text-xl font-semibold text-gray-800'>
              No report found
            </p>
          </div>
          <IonButton
            onClick={() => navigate('/staff/fraud-reports', 'back')}
            fill='solid'
            style={{
              '--background': 'var(--color-umak-blue)',
              '--color': 'white'
            }}
          >
            <IonIcon slot='start' icon={arrowBack} />
            Go Back
          </IonButton>
        </div>
      )}

      <div className='h-full pt-10 pb-10'>
        {!loading && report && (
          <div>
            {report.report_status !== 'under_review' && (
              <IonCard className='my-4'>
                <IonCardContent>
                  <div className='flex flex-col place-items-center text-center'>
                    <div
                      className={`text-xl font-bold capitalize ${getStatusColor()}`}
                    >
                      {report?.report_status?.replaceAll('_', ' ')}
                    </div>
                    <div className='text-base font-medium'>
                      This report was processed by <br />
                      <span className='font-semibold'>
                        {' '}
                        {report?.fraud_reviewer_name || 'a staff member'}
                      </span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            <IonCard className='mb-4 rounded-2xl border border-slate-200/70 shadow-sm'>
              <IonCardContent className='p-7!'>
                <div className='pb-2'>
                  <div className=' flex items-center flex-row p-0 -ml-1'>
                    <IonAvatar slot='start' className='w-10 h-10'>
                      {report.reporter_profile_picture_url ? (
                        <LazyImage
                          src={report.reporter_profile_picture_url}
                          alt={`${report.reporter_name} profile`}
                          className='w-full h-full object-cover rounded-full'
                        />
                      ) : (
                        <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500 rounded-full'>
                          <IonIcon icon={personCircle} className='text-3xl' />
                        </div>
                      )}
                    </IonAvatar>
                    <div className='ml-2 text-umak-blue font-medium truncate'>
                      {report.reporter_name ?? 'Anonymous Reporter'}
                    </div>
                  </div>
                  <div className='h-px w-full my-2 bg-black'></div>

                  {/* Concern / Reason as the header */}
                  <div className='flex justify-between items-start flex-row'>
                    <div className='w-[75%] text-lg font-semibold text-slate-900'>
                      <span>{reason}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1 ${getStatusColor()}`}
                    >
                      <span className='font-semibold capitalize'>
                        {(report.report_status || 'under_review').replaceAll(
                          '_',
                          ' '
                        )}
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

                {/* Reported Item */}
                <div>
                  <p className='font-bold! text-lg! text-black!'>
                    Reported Item
                  </p>
                  <PostCard
                    imgUrl={report?.item_image_url || ''}
                    title={report?.item_name || ''}
                    description={report?.item_description || ''}
                    owner={report?.poster_name || 'Poster'}
                    owner_profile_picture_url={
                      report?.poster_profile_picture_url
                    }
                    onClick={() =>
                      navigate(`/staff/post-records/${report.post_id}`)
                    }
                  />
                </div>

                {/* Linked Missing Item */}
                {linkedMissingItem && (
                  <div className='mt-4'>
                    <p className='font-bold! text-lg! text-gray-900 mb-2'>
                      Linked Missing Item
                    </p>
                    <PostCard
                      imgUrl={linkedMissingItem.item_image_url || ''}
                      title={linkedMissingItem.item_name}
                      description={linkedMissingItem.item_description || ''}
                      owner={
                        'poster_name' in linkedMissingItem
                          ? linkedMissingItem.poster_name
                          : linkedMissingItem.username
                      }
                      owner_profile_picture_url={
                        'poster_profile_picture_url' in linkedMissingItem
                          ? linkedMissingItem.poster_profile_picture_url
                          : linkedMissingItem.profilepicture_url
                      }
                      onClick={() =>
                        navigate(
                          `/staff/post-records/${linkedMissingItem.post_id}`
                        )
                      }
                    />
                  </div>
                )}

                {/* Proof of Report */}
                {report.proof_image_url && (
                  <div className='mt-3'>
                    <IonText className='text-lg!'>
                      <p className='font-bold! text-lg! text-black!'>
                        Proof of Report
                      </p>
                      <div className='max-w-full max-h-50 overflow-hidden border-2 border-black flex items-center'>
                        <ExpandableImage
                          src={report.proof_image_url}
                          alt='Proof of Report'
                        />
                      </div>
                    </IonText>
                  </div>
                )}

                <div className='mt-3'>
                  <IonText className='text-xs text-slate-500'>
                    <span className='font-medium text-slate-600'>
                      Date reported:{' '}
                    </span>
                    {formatDateTime(report.date_reported) || 'Unknown'}
                  </IonText>
                </div>

                {/* Claim Credentials */}
                <div className='mt-4 rounded-lg'>
                  <h3 className='text-lg! font-bold! text-gray-900 mb-3'>
                    Claim Credentials
                  </h3>

                  {[
                    {
                      title: 'Claimer',
                      name: report.claimer_name || 'Unknown',
                      email: report.claimer_school_email || 'No email provided',
                      contact: report.claimer_contact_num,
                      timestamp: report.claimed_at,
                      timestampLabel: 'Claimed at'
                    },
                    {
                      title: 'Claim Approved by',
                      subtitle: 'Staff',
                      name:
                        report.claim_processed_by_name || 'Not yet approved',
                      email:
                        report.claim_processed_by_email || 'Not yet approved'
                    },
                    ...(report?.report_status !== 'under_review'
                      ? [
                          {
                            title: 'Report Processed By',
                            subtitle: 'Staff',
                            name: report?.fraud_reviewer_name || '',
                            email: report?.fraud_reviewer_email || ''
                          }
                        ]
                      : [])
                  ].map((section, index) => (
                    <div key={index} className='mb-4'>
                      <p className='text-lg! font-semibold! text-gray-700 mb-1'>
                        {section.title}
                      </p>
                      {section.subtitle && (
                        <p className='text-base! font-semibold! text-gray-700 mb-1'>
                          {section.subtitle}
                        </p>
                      )}
                      <p className='text-sm! font-medium! text-gray-900'>
                        {section.name}
                      </p>
                      <p className='text-sm! text-gray-600'>{section.email}</p>
                      {section.contact && (
                        <p className='text-sm! text-gray-600'>
                          {section.contact}
                        </p>
                      )}
                      {section.timestamp && (
                        <p className='text-xs text-gray-500'>
                          {section.timestampLabel}:{' '}
                          {formatDateTime(section.timestamp) || 'Unknown'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                {report?.report_status === 'under_review' && (
                  <div className='flex justify-between h-7 w-full gap-4 mt-4 font-default-font'>
                    <button
                      onClick={handleReject}
                      disabled={isProcessing}
                      className='h-full flex-1 bg-[var(--color-umak-red)] text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                    >
                      {isProcessing ? (
                        <IonSpinner name='crescent' className='w-5 h-5' />
                      ) : (
                        'REJECT'
                      )}
                    </button>
                    <button
                      onClick={handleAcceptClick}
                      disabled={isProcessing}
                      className='flex-1 bg-green-500 text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                    >
                      {isProcessing ? (
                        <IonSpinner name='crescent' className='w-5 h-5' />
                      ) : (
                        'OPEN'
                      )}
                    </button>
                  </div>
                )}

                {/* Close Report button for open status */}
                {report?.report_status === 'open' &&
                  user?.user_id === report?.fraud_reviewer_id && (
                    <>
                      <p className='text-lg! font-semibold! text-gray-700 mt-4 border-t-1 border-gray-500 pt-1 '>
                        Close Report
                        <span className='text-umak-red font-default-font text-sm font-normal ml-2'>
                          required
                        </span>
                      </p>
                      <div className='flex-grow'>
                        <div className='flex items-start gap-3 mb-4'>
                          <input
                            type='checkbox'
                            id='confirmReport'
                            checked={closeReportConfirmed}
                            onChange={e =>
                              setCloseReportConfirmed(e.target.checked)
                            }
                            className='mt-1 w-5 h-5'
                          />
                          <label
                            htmlFor='confirmReport'
                            className='text-base text-gray-700 cursor-pointer'
                          >
                            I confirm that this case has been properly taken
                            care of.
                          </label>
                        </div>
                      </div>

                      <div className='flex justify-center w-full font-default-font'>
                        <button
                          onClick={handleCloseReport}
                          disabled={!closeReportConfirmed || isProcessing}
                          className='flex-1 bg-[var(--color-umak-blue)] text-white py-3! px-4! rounded-md! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                        >
                          {isProcessing ? (
                            <IonSpinner name='crescent' className='w-5 h-5' />
                          ) : (
                            'CLOSE REPORT'
                          )}
                        </button>
                      </div>
                    </>
                  )}

                {/* Review and Delete buttons for rejected status */}
                {report?.report_status === 'rejected' && (
                  <div className='flex justify-between h-7 w-full gap-4 mt-4 font-default-font'>
                    <button
                      onClick={handleDeleteReport}
                      disabled={isProcessing}
                      className='h-full flex-1 bg-[var(--color-umak-red)] text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                    >
                      {isProcessing ? (
                        <IonSpinner name='crescent' className='w-5 h-5' />
                      ) : (
                        'DELETE'
                      )}
                    </button>
                    <button
                      onClick={handleReviewReport}
                      disabled={isProcessing}
                      className='flex-1 bg-[var(--color-umak-blue)] text-white py-4 px-4 rounded-sm! hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                    >
                      {isProcessing ? (
                        <IonSpinner name='crescent' className='w-5 h-5' />
                      ) : (
                        'REVIEW'
                      )}
                    </button>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}
      </div>
      <IonToast
        isOpen={toast.show}
        message={toast.message}
        duration={3000}
        onDidDismiss={() => setToast({ show: false, message: '' })}
      />
      <ChoiceModal
        isOpen={showChoiceModal}
        header='Reject Report'
        subheading1='Select a reason to reject the report.'
        subheading2='Reporter will be notified upon submission.'
        choices={rejectChoices}
        onSubmit={handleRejectSubmit}
        onDidDismiss={() => setShowChoiceModal(false)}
      />
      <ChoiceModal
        isOpen={showCloseChoiceModal}
        header='Close Report - Claim Action'
        subheading1='Do you want to delete the claim record?'
        subheading2={
          linkedMissingItem
            ? 'If you choose to delete, the found item will be set as unclaimed and the linked missing item will be reset to lost status.'
            : 'If you choose to delete, the item will be set as unclaimed.'
        }
        choices={closeReportChoices}
        onSubmit={handleCloseReportSubmit}
        onDidDismiss={() => setShowCloseChoiceModal(false)}
      />
      <ConfirmationModal
        isOpen={showAcceptConfirmModal}
        heading='Accept report?'
        subheading="Once accepted by you, other staff won't be allowed to accept this report. An email will be sent to the claimer."
        onSubmit={handleAccept}
        onCancel={() => setShowAcceptConfirmModal(false)}
        submitLabel='Accept'
        cancelLabel='Cancel'
      />
    </IonContent>
  )
})
