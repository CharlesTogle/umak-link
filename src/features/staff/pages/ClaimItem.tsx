import { useState, useEffect, useCallback } from 'react'
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

  // Toast/Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
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

      // Check network connectivity
      const connected = await isConnected()
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

  // Handle submit
  const handleSubmit = async () => {
    const user = await getUser()
    console.log('Submitting claim for post ID:', postId)
    console.log(selectedUser)
    console.log(post)
    console.log(user)
    if (!postId || !selectedUser || !post || !user) return
    // Check network connectivity before submitting
    const connected = await isConnected()
    if (!connected) {
      setToast({
        show: true,
        message: 'Failed to claim item - no internet connection',
        color: 'danger'
      })
      setShowConfirmModal(false)
      return
    }

    await submit(
      {
        foundPostId: postId,
        claimerName: selectedUser.name,
        claimerEmail: selectedUser.email,
        claimerContactNumber: formData.contactNumber,
        posterName: post.is_anonymous ? 'Anonymous' : post.poster_name,
        posterUserId: post.poster_id,
        itemType: post.item_type,
        staffId: user.user_id,
        staffName: user.user_name,
        missingPostId: lostItemPost?.post_id || null
      },
      message => {
        setToast({
          show: true,
          message,
          color: 'success'
        })
        setShowConfirmModal(false)
      },
      message => {
        setToast({
          show: true,
          message,
          color: 'danger'
        })
      }
    )
  }

  if (loading) {
    return <ClaimItemLoadingSkeleton />
  }

  if (!post) {
    return (
      <IonContent>
        <div className='w-full grid place-items-center py-16'>
          <IonText color='danger'>Post not found</IonText>
        </div>
      </IonContent>
    )
  }

  return (
    <IonContent>
      <div className='fixed w-full top-0 z-10'>
        <HeaderWithButtons
          loading={isProcessing}
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
          disabled={!selectedUser || !formData.contactNumber || isProcessing}
        >
          {isProcessing ? (
            <>
              <IonSpinner name='crescent' className='mr-2' />
              Processing...
            </>
          ) : (
            'Claim Item'
          )}
        </IonButton>
      </div>

      {/* Submit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        heading='Confirm Claim?'
        subheading={`Are you sure you want to claim this item${
          post.item_type === 'lost' ? ' and notify the owner?' : '?'
        }`}
        onSubmit={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
        submitLabel='Claim Item'
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
