import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  IonContent,
  IonButton,
  IonText,
  IonToast,
  IonSpinner
} from '@ionic/react'
import { alertCircle, checkmarkCircle } from 'ionicons/icons'
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
import {
  initializeDateTimeState,
  toISODate,
  getPhilippineTimeISO
} from '@/shared/utils/dateTimeHelpers'
import { useClaimItemPostValidation } from '@/features/staff/hooks/useClaimItemPostValidation'
import { useClaimItemSubmit } from '@/features/staff/hooks/useClaimItemSubmit'
import { useExistingClaimCheck } from '@/features/staff/hooks/useExistingClaimCheck'

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

export default function ClaimItem () {
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()
  const { getUser } = useUser()

  // Initialize Philippine time
  const initialDateTime = initializeDateTimeState()

  // Post state
  const [post, setPost] = useState<PostRecordDetails | null>(null)
  const [loading, setLoading] = useState(true)

  // Lost item post validation hook
  const {
    lostItemPost,
    loading: lostItemPostLoading,
    error: lostItemPostError,
    validateAndFetchPost,
    clearPost
  } = useClaimItemPostValidation()

  // Email search state
  const [searchText, setSearchText] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null)
  const {
    results,
    loading: searchLoading,
    error: searchError,
    search,
    clearResults
  } = useStaffSearch()

  // Date/Time state
  const [date, setDate] = useState(initialDateTime.date)
  const [time, setTime] = useState(initialDateTime.time)
  const [meridian, setMeridian] = useState(initialDateTime.meridian)

  // Form state
  const [formData, setFormData] = useState<ClaimFormData>({
    contactNumber: '',
    itemId: ''
  })

  // Submit hook
  const { submit, isProcessing } = useClaimItemSubmit()

  // Existing claim check hook
  const { existingClaim, checkForExistingClaim, clearExistingClaim } =
    useExistingClaimCheck()

  // Toast/Modal state
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

  // Helpers for phone normalization/validation
  const normalizeToLocal = (input: string): string | null => {
    const digits = (input || '').replace(/[^0-9]/g, '')
    // +63XXXXXXXXXX (digits: 63 + 10) -> convert to 0 + 10 digits
    if (/^63\d{10}$/.test(digits)) {
      return '0' + digits.slice(2)
    }
    // 0XXXXXXXXXX (11 digits) or 9XXXXXXXXX (10 digits)
    if (/^0?9\d{9}$/.test(digits)) {
      if (digits.length === 10) return '0' + digits
      return digits
    }
    return null
  }

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true)
    }
  }, [selectedUser, formData])

  const loadPost = useCallback(async () => {
    if (!postId) {
      setToast({
        show: true,
        message: 'Invalid post ID',
        color: 'danger'
      })
      return
    }

    try {
      setLoading(true)

      // Check network connectivity with 8-second timeout
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

      // Only allow 'found' item types to be claimed
      if (fetchedPost.item_type !== 'found') {
        setToast({
          show: true,
          message: 'Only found items can be claimed',
          color: 'danger'
        })
        setPost(null)
        return
      }

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
    loadPost()
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

  // Handle user selection from search results
  const handleUserSelect = (user: any) => {
    console.log('Selected user:', user)
    console.log({
      id: user.user_id,
      name: user.user_name,
      email: user.email,
      image: user.profile_picture_url
    })
    setSelectedUser({
      id: user.user_id,
      name: user.user_name,
      email: user.email,
      image: user.profile_picture_url
    })
    setSearchText('')
    clearResults()
  }

  // Handle remove selected user
  const handleRemoveUser = () => {
    setSelectedUser(null)
    setSearchText('')
    clearResults()
  }

  // Handle date/time change
  const handleDateChange = (iso: string) => {
    if (!iso) return
    const d = new Date(iso)
    const formattedDate = d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Manila'
    })
    let hours = d.getHours()
    const mins = d.getMinutes().toString().padStart(2, '0')
    const mer = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    setDate(formattedDate)
    setTime(`${hours}:${mins}`)
    setMeridian(mer as 'AM' | 'PM')
  }

  // Handle form input changes
  const handleFormChange = async (
    field: keyof ClaimFormData,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // If updating itemId, validate and fetch the post
    if (field === 'itemId' && value.trim()) {
      await validateAndFetchPost(value)
    } else if (field === 'itemId' && !value.trim()) {
      // Clear the lost item post if item ID is removed
      clearPost()
    }
  }

  // Handle submit (debounced)
  const handleSubmit = async () => {
    // Close modal immediately for user feedback
    setShowConfirmModal(false)
    // Set submitting state to show spinner on buttons
    setIsSubmitting(true)

    // Clear existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
    submitTimeoutRef.current = setTimeout(async () => {
      const user = await getUser()
      console.log('Submitting claim for post ID:', postId)
      console.log(selectedUser)
      console.log(post)
      console.log(user)
      if (!postId || !selectedUser || !post || !user) return
      // Validate Philippine contact number (accept multiple common formats)
      const normalizeToLocal = (input: string): string | null => {
        const digits = (input || '').replace(/[^0-9]/g, '')
        // +63XXXXXXXXXX -> 63 + 10 digits => convert to 0 + 10 digits => 11 digits
        if (/^63\d{10}$/.test(digits)) {
          return '0' + digits.slice(2)
        }
        // 0XXXXXXXXXX (11 digits) already local
        if (/^0?9\d{9}$/.test(digits)) {
          // if starts with 9 and length 10, prepend 0
          if (digits.length === 10) return '0' + digits
          return digits
        }
        return null
      }

      const formatLocal = (local: string) => {
        // Expect local like 09123456789 (11 chars). Format as 0912 345 6789 (4-3-4)
        if (!local) return local
        if (local.length === 11) {
          return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
        }
        return local
      }

      const normalized = normalizeToLocal(formData.contactNumber.trim())
      if (!normalized) {
        setToast({
          show: true,
          message:
            'Please enter a valid Philippine mobile number (examples: 09123456789, 0912 345 6789, +639123456789, +63 912-345-6789)',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }
      const formattedNumber = formatLocal(normalized)

      // If an itemId was provided ensure we found a matching lost item before updating its status
      if (formData.itemId?.trim() && !lostItemPost) {
        setToast({
          show: true,
          message: 'Referenced lost item not found. Please verify the Item ID.',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      // Check claim_table for existing claim on this item
      let itemIdToCheck: string | null = null

      try {
        const latestFound = await getPostFull(postId as string)
        if (!latestFound) {
          setToast({ show: true, message: 'Post not found', color: 'danger' })
          setIsSubmitting(false)
          return
        }

        itemIdToCheck = latestFound.item_id
      } catch (err) {
        console.error('Error fetching post details:', err)
        setToast({
          show: true,
          message: 'Failed to verify post status',
          color: 'danger'
        })
        setIsSubmitting(false)
        return
      }

      // Check if item already has a claim in claim_table
      if (itemIdToCheck) {
        const existingClaimData = await checkForExistingClaim(itemIdToCheck)

        if (existingClaimData) {
          // Show overwrite confirmation modal
          setIsSubmitting(false)
          setShowOverwriteModal(true)
          return
        }
      }
      if (lostItemPost && lostItemPost.post_id) {
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
        } catch (err) {
          console.error('Error verifying missing post status:', err)
          setToast({
            show: true,
            message: 'Failed to verify linked lost item',
            color: 'danger'
          })
          setIsSubmitting(false)
          return
        }
      }
      // Check network connectivity before submitting
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
          claimerName: selectedUser.name,
          claimerEmail: selectedUser.email,
          claimerContactNumber: formattedNumber,
          posterName: post.is_anonymous ? 'Anonymous' : post.poster_name,
          staffId: user.user_id,
          staffName: user.user_name,
          missingPostId: lostItemPost ? lostItemPost.post_id : null,
          existingClaim: existingClaim,
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

      // clear ref after run
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
        submitTimeoutRef.current = null
      }
    }, 500)
  }

  // Handle overwrite confirmation
  const handleOverwriteClaim = async () => {
    // Close modal immediately for user feedback
    setShowOverwriteModal(false)
    // Set submitting state to show spinner on buttons
    setIsSubmitting(true)

    const user = await getUser()
    if (!postId || !selectedUser || !post || !user) return

    const normalized = normalizeToLocal(formData.contactNumber.trim())
    if (!normalized) {
      setToast({
        show: true,
        message: 'Invalid contact number',
        color: 'danger'
      })
      setIsSubmitting(false)
      return
    }

    const formatLocal = (local: string) => {
      if (!local) return local
      if (local.length === 11) {
        return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
      }
      return local
    }
    const formattedNumber = formatLocal(normalized)

    // Check network connectivity with timeout
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
        claimerName: selectedUser.name,
        claimerEmail: selectedUser.email,
        claimerContactNumber: formattedNumber,
        posterName: post.is_anonymous ? 'Anonymous' : post.poster_name,
        staffId: user.user_id,
        staffName: user.user_name,
        missingPostId: lostItemPost ? lostItemPost.post_id : null,
        existingClaim: existingClaim,
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
        <div className='fixed w-full top-0 z-10'>
          <HeaderWithButtons
            loading={false}
            onCancel={() => navigate('/staff/post-records', 'back')}
            onSubmit={() => {}}
            withSubmit={false}
          />
        </div>
        <div className='ion-padding mt-15'>
          <div className='w-full grid place-items-center py-16'>
            <IonText color='danger' className='text-center'>
              <h2 className='text-xl font-semibold mb-2'>Post not found</h2>
              <p className='text-sm'>
                The post you're looking for doesn't exist or cannot be claimed.
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

  return (
    <IonContent>
      <div className='fixed w-full top-0 z-10'>
        <HeaderWithButtons
          loading={isProcessing || isSubmitting}
          onCancel={() => {
            console.log(hasUnsavedChanges)
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
          title='Confirm Claim Status'
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

        {/* Claimer Email Field */}
        <ClaimerEmailSearch
          searchText={searchText}
          onSearchChange={handleSearchChange}
          searchResults={results}
          searchLoading={searchLoading}
          searchError={searchError}
          onUserSelect={handleUserSelect}
        />

        {/* Selected User Card */}
        {selectedUser && (
          <SelectedUserCard user={selectedUser} onRemove={handleRemoveUser} />
        )}

        {/* Claim Form Fields */}
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

        {/* Submit Button */}
        <IonButton
          expand='block'
          className='mt-6 mb-4'
          style={{ '--background': 'var(--color-umak-blue)' }}
          onClick={() => setShowConfirmModal(true)}
          disabled={
            !selectedUser ||
            !formData.contactNumber ||
            isProcessing ||
            isSubmitting ||
            // disable if contact format clearly invalid (use normalization)
            !normalizeToLocal(formData.contactNumber) ||
            // if an item ID is entered but no matching lost post found, disable
            (!!formData.itemId && !lostItemPost)
          }
        >
          {isProcessing || isSubmitting ? (
            <>
              <IonSpinner name='crescent' className='mr-2' />
            </>
          ) : (
            'Claim Item'
          )}
        </IonButton>
      </div>

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        heading='Confirm claim?'
        subheading='Are you sure you want to claim this item?'
        onSubmit={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
        submitLabel='Confirm'
        cancelLabel='Cancel'
      />

      {/* Overwrite Claim Confirmation Modal */}
      <ConfirmationModal
        isOpen={showOverwriteModal}
        heading='Overwrite existing claim?'
        subheading={
          existingClaim
            ? `This item has been already claimed by ${
                existingClaim.claimer_name
              } (${existingClaim.claimer_school_email}) on ${new Date(
                existingClaim.claimed_at
              ).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}. Do you want to overwrite this claim?`
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

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        heading='Discard changes?'
        subheading='You have unsaved changes. Are you sure you want to discard them?'
        onSubmit={() => {
          setShowCancelModal(false)
          navigate('/staff/post-records', 'back')
        }}
        onCancel={() => setShowCancelModal(false)}
        submitLabel='Discard'
        cancelLabel='Keep editing'
      />

      {/* Toast */}
      <IonToast
        isOpen={toast.show}
        onDidDismiss={() => setToast(prev => ({ ...prev, show: false }))}
        message={toast.message}
        duration={3000}
        position='top'
        color={toast.color}
        icon={toast.color === 'success' ? checkmarkCircle : alertCircle}
      />
    </IonContent>
  )
}
