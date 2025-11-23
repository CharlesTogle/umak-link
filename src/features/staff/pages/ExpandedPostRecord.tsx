import { memo, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigation } from '@/shared/hooks/useNavigation'
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonIcon,
  IonToast,
  IonSpinner,
  IonActionSheet,
  IonModal,
  IonButton,
  IonChip,
  IonLabel
} from '@ionic/react'
import { personCircle, arrowBack } from 'ionicons/icons'
import LazyImage from '@/shared/components/LazyImage'
import Header from '@/shared/components/Header'
import Post from '@/features/posts/components/Post'
import { sharePost } from '@/shared/utils/shareUtils'
import { getPostFull } from '@/features/posts/data/posts'
import type { PostRecordDetails } from '@/features/posts/data/posts'
import { usePostActionsStaffServices } from '@/features/staff/hooks/usePostStaffServices'
import { ChoiceModal } from '@/shared/components/ChoiceModal'
import { rejectReasons } from '@/features/staff/utils/catalogPostHandlers'
import useNotifications from '@/features/user/hooks/useNotifications'
import { isConnected } from '@/shared/utils/networkCheck'

export default memo(function ExpandedPostRecord () {
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()
  const { updatePostStatusWithNotification } = usePostActionsStaffServices()
  const { sendNotification } = useNotifications()

  const [record, setRecord] = useState<PostRecordDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  })
  const [showActions, setShowActions] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!postId) return
    let mounted = true
    setLoading(true)
    ;(async () => {
      try {
        const connected = await isConnected()
        if (!connected) {
          setToast({
            show: true,
            message: 'Failed to load Post - No Internet Connection'
          })
          setLoading(false)
          return
        }

        const data = await getPostFull(postId)

        if (!data) {
          setToast({ show: true, message: 'Post record not found' })
          setLoading(false)
          return
        }

        if (mounted) {
          setRecord(data)
          setSelectedStatus(data.post_status)
        }
      } catch (err) {
        console.error('Error loading post record', err)
        setToast({ show: true, message: 'Failed to load post record' })
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [postId])

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

  const handleActionSheetClick = async (action: string) => {
    setShowActions(false)
    if (!record) return

    switch (action) {
      case 'share':
        const result = await sharePost(record.post_id, 'user')
        if (result.success) {
          if (result.method === 'clipboard') {
            setToast({
              show: true,
              message: 'Link copied to clipboard'
            })
          }
        } else {
          setToast({
            show: true,
            message: 'Failed to share post'
          })
        }
        break
      case 'notify':
        try {
          await sendNotification({
            userId: record.poster_id,
            title: 'Great News! A Possible Match to Your Item',
            message: `We have identified items that may possibly match your ${record.item_name}. Please proceed to the Security Office during office hours to verify if any of them belong to you.`,
            type: 'match',
            data: {
              postId: record.post_id,
              itemName: record.item_name,
              link: `/user/post/view/${record.post_id}`
            }
          })
          setToast({
            show: true,
            message: 'Notification sent to owner successfully'
          })
        } catch (error) {
          console.error('Error sending notification:', error)
          setToast({
            show: true,
            message: 'Failed to send notification to owner'
          })
        }
        break
      case 'claim':
        navigate(`/staff/post/claim/${record.post_id}`)
        break
      case 'changeStatus':
        setShowStatusModal(true)
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return '#16a34a' // green-600
      case 'rejected':
        return '#C1272D' // umak-red
      case 'pending':
        return '#d97706' // amber-600
      case 'claimed':
      case 'returned':
        return '#2563eb' // blue-600
      case 'unclaimed':
        return '#C1272D' // umak-red
      case 'fraud':
        return '#b91c1c' // red-700
      case 'lost':
        return '#d97706' // amber-600
      case 'discarded':
        return '#dc2626' // red-600
      default:
        return '#f59e0b' // amber-500
    }
  }

  const getStatusOptions = () => {
    return ['pending', 'accepted', 'rejected']
  }

  const isStatusActive = (status: string) => {
    return selectedStatus === status
  }

  const handleApplyStatusChange = async () => {
    if (!selectedStatus || !record) return

    // If rejected is selected, show rejection reason modal
    if (selectedStatus === 'rejected') {
      setShowStatusModal(false)
      setShowRejectionModal(true)
      return
    }

    // For accepted and pending, directly update status
    setIsSubmitting(true)
    const result = await updatePostStatusWithNotification(
      record.post_id,
      selectedStatus as 'accepted' | 'rejected' | 'pending'
    )

    if (result.success) {
      setToast({
        show: true,
        message: `Post status changed to ${selectedStatus}`
      })

      // Refresh the record
      const updatedData = await getPostFull(record.post_id)
      if (updatedData) {
        setRecord(updatedData)
      }
    } else {
      setToast({
        show: true,
        message: result.error || 'Failed to update post status'
      })
    }

    setIsSubmitting(false)
    setShowStatusModal(false)
    setSelectedStatus(null)
  }

  const handleRejectWithReason = async (choice: string) => {
    if (!record || !choice.trim()) {
      setToast({
        show: true,
        message: 'Please select a rejection reason'
      })
      return
    }

    setShowRejectionModal(false)
    setIsSubmitting(true)
    const result = await updatePostStatusWithNotification(
      record.post_id,
      'rejected',
      choice.trim()
    )

    if (result.success) {
      setToast({
        show: true,
        message: 'Post rejected successfully'
      })

      // Refresh the record
      const updatedData = await getPostFull(record.post_id)
      if (updatedData) {
        setRecord(updatedData)
      }
    } else {
      setToast({
        show: true,
        message: result.error || 'Failed to reject post'
      })
    }

    setIsSubmitting(false)
    setSelectedStatus(null)
  }

  return (
    <IonContent>
      <div className='fixed top-0 w-full'>
        <Header logoShown isProfileAndNotificationShown />
      </div>

      {loading && (
        <div className='w-full grid place-items-center py-16'>
          <IonSpinner />
        </div>
      )}

      {!loading && !record && (
        <div className='flex flex-col items-center justify-center h-full px-6'>
          <div className='text-center mb-6'>
            <p className='text-xl font-semibold text-gray-800'>
              No record found
            </p>
          </div>
          <IonButton
            onClick={() => navigate('/staff/post-records', 'back')}
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

      <div className='h-full pb-10 pt-15'>
        {!loading && record && (
          <div>
            {/* Post Status Card */}
            <IonCard className='my-4'>
              <IonCardContent>
                <div className='flex flex-col place-items-center text-center'>
                  <div
                    className='text-xl font-bold capitalize'
                    style={{ color: getStatusColor(record.post_status) }}
                  >
                    {record.post_status.replaceAll('_', ' ')}
                  </div>
                  <div className='text-base font-medium text-gray-600'>
                    This post has been {record.post_status.replaceAll('_', ' ')}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Post Component */}
            <Post
              username={record.poster_name}
              user_profile_picture_url={record.poster_profile_picture_url}
              itemName={record.item_name}
              description={record.item_description}
              category={record.category}
              lastSeen={formatDateTime(
                record.last_seen_at || record.submitted_on_date_local
              )}
              imageUrl={record.item_image_url}
              locationLastSeenAt={record.last_seen_location}
              itemStatus={record.item_status}
              showAnonIndicator={record.is_anonymous}
              onKebabButtonClick={() => setShowActions(true)}
            />

            {/* Additional Details Card */}
            <IonCard className='mb-4 border border-slate-200/70 shadow-sm'>
              <IonCardContent className='p-7!'>
                {/* Post Details */}
                <div>
                  <h3 className='text-lg! font-bold! text-gray-900 mb-2'>
                    Post Details
                  </h3>
                  <div className='space-y-1'>
                    <p className='text-sm text-gray-600'>
                      <span className='font-medium'>Item Type: </span>
                      <span className='capitalize'>{record.item_type}</span>
                    </p>
                    <p className='text-sm text-gray-600'>
                      <span className='font-medium'>Submitted: </span>
                      {formatDateTime(record.submitted_on_date_local) ||
                        'Unknown'}
                    </p>
                    {record.accepted_on_date_local && (
                      <p className='text-sm text-gray-600'>
                        <span className='font-medium'>Accepted: </span>
                        {formatDateTime(record.accepted_on_date_local)}
                      </p>
                    )}
                  </div>
                </div>

                <div className='mt-4'>
                  <h3 className='text-lg! font-bold! text-gray-900 mb-2'>
                    Poster Details
                  </h3>
                  <p className='text-sm! font-medium! text-gray-900'>
                    Name: {record.poster_name}
                  </p>
                  <p className='text-sm! text-gray-600'>
                    Email: {record.poster_email}
                  </p>
                </div>

                {/* Claim Details */}
                {record.claimer_name && (
                  <div className='mt-4 rounded-lg'>
                    <h3 className='text-lg! font-bold! text-gray-900 mb-3'>
                      Claim Details
                    </h3>

                    {/* Claimer */}
                    <div className='mb-4'>
                      <p className='text-base! font-semibold! text-gray-700 mb-1'>
                        Claimer
                      </p>
                      <p className='text-sm! font-medium! text-gray-900'>
                        Name: {record.claimer_name}
                      </p>
                      <p className='text-sm! text-gray-600'>
                        Email:
                        {record.claimer_school_email || 'No email provided'}
                      </p>
                      {record.claimer_contact_num && (
                        <p className='text-sm! text-gray-600'>
                          Contact Number: {record.claimer_contact_num}
                        </p>
                      )}
                      <p className='text-xs text-gray-500'>
                        Claimed at:{' '}
                        {formatDateTime(record.claimed_at) || 'Unknown'}
                      </p>
                    </div>

                    {/* Claim Processed by */}
                    {record.claim_processed_by_name && (
                      <div>
                        <p className='text-base! font-semibold! text-gray-700 mb-1'>
                          Claim Processed by
                        </p>
                        <div className='flex items-center gap-2 mb-2'>
                          <IonAvatar className='w-8 h-8'>
                            {record.claim_processed_by_profile_picture_url ? (
                              <LazyImage
                                src={
                                  record.claim_processed_by_profile_picture_url
                                }
                                alt={`${record.claim_processed_by_name} profile`}
                                className='w-full h-full object-cover rounded-full'
                              />
                            ) : (
                              <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500 rounded-full'>
                                <IonIcon
                                  icon={personCircle}
                                  className='text-2xl'
                                />
                              </div>
                            )}
                          </IonAvatar>
                          <div>
                            <p className='text-sm! font-medium! text-gray-900'>
                              {record.claim_processed_by_name}
                            </p>
                            <p className='text-sm! text-gray-600'>
                              {record.claim_processed_by_email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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

      {/* Action Sheet for Post Records */}
      <IonActionSheet
        isOpen={showActions}
        onDidDismiss={() => setShowActions(false)}
        buttons={(() => {
          const buttons = []

          // Share: always available
          buttons.push({
            text: 'Share',
            handler: () => handleActionSheetClick('share')
          })

          // Notify the owner: only for missing items with status 'lost'
          if (
            record &&
            record.item_type === 'missing' &&
            record.item_status === 'lost'
          ) {
            buttons.push({
              text: 'Notify the owner',
              handler: () => handleActionSheetClick('notify')
            })
          }

          // Claim Item: always available
          buttons.push({
            text: 'Claim Item',
            handler: () => handleActionSheetClick('claim')
          })

          // Change Status: always available
          buttons.push({
            text: 'Change Status',
            handler: () => handleActionSheetClick('changeStatus')
          })

          // Cancel: always available
          buttons.push({
            text: 'Cancel',
            role: 'cancel'
          })

          return buttons
        })()}
      />

      {/* Status Change Modal */}
      <IonModal
        isOpen={showStatusModal}
        onDidDismiss={() => {
          setShowStatusModal(false)
          setSelectedStatus(null)
        }}
        backdropDismiss={true}
        initialBreakpoint={0.33}
        breakpoints={[0.33, 0.5]}
        className='font-default-font'
        style={{ '--border-radius': '2rem' }}
      >
        <div className='flex flex-col items-center pb-4'>
          <div className='text-center'>
            <p className='text-base! font-medium! mt-5'>Update Post Status</p>
            <p className='mt-1 mb-2 text-sm text-gray-500'>
              Select a status to change the post status.
            </p>
          </div>

          <div className='w-full pt-4 px-4'>
            <div className='w-full bg-black h-px' />
            <h3 className='text-xs! font-semibold! text-black! uppercase! tracking-wide! mb-3!'>
              Post Status
            </h3>
            <div className='flex flex-wrap gap-2'>
              {getStatusOptions().map(status => (
                <IonChip
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  outline={!isStatusActive(status)}
                  className='px-4'
                  style={{
                    '--background': isStatusActive(status)
                      ? getStatusColor(status)
                      : 'transparent',
                    '--color': isStatusActive(status)
                      ? 'white'
                      : getStatusColor(status),
                    border: `2px solid ${getStatusColor(status)}`
                  }}
                >
                  <IonLabel className='capitalize'>{status}</IonLabel>
                </IonChip>
              ))}
            </div>
          </div>

          <div className='flex justify-end gap-3 mt-6 px-4 w-full'>
            <IonButton
              fill='clear'
              onClick={() => {
                setShowStatusModal(false)
                setSelectedStatus(null)
              }}
              className='flex text-umak-blue'
            >
              Cancel
            </IonButton>
            <IonButton
              expand='block'
              onClick={handleApplyStatusChange}
              disabled={!selectedStatus || isSubmitting}
              style={{
                '--background': 'var(--color-umak-blue)'
              }}
            >
              {isSubmitting ? 'Updating...' : 'Apply Changes'}
            </IonButton>
          </div>
        </div>
      </IonModal>

      {/* Rejection Reason Modal */}
      <ChoiceModal
        isOpen={showRejectionModal}
        header='Reject Post'
        subheading1='Select a reason to reject the post.'
        subheading2='Uploader will be notified upon submission.'
        choices={Array.from(rejectReasons)}
        onSubmit={handleRejectWithReason}
        onDidDismiss={() => {
          setShowRejectionModal(false)
          setSelectedStatus(null)
        }}
      />
    </IonContent>
  )
})
