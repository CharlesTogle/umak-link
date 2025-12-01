import { memo, useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigation } from '@/shared/hooks/useNavigation'
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonIcon,
  IonToast,
  IonActionSheet,
  IonModal,
  IonButton,
  IonChip,
  IonLabel
} from '@ionic/react'
import { personCircle, arrowBack } from 'ionicons/icons'
import LazyImage from '@/shared/components/LazyImage'
import { HeaderWithBackButton } from '@/shared/components/HeaderVariants'
import Post from '@/features/posts/components/Post'
import { sharePost } from '@/shared/utils/shareUtils'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import {
  getPostFull,
  getPostByItemId,
  getPostRecordByItemId,
  getFoundPostByLinkedMissingItem
} from '@/features/posts/data/posts'
import type { PostRecordDetails } from '@/features/posts/data/posts'
import type { PublicPost } from '@/features/posts/types/post'
import PostCard from '@/features/posts/components/PostCard'
import { usePostActionsStaffServices } from '@/features/staff/hooks/usePostStaffServices'
import { ChoiceModal } from '@/shared/components/ChoiceModal'
import { rejectReasons } from '@/features/staff/utils/catalogPostHandlers'
import useNotifications from '@/features/user/hooks/useNotifications'
import { isConnected } from '@/shared/utils/networkCheck'
import { useUser } from '@/features/auth/contexts/UserContext'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import PostSkeleton from '@/features/posts/components/PostSkeleton'
import {
  formatDateTime,
  getStatusColor,
  getStatusOptions,
  getItemStatusOptions,
  isItemStatusAllowed,
  isPostStatusAllowed,
  performStatusChangeOperation
} from './ExpandedPostRecord.helpers'

