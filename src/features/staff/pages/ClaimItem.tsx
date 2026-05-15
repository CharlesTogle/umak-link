import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  IonContent,
  IonButton,
  IonText,
  IonToast,
  IonSpinner
} from '@ionic/react'
import { checkmarkCircle } from 'ionicons/icons'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useUser } from '@/features/auth/contexts/UserContext'
import CardHeader from '@/shared/components/CardHeader'
import FormSectionHeader from '@/shared/components/FormSectionHeader'
import { HeaderWithButtons } from '@/shared/components/HeaderVariants'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import PostCard from '@/features/posts/components/PostCard'
import {
  getPostFull,
  type PostRecordDetails
} from '@/features/posts/data/posts'
import { useStaffSearch } from '@/features/admin/hooks/useStaffSearch'
import { isConnected } from '@/shared/utils/networkCheck'
import ClaimerEmailSearch from '@/features/staff/components/claim-item/ClaimerEmailSearch'
import SelectedUserCard from '@/features/staff/components/claim-item/SelectedUserCard'
import ClaimFormFields from '@/features/staff/components/claim-item/ClaimFormFields'
import ClaimItemLoadingSkeleton from '@/features/staff/components/claim-item/ClaimItemLoadingSkeleton'
import ClaimVerificationPanel from '@/features/staff/components/claim-item/ClaimVerificationPanel'
import {
  initializeDateTimeState,
  toISODate,
  getPhilippineTimeISO
} from '@/shared/utils/dateTimeHelpers'
import { useClaimItemPostValidation } from '@/features/staff/hooks/useClaimItemPostValidation'
import { useClaimItemSubmit } from '@/features/staff/hooks/useClaimItemSubmit'
import { useExistingClaimCheck } from '@/features/staff/hooks/useExistingClaimCheck'
import { useClaimQrScanner } from '@/features/staff/hooks/useClaimQrScanner'
import {
  useScanStaffClaimVerificationMutation,
  useStaffClaimVerificationSessionQuery,
  useStaffClaimVerificationStatusQuery
} from '@/features/staff/hooks/useStaffClaimVerificationQueries'
import type {
  ClaimQrScanPayload,
  ClaimVerifiedClaimerSummary
} from '@/shared/lib/api-types'

interface SelectedUser {
  id: string
  name: string
  email: string
  image?: string | null
}

interface ClaimFormData {
  contactNumber: string
  itemId: string
}

function getClaimBlockingMessage (post: PostRecordDetails): string | null {
  if (post.item_type !== 'found') {
    return 'Only found items can be claimed.'
  }

  if (post.post_status !== 'accepted') {
    return 'This found post must be accepted before it can be claimed.'
  }

  if (post.item_status !== 'unclaimed') {
    return 'This found post is no longer available for claim.'
  }

  if (post.custody_status !== 'in_security_office') {
    return 'This found post cannot be claimed until the item is received in the Security Office.'
  }

  return null
}

function normalizeToLocal (input: string): string | null {
  const digits = (input || '').replace(/[^0-9]/g, '')

  if (/^63\d{10}$/.test(digits)) {
    return '0' + digits.slice(2)
  }

  if (/^0?9\d{9}$/.test(digits)) {
    if (digits.length === 10) return '0' + digits
    return digits
  }

  return null
}

function formatLocalPhoneNumber (local: string): string {
  if (local.length === 11) {
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
  }

  return local
}

function mapVerifiedClaimerToSelectedUser (
  claimer: ClaimVerifiedClaimerSummary
): SelectedUser {
  return {
    id: claimer.user_id,
    name: claimer.user_name,
    email: claimer.email,
    image: claimer.profile_picture_url
  }
}

