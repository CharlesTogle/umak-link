import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { IonContent, IonButton, IonText, IonToast } from '@ionic/react'
import { alertCircle, checkmarkCircle } from 'ionicons/icons'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useUser } from '@/features/auth/contexts/UserContext'
import CardHeader from '@/shared/components/CardHeader'
import FormSectionHeader from '@/shared/components/FormSectionHeader'
import { HeaderWithButtons } from '@/shared/components/HeaderVariants'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import PostCard from '@/features/posts/components/PostCard'
import { getPost } from '@/features/posts/data/posts'
import type { PublicPost } from '@/features/posts/types/post'
import { useStaffSearch } from '@/features/admin/hooks/useStaffSearch'
import { Network } from '@capacitor/network'
import ClaimerEmailSearch from '@/features/staff/components/claim-item/ClaimerEmailSearch'
import SelectedUserCard from '@/features/staff/components/claim-item/SelectedUserCard'
import ClaimFormFields from '@/features/staff/components/claim-item/ClaimFormFields'
import ClaimItemLoadingSkeleton from '@/features/staff/components/claim-item/ClaimItemLoadingSkeleton'
import {
  initializeDateTimeState,
  toISODate
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
  lostItemPostLink: string
}

export default function ClaimItem () {
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()
  const { user } = useUser()

  // Initialize Philippine time
  const initialDateTime = initializeDateTimeState()

  // Post state
  const [post, setPost] = useState<PublicPost | null>(null)
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
    lostItemPostLink: ''
  })

  // Submit hook
  const { submit, isProcessing } = useClaimItemSubmit()

  // Toast/Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    color: string
  }>({
    show: false,
    message: '',
    color: 'success'
  })

  // Load post on mount

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
      const status = await Network.getStatus()
      if (!status.connected) {
        setToast({
          show: true,
          message: 'No internet connection. Please check your network.',
          color: 'danger'
        })
        setLoading(false)
        return
      }

      const fetchedPost = await getPost(postId)
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

    // If updating lostItemPostLink, extract and fetch the post
    if (field === 'lostItemPostLink' && value.trim()) {
      await validateAndFetchPost(value)
    } else if (field === 'lostItemPostLink' && !value.trim()) {
      // Clear the lost item post if link is removed
      clearPost()
    }
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!postId || !selectedUser || !post || !user) return

    await submit(
      {
        postId,
        selectedUser,
        contactNumber: formData.contactNumber,
        post,
        currentUser: {
          user_id: user.user_id,
          user_name: user.user_name
        },
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
      <HeaderWithButtons
        loading={isProcessing}
        onCancel={() => navigate('/staff/post-records', 'back')}
        onSubmit={() => setShowConfirmModal(true)}
        withSubmit={true}
      />

      <div className='ion-padding'>
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
            owner={post.is_anonymous ? 'Anonymous' : post.username || 'Unknown'}
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
          maxDateTime={new Date().toISOString()}
          lostItemPostLink={formData.lostItemPostLink}
          onLostItemPostLinkChange={value =>
            handleFormChange('lostItemPostLink', value)
          }
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
          {isProcessing ? 'Processing...' : 'Claim Item'}
        </IonButton>
      </div>

      {/* Confirmation Modal */}
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