export default memo(function ExpandedPostRecord () {
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()
  const { updatePostStatusWithNotification, updateItemStatus } =
    usePostActionsStaffServices()
  const { sendNotification } = useNotifications()
  const { user, getUser } = useUser()
  const { insertAuditLog } = useAuditLogs()

  const [record, setRecord] = useState<PostRecordDetails | null>(null)
  const [linkedPost, setLinkedPost] = useState<
    PublicPost | PostRecordDetails | null
  >(null)
  const [loadingLinkedPost, setLoadingLinkedPost] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  })
  const [showActions, setShowActions] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedItemStatus, setSelectedItemStatus] = useState<string | null>(
    null
  )
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showUnclaimConfirmModal, setShowUnclaimConfirmModal] = useState(false)
  const [showNotifyOwnerModal, setShowNotifyOwnerModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const statusChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const loadPost = useCallback(async () => {
    if (!postId) return

    setLoading(true)
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

      setRecord(data)
      setSelectedStatus(data.post_status)
      setSelectedItemStatus(data.item_status)

      // Fetch linked post if available
      setLoadingLinkedPost(true)
      try {
        let linked: PublicPost | PostRecordDetails | null = null

        // For found items: get the linked missing item using linked_lost_item_id
        if (data.item_type === 'found' && data.linked_lost_item_id) {
          linked = await getPostRecordByItemId(data.linked_lost_item_id)
        }
        // For missing items with status 'returned': find the found item that has this missing item linked
        else if (
          data.item_type === 'missing' &&
          data.item_status === 'returned' &&
          data.item_id
        ) {
          linked = await getFoundPostByLinkedMissingItem(data.item_id)
        }
        // For missing items with status 'claimed': get the found item by item_id
        else if (
          data.item_type === 'missing' &&
          data.item_status === 'claimed' &&
          data.item_id
        ) {
          linked = await getPostByItemId(data.item_id)
        }

        if (linked) {
          setLinkedPost(linked)
        }
      } catch (err) {
        console.error('Error fetching linked post:', err)
      } finally {
        setLoadingLinkedPost(false)
      }
    } catch (err) {
      console.error('Error loading post record', err)
      setToast({ show: true, message: 'Failed to load post record' })
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    loadPost()
  }, [loadPost])

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
        setShowNotifyOwnerModal(true)
        break
      case 'claim':
        navigate(`/staff/post/claim/${record.post_id}`)
        break
      case 'changeStatus':
        setShowStatusModal(true)
        break
    }
  }

  const isStatusActive = (status: string) => {
    return selectedStatus === status
  }

  const isItemStatusActive = (status: string) => {
    return selectedItemStatus === status
  }

  const handleApplyStatusChange = async () => {
    if (!record) return

    // If a status change is already queued, inform the user and bail out
    if (statusChangeTimeoutRef.current) {
      setToast({
        show: true,
        message:
          'This post and item status was just changed a second ago, please wait a few seconds before changing it again'
      })
      return
    }

    // Validate that at least one status is selected
    if (!selectedStatus && !selectedItemStatus) {
      setToast({
        show: true,
        message: 'Please select at least one status to change'
      })
      return
    }

    // If item status is claimed, redirect to claim page only if not previously claimed
    if (selectedItemStatus === 'claimed') {
      // Check if item was previously claimed
      if (record.item_status !== 'claimed') {
        setShowStatusModal(false)
        setSelectedStatus(null)
        setSelectedItemStatus(null)
        navigate(`/staff/post/claim/${record.post_id}`)
        return
      }
    }

    // If rejected is selected, show rejection reason modal
    if (selectedStatus === 'rejected') {
      setShowStatusModal(false)
      setShowRejectionModal(true)
      return
    }

    // If changing from claimed to any other status, show confirmation modal
    if (
      record.item_status === 'claimed' &&
      selectedItemStatus &&
      selectedItemStatus !== 'claimed'
    ) {
      setShowStatusModal(false)
      setShowUnclaimConfirmModal(true)
      return
    }

    // Proceed with status change
    await performStatusChange()
  }

  const performStatusChange = async () => {
    if (!record) return

    setIsSubmitting(true)
    statusChangeTimeoutRef.current = setTimeout(async () => {
      const result = await performStatusChangeOperation({
        record,
        selectedStatus,
        selectedItemStatus,
        updatePostStatusWithNotification,
        updateItemStatus
      })

      if (!result.success) {
        setToast({
          show: true,
          message: result.error || 'Failed to apply status change'
        })
        setIsSubmitting(false)
        return
      }

      setToast({
        show: true,
        message: 'Status updated successfully'
      })

      if (result.updatedRecord) {
        setRecord(result.updatedRecord)
      }

      setIsSubmitting(false)
      setShowStatusModal(false)
      setSelectedStatus(null)
      setSelectedItemStatus(null)

      if (statusChangeTimeoutRef.current) {
        clearTimeout(statusChangeTimeoutRef.current)
        statusChangeTimeoutRef.current = null
      }
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (statusChangeTimeoutRef.current) {
        clearTimeout(statusChangeTimeoutRef.current)
        statusChangeTimeoutRef.current = null
      }
    }
  }, [])

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

  const handleUnclaimConfirm = async () => {
    setShowUnclaimConfirmModal(false)
    await performStatusChange()
  }

  const handleNotifyOwnerConfirm = async () => {
    setShowNotifyOwnerModal(false)
    if (!record) return

    try {
      // Get current user for audit log
      let currentUser = user
      if (!currentUser) {
        currentUser = await getUser()
      }

      // Send notification to owner
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

      // Insert audit log
      if (currentUser?.user_id) {
        await insertAuditLog({
          user_id: currentUser.user_id,
          action_type: 'notify_missing_item_owner',
          details: {
            post_id: record.post_id,
            item_name: record.item_name,
            owner_id: record.poster_id,
            poster_name: record.poster_name,
            message: 'Notified owner about similar items in security office'
          }
        })
      }

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
  }

  return (
    <IonContent>
      <div className='fixed top-0 w-full z-10 max-h-screen'>
        <HeaderWithBackButton onBack={() => window.history.back()} />
      </div>

      {loading && (
        <div>
          <PostSkeleton className='mt-15' withStatusCard />
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
              returnedAt={record.returned_at ?? null}
              onKebabButtonClick={() => setShowActions(true)}
            />

            {/* Linked Post Card */}
            {linkedPost && (
              <div className='mt-6'>
                <IonCard className='mb-4 border border-slate-200/70 shadow-sm'>
                  <IonCardContent className='p-5'>
                    <h3 className='text-lg font-bold text-gray-900 mb-3'>
                      {record.item_status === 'returned'
                        ? 'Claimed Item'
                        : 'Returned Item'}
                    </h3>
                  </IonCardContent>
                </IonCard>
                {loadingLinkedPost ? (
                  <PostCard
                    imgUrl=''
                    title='Loading...'
                    description=''
                    owner=''
                  />
                ) : (
                  <PostCard
                    imgUrl={linkedPost.item_image_url ?? ''}
                    title={linkedPost.item_name ?? ''}
                    description={linkedPost.item_description ?? ''}
                    owner={
                      linkedPost.is_anonymous
                        ? 'Anonymous'
                        : ('username' in linkedPost
                            ? linkedPost.username
                            : linkedPost.poster_name) ?? ''
                    }
                    owner_profile_picture_url={
                      'profilepicture_url' in linkedPost
                        ? linkedPost.profilepicture_url
                        : linkedPost.poster_profile_picture_url
                    }
                    onClick={() =>
                      navigate(`/staff/post-record/view/${linkedPost.post_id}`)
                    }
                  />
                )}
              </div>
            )}

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
                {(record.claimer_name || record.item_status === 'returned') && (
                  <div className='mt-4 rounded-lg'>
                    <h3 className='text-lg! font-bold! text-gray-900 mb-3'>
                      {record.item_status === 'returned'
                        ? 'Return Details'
                        : 'Claim Details'}
                    </h3>

                    {/* Claimer/Returner */}
                    {record.claimer_name && record.item_status !== 'unclaimed' && (
                      <div className='mb-4'>
                        <p className='text-base! font-semibold! text-gray-700 mb-1'>
                          {record.item_status === 'returned'
                            ? 'Returned by'
                            : 'Claimer'}
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
                        {record.item_status === 'returned' &&
                        record.returned_at ? (
                          <p className='text-xs text-gray-500'>
                            Returned at:{' '}
                            {formatDateTime(record.returned_at) || 'Unknown'}
                          </p>
                        ) : (
                          <p className='text-xs text-gray-500'>
                            Claimed at:{' '}
                            {formatDateTime(record.claimed_at) || 'Unknown'}
                          </p>
                        )}
                      </div>
                    )}

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

          if (
            record &&
            record.item_type === 'found' &&
            record.item_status === 'unclaimed' &&
            record.post_status === 'accepted'
          )
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
          setSelectedItemStatus(null)
        }}
        backdropDismiss={true}
        initialBreakpoint={0.4}
        breakpoints={[0.4, 0.6]}
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
            <div className='flex flex-wrap gap-2 mb-4'>
              {getStatusOptions().map(status => {
                const isAllowed = isPostStatusAllowed(
                  status,
                  selectedItemStatus
                )
                const isActive = isStatusActive(status)
                return (
                  <IonChip
                    key={status}
                    onClick={() => {
                      if (isAllowed) {
                        setSelectedStatus(status)
                      }
                    }}
                    outline={!isActive}
                    className='px-4'
                    disabled={!isAllowed}
                    style={{
                      '--background': isActive
                        ? getStatusColor(status)
                        : 'transparent',
                      '--color': isActive ? 'white' : getStatusColor(status),
                      border: `2px solid ${getStatusColor(status)}`,
                      opacity: isAllowed ? 1 : 0.4,
                      cursor: isAllowed ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <IonLabel className='capitalize'>{status}</IonLabel>
                  </IonChip>
                )
              })}
            </div>

            <div className='w-full bg-black h-px mt-4' />
            <h3 className='text-xs! font-semibold! text-black! uppercase! tracking-wide! mb-3!'>
              Item Status
            </h3>
            <div className='flex flex-wrap gap-2'>
              {getItemStatusOptions(record?.item_type).map(status => {
                const isAllowed = isItemStatusAllowed(status, selectedStatus)
                const isActive = isItemStatusActive(status)
                return (
                  <IonChip
                    key={status}
                    onClick={() => {
                      if (isAllowed) {
                        setSelectedItemStatus(status)
                      }
                    }}
                    outline={!isActive}
                    className='px-4'
                    disabled={!isAllowed}
                    style={{
                      '--background': isActive
                        ? getStatusColor(status)
                        : 'transparent',
                      '--color': isActive ? 'white' : getStatusColor(status),
                      border: `2px solid ${getStatusColor(status)}`,
                      opacity: isAllowed ? 1 : 0.4,
                      cursor: isAllowed ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <IonLabel className='capitalize'>{status}</IonLabel>
                  </IonChip>
                )
              })}
            </div>
          </div>

          <div className='flex justify-end gap-3 mt-6 px-4 w-full'>
            <IonButton
              fill='clear'
              onClick={() => {
                setShowStatusModal(false)
                setSelectedStatus(null)
                setSelectedItemStatus(null)
              }}
              className='flex text-umak-blue'
            >
              Cancel
            </IonButton>
            <IonButton
              expand='block'
              onClick={handleApplyStatusChange}
              disabled={
                (!selectedStatus && !selectedItemStatus) || isSubmitting
              }
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
          setSelectedItemStatus(null)
        }}
      />

      {/* Unclaim Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUnclaimConfirmModal}
        heading='Confirm Unclaim Action'
        subheading='This action will delete the claim record and reset any linked missing item back to "lost" status. Are you sure you want to proceed?'
        onSubmit={handleUnclaimConfirm}
        onCancel={() => {
          setShowUnclaimConfirmModal(false)
          setSelectedStatus(null)
          setSelectedItemStatus(null)
        }}
        submitLabel={isSubmitting ? 'Processing...' : 'Confirm'}
        cancelLabel='Cancel'
      />

      {/* Notify Owner Confirmation Modal */}
      <ConfirmationModal
        isOpen={showNotifyOwnerModal}
        heading='Notify Owner'
        subheading='Are you sure you want to notify the owner that similar items are in the security office and that they can check whenever the security office is open?'
        onSubmit={handleNotifyOwnerConfirm}
        onCancel={() => setShowNotifyOwnerModal(false)}
        submitLabel='Confirm'
        cancelLabel='Cancel'
      />
    </IonContent>
  )
})