export default function ClaimItem () {
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()
  const { getUser } = useUser()

  const initialDateTime = initializeDateTimeState()
  const foundPostId = postId ? Number(postId) : null

  const [post, setPost] = useState<PostRecordDetails | null>(null)
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    lostItemPost,
    loading: lostItemPostLoading,
    error: lostItemPostError,
    validateAndFetchPost,
    clearPost
  } = useClaimItemPostValidation()

  const [searchText, setSearchText] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null)
  const {
    results,
    loading: searchLoading,
    error: searchError,
    search,
    clearResults
  } = useStaffSearch()

  const [date, setDate] = useState(initialDateTime.date)
  const [time, setTime] = useState(initialDateTime.time)
  const [meridian, setMeridian] = useState(initialDateTime.meridian)
  const [formData, setFormData] = useState<ClaimFormData>({
    contactNumber: '',
    itemId: ''
  })
  const [manualQrSessionId, setManualQrSessionId] = useState('')
  const [manualQrSessionToken, setManualQrSessionToken] = useState('')

  const { submit, isProcessing } = useClaimItemSubmit()
  const { existingClaim, checkForExistingClaim, clearExistingClaim } =
    useExistingClaimCheck()

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    color: string
  }>({
    show: false,
    message: '',
    color: 'success'
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const claimSessionQuery = useStaffClaimVerificationSessionQuery(
    foundPostId,
    Boolean(post) && !blockingMessage
  )
  const claimSessionStatusQuery = useStaffClaimVerificationStatusQuery(
    claimSessionQuery.data?.claim_verification_session_id ?? null,
    Boolean(claimSessionQuery.data?.claim_verification_session_id)
  )
  const scanClaimVerificationMutation = useScanStaffClaimVerificationMutation()

  const sessionStatus =
    claimSessionStatusQuery.data ?? claimSessionQuery.data ?? null
  const joinedClaimer = sessionStatus?.verified_claimer ?? null
  const scannedClaimer =
    sessionStatus?.status === 'scanned' || sessionStatus?.status === 'completed'
      ? joinedClaimer
      : null
  const claimerForSubmission = scannedClaimer
    ? mapVerifiedClaimerToSelectedUser(scannedClaimer)
    : selectedUser
  const claimVerificationError =
    claimSessionQuery.error instanceof Error
      ? claimSessionQuery.error.message
      : claimSessionStatusQuery.error instanceof Error &&
          !claimSessionQuery.data
        ? claimSessionStatusQuery.error.message
        : null
  const isSessionLoading =
    claimSessionQuery.isLoading || claimSessionStatusQuery.isLoading
  const isVerifyingClaimer = scanClaimVerificationMutation.isPending

  const handleVerifyClaimQr = useCallback(
    async (payload: ClaimQrScanPayload) => {
      try {
        await scanClaimVerificationMutation.mutateAsync({
          claimQrSessionId: payload.claimQrSessionId,
          sessionToken: payload.sessionToken
        })
        setManualQrSessionId('')
        setManualQrSessionToken('')
        setSelectedUser(null)
        setSearchText('')
        clearResults()
        await claimSessionStatusQuery.refetch()
        setToast({
          show: true,
          message: 'Student QR verified successfully.',
          color: 'success'
        })
      } catch (error) {
        setToast({
          show: true,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to verify the student QR.',
          color: 'danger'
        })
      }
    },
    [claimSessionStatusQuery, clearResults, scanClaimVerificationMutation]
  )

  const claimQrScanner = useClaimQrScanner({
    onDetected: handleVerifyClaimQr
  })

  useEffect(() => {
    if (!hasUnsavedChanges) {
      const userChanged =
        selectedUser !== null ||
        formData.contactNumber.trim() !== '' ||
        formData.itemId.trim() !== '' ||
        manualQrSessionId.trim() !== '' ||
        manualQrSessionToken.trim() !== ''

      if (userChanged) {
        setHasUnsavedChanges(true)
      }
    }
  }, [
    formData.contactNumber,
    formData.itemId,
    hasUnsavedChanges,
    manualQrSessionId,
    manualQrSessionToken,
    selectedUser
  ])

  const loadPost = useCallback(async () => {
    if (!postId) {
      setToast({
        show: true,
        message: 'Invalid post ID',
        color: 'danger'
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const connected = await isConnected(8000)
      if (!connected) {
        setToast({
          show: true,
          message: 'No internet connection. Please check your network.',
          color: 'danger'
        })
        setLoading(false)
        return
      }

      const fetchedPost = await getPostFull(postId)
      if (!fetchedPost) {
        setToast({
          show: true,
          message: 'Post not found',
          color: 'danger'
        })
        setPost(null)
        return
      }

      const claimBlockingMessage = getClaimBlockingMessage(fetchedPost)
      if (claimBlockingMessage) {
        setBlockingMessage(claimBlockingMessage)
        setPost(null)
        return
      }

      setBlockingMessage(null)
      setPost(fetchedPost)
    } catch (error) {
      console.error('Error loading post:', error)
      setToast({
        show: true,
        message: 'Failed to load post',
        color: 'danger'
      })
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    void loadPost()
  }, [loadPost])

  const handleSearchChange = (e: CustomEvent) => {
    const value = e.detail.value || ''
    setSearchText(value)
    if (value.length >= 2) {
      search(value)
    } else {
      clearResults()
    }
  }

  const handleUserSelect = (user: {
    user_id: string
    user_name: string
    email: string
    profile_picture_url?: string | null
  }) => {
    setSelectedUser({
      id: user.user_id,
      name: user.user_name,
      email: user.email,
      image: user.profile_picture_url
    })
    setSearchText('')
    clearResults()
  }

  const handleRemoveUser = () => {
    setSelectedUser(null)
    setSearchText('')
    clearResults()
  }

  const handleDateChange = (iso: string) => {
    if (!iso) return

    const selectedDate = new Date(iso)
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Manila'
    })

    let hours = selectedDate.getHours()
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0')
    const nextMeridian = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12

    setDate(formattedDate)
    setTime(`${hours}:${minutes}`)
    setMeridian(nextMeridian as 'AM' | 'PM')
  }

  const handleFormChange = async (
    field: keyof ClaimFormData,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (field === 'itemId' && value.trim()) {
      await validateAndFetchPost(value)
    } else if (field === 'itemId' && !value.trim()) {
      clearPost()
    }
  }

  const handleSubmit = async () => {
    setShowConfirmModal(false)
    setIsSubmitting(true)

    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }

    submitTimeoutRef.current = setTimeout(async () => {
      const user = await getUser()

      if (!postId || !post || !user) {
        setToast({
          show: true,
          message: 'User not authenticated.',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      if (!sessionStatus?.claim_verification_session_id) {
        setToast({
          show: true,
          message: 'Claim session unavailable. Reload the page and try again.',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      const normalizedContactNumber = normalizeToLocal(formData.contactNumber.trim())
      if (!normalizedContactNumber) {
        setToast({
          show: true,
          message:
            'Please enter a valid Philippine mobile number (examples: 09123456789, 0912 345 6789, +639123456789, +63 912-345-6789)',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      const claimedAt = toISODate(date, time, meridian)
      if (!claimedAt) {
        setToast({
          show: true,
          message: 'Please enter a valid claimed date and time',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      if (formData.itemId.trim() && !lostItemPost) {
        setToast({
          show: true,
          message: 'Referenced lost item not found. Please verify the Item ID.',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      if (!claimerForSubmission) {
        setToast({
          show: true,
          message:
            'Scan the student QR or use the staff-only manual claimer field before submitting the claim.',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      let claimVerification:
        | {
            claim_verification_session_id: string
            verification_method: 'staff_qr'
          }
        | undefined

      if (scannedClaimer) {
        if (sessionStatus.status !== 'scanned') {
          setToast({
            show: true,
            message: 'Scan the live student QR before completing the claim.',
            color: 'danger'
          })
          setIsSubmitting(false)
          return
        }

        claimVerification = {
          claim_verification_session_id:
            sessionStatus.claim_verification_session_id,
          verification_method: 'staff_qr'
        }
      }

      let itemIdToCheck: string | null = null

      try {
        const latestFound = await getPostFull(postId)
        if (!latestFound) {
          setToast({ show: true, message: 'Post not found', color: 'danger' })
          setIsSubmitting(false)
          return
        }

        const claimBlockingMessage = getClaimBlockingMessage(latestFound)
        if (claimBlockingMessage) {
          setToast({
            show: true,
            message: claimBlockingMessage,
            color: 'danger'
          })
          setIsSubmitting(false)
          return
        }

        itemIdToCheck = latestFound.item_id
      } catch (error) {
        console.error('Error fetching post details:', error)
        setToast({
          show: true,
          message: 'Failed to verify post status',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      if (itemIdToCheck) {
        const existingClaimData = await checkForExistingClaim(itemIdToCheck)

        if (existingClaimData) {
          setIsSubmitting(false)
          setShowOverwriteModal(true)
          return
        }
      }

      if (lostItemPost?.post_id) {
        try {
          const latestMissing = await getPostFull(lostItemPost.post_id)
          if (!latestMissing) {
            setToast({
              show: true,
              message: 'Referenced lost item not found',
              color: 'danger'
            })
            setIsSubmitting(false)
            return
          }

          if (latestMissing.item_status === 'returned') {
            setToast({
              show: true,
              message:
                'Cannot mark item as returned — it has already been returned.',
              color: 'danger'
            })
            setIsSubmitting(false)
            return
          }
        } catch (error) {
          console.error('Error verifying missing post status:', error)
          setToast({
            show: true,
            message: 'Failed to verify linked lost item',
            color: 'danger'
          })
          setIsSubmitting(false)
          return
        }
      }

      const connected = await isConnected(8000)
      if (!connected) {
        setToast({
          show: true,
          message: 'Failed to claim item - no internet connection',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      await submit(
        {
          foundPostId: postId,
          claimerName: claimerForSubmission.name,
          claimerEmail: claimerForSubmission.email,
          claimerContactNumber: formatLocalPhoneNumber(normalizedContactNumber),
          claimedAt,
          posterName: post.is_anonymous ? 'Anonymous' : post.poster_name,
          staffId: user.user_id,
          staffName: user.user_name,
          missingPostId: lostItemPost ? lostItemPost.post_id : null,
          claimVerification,
          existingClaim,
          isOverwrite: false
        },
        message => {
          setToast({
            show: true,
            message,
            color: 'success'
          })
          setIsSubmitting(false)
          clearExistingClaim()
        },
        message => {
          setToast({
            show: true,
            message,
            color: 'danger'
          })
          setIsSubmitting(false)
        }
      )

      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
        submitTimeoutRef.current = null
      }
    }, 500)
  }

  const handleOverwriteClaim = async () => {
    setShowOverwriteModal(false)
    setIsSubmitting(true)

    const user = await getUser()

    if (!postId || !post || !user || !claimerForSubmission) {
      setToast({
        show: true,
        message: 'Claim form is incomplete.',
        color: 'danger'
      })
      setIsSubmitting(false)
      return
    }

    const normalizedContactNumber = normalizeToLocal(formData.contactNumber.trim())
    if (!normalizedContactNumber) {
      setToast({
        show: true,
        message: 'Invalid contact number',
        color: 'danger'
      })
      setIsSubmitting(false)
      return
    }

    const claimVerification =
      scannedClaimer && sessionStatus?.status === 'scanned'
        ? {
            claim_verification_session_id:
              sessionStatus.claim_verification_session_id,
            verification_method: 'staff_qr' as const
          }
        : undefined

    const connected = await isConnected(8000)
    if (!connected) {
      setToast({
        show: true,
        message: 'Failed to claim item - no internet connection',
        color: 'danger'
      })
      setIsSubmitting(false)
      return
    }

    await submit(
      {
        foundPostId: postId,
        claimerName: claimerForSubmission.name,
        claimerEmail: claimerForSubmission.email,
        claimerContactNumber: formatLocalPhoneNumber(normalizedContactNumber),
        claimedAt: toISODate(date, time, meridian),
        posterName: post.is_anonymous ? 'Anonymous' : post.poster_name,
        staffId: user.user_id,
        staffName: user.user_name,
        missingPostId: lostItemPost ? lostItemPost.post_id : null,
        claimVerification,
        existingClaim,
        isOverwrite: true
      },
      message => {
        setToast({
          show: true,
          message,
          color: 'success'
        })
        setIsSubmitting(false)
        clearExistingClaim()
      },
      message => {
        setToast({
          show: true,
          message,
          color: 'danger'
        })
        setIsSubmitting(false)
      }
    )
  }

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
        submitTimeoutRef.current = null
      }
    }
  }, [])

  if (loading) {
    return <ClaimItemLoadingSkeleton />
  }

  if (!post) {
    return (
      <IonContent>
        <div className='fixed top-0 z-10 w-full'>
          <HeaderWithButtons
            loading={false}
            onCancel={() => navigate('/staff/post-records', 'back')}
            onSubmit={() => {}}
            withSubmit={false}
          />
        </div>
        <div className='ion-padding mt-15'>
          <div className='grid w-full place-items-center py-16'>
            <IonText color='danger' className='text-center'>
              <h2 className='mb-2 text-xl font-semibold'>
                {blockingMessage ? 'Post not ready for claim' : 'Post not found'}
              </h2>
              <p className='text-sm'>
                {blockingMessage ||
                  "The post you're looking for doesn't exist or cannot be claimed."}
              </p>
            </IonText>
            <IonButton
              className='mt-6'
              onClick={() => navigate('/staff/post-records', 'back')}
              style={{ '--background': 'var(--color-umak-blue)' }}
            >
              Go Back
            </IonButton>
          </div>
        </div>
      </IonContent>
    )
  }

  if (!claimSessionQuery.isLoading && claimVerificationError) {
    return (
      <IonContent>
        <div className='fixed top-0 z-10 w-full'>
          <HeaderWithButtons
            loading={false}
            onCancel={() => navigate('/staff/post-records', 'back')}
            onSubmit={() => {}}
            withSubmit={false}
          />
        </div>
        <div className='ion-padding mt-15'>
          <div className='grid w-full place-items-center py-16'>
            <IonText color='danger' className='text-center'>
              <h2 className='mb-2 text-xl font-semibold'>
                Claim session unavailable
              </h2>
              <p className='text-sm'>{claimVerificationError}</p>
            </IonText>
            <IonButton
              className='mt-6'
              onClick={() => navigate('/staff/post-records', 'back')}
              style={{ '--background': 'var(--color-umak-blue)' }}
            >
              Go Back
            </IonButton>
          </div>
        </div>
      </IonContent>
    )
  }

  return (
    <IonContent>
      <div className='fixed top-0 z-10 w-full'>
        <HeaderWithButtons
          loading={isProcessing || isSubmitting}
          onCancel={() => {
            if (hasUnsavedChanges) {
              setShowCancelModal(true)
            } else {
              navigate('/staff/post-records', 'back')
            }
          }}
          onSubmit={() => setShowConfirmModal(true)}
          withSubmit={true}
        />
      </div>

      <div className='ion-padding mt-15'>
        <CardHeader
          title='Process Claim'
          icon={checkmarkCircle}
          hasLineBelow
        />

        <div className='mb-6'>
          <FormSectionHeader header='Item to be Claimed' />
          <PostCard
            imgUrl={post.item_image_url || ''}
            title={post.item_name || 'Item'}
            description={post.item_description || ''}
            owner={
              post.is_anonymous ? 'Anonymous' : post.poster_name || 'Unknown'
            }
            owner_profile_picture_url={post.poster_profile_picture_url || null}
          />
        </div>

        <ClaimVerificationPanel
          isSessionLoading={isSessionLoading}
          isVerifying={isVerifyingClaimer}
          isScannerSupported={claimQrScanner.isSupported}
          joinedClaimer={joinedClaimer}
          sessionStatus={sessionStatus}
          manualQrSessionId={manualQrSessionId}
          manualQrSessionToken={manualQrSessionToken}
          scannerState={claimQrScanner.state}
          videoRef={claimQrScanner.videoRef}
          onCloseCamera={claimQrScanner.closeCamera}
          onManualQrSessionIdChange={setManualQrSessionId}
          onManualQrSessionTokenChange={setManualQrSessionToken}
          onOpenCamera={() => {
            void claimQrScanner.openCamera()
          }}
          onVerifyManualEntry={() => {
            void handleVerifyClaimQr({
              claimQrSessionId: manualQrSessionId,
              sessionToken: manualQrSessionToken
            })
          }}
        />

        {!scannedClaimer ? (
          <ClaimerEmailSearch
            searchText={searchText}
            onSearchChange={handleSearchChange}
            searchResults={results}
            searchLoading={searchLoading}
            searchError={searchError}
            onUserSelect={handleUserSelect}
          />
        ) : null}

        {selectedUser && !scannedClaimer ? (
          <SelectedUserCard user={selectedUser} onRemove={handleRemoveUser} />
        ) : null}

        <ClaimFormFields
          contactNumber={formData.contactNumber}
          onContactNumberChange={value =>
            handleFormChange('contactNumber', value)
          }
          dateTimeValue={toISODate(date, time, meridian)}
          onDateTimeChange={handleDateChange}
          maxDateTime={getPhilippineTimeISO()}
          itemId={formData.itemId}
          onItemIdChange={value => handleFormChange('itemId', value)}
          lostItemPost={lostItemPost}
          lostItemPostLoading={lostItemPostLoading}
          lostItemPostError={lostItemPostError}
        />

        <IonButton
          expand='block'
          className='mb-4 mt-6'
          style={{ '--background': 'var(--color-umak-blue)' }}
          onClick={() => setShowConfirmModal(true)}
          disabled={
            !claimerForSubmission ||
            !formData.contactNumber ||
            isProcessing ||
            isSubmitting ||
            isVerifyingClaimer ||
            !normalizeToLocal(formData.contactNumber) ||
            (!!formData.itemId && !lostItemPost) ||
            !sessionStatus?.claim_verification_session_id
          }
        >
          {isProcessing || isSubmitting ? (
            <>
              <IonSpinner name='crescent' className='mr-2' />
            </>
          ) : (
            'Complete Claim'
          )}
        </IonButton>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        heading='Complete claim?'
        subheading={
          claimerForSubmission
            ? `Are you sure you want to complete this claim for ${claimerForSubmission.name}?`
            : 'Are you sure you want to complete this claim?'
        }
        onSubmit={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
        submitLabel='Confirm'
        cancelLabel='Cancel'
      />

      <ConfirmationModal
        isOpen={showOverwriteModal}
        heading='Overwrite existing claim?'
        subheading={
          existingClaim
            ? `This item has already been claimed by ${
                existingClaim.claimer_name
              } (${existingClaim.claimer_school_email})${
                existingClaim.claimed_at
                  ? ` on ${new Date(existingClaim.claimed_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`
                  : ''
              }. Do you want to overwrite this claim?`
            : 'Do you want to overwrite the existing claim?'
        }
        onSubmit={handleOverwriteClaim}
        onCancel={() => {
          setShowOverwriteModal(false)
          clearExistingClaim()
        }}
        submitLabel='Overwrite'
        cancelLabel='Cancel'
      />

      <ConfirmationModal
        isOpen={showCancelModal}
        heading='Discard changes?'
        subheading='You have unsaved changes. Are you sure you want to discard them?'
        onSubmit={() => navigate('/staff/post-records', 'back')}
        onCancel={() => setShowCancelModal(false)}
        submitLabel='Discard'
        cancelLabel='Keep Editing'
      />

      <IonToast
        isOpen={toast.show}
        message={toast.message}
        duration={2000}
        color={toast.color}
        onDidDismiss={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </IonContent>
  )
}
