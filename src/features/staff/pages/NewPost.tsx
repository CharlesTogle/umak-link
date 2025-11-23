import { useState, useRef } from 'react'
import { IonContent, IonIcon, IonButton, IonSpinner } from '@ionic/react'
import { useIonViewWillLeave } from '@ionic/react'
import ImageUpload from '@/shared/components/ImageUpload'
import FormSectionHeader from '@/shared/components/FormSectionHeader'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import LocationDetailsSelector from '@/features/user/components/shared/LocationDetailsSelector'
import DateTimeSelector from '@/shared/components/DateTimeSelector'
import { HeaderWithButtons } from '@/shared/components/HeaderVariants'
import { create, informationCircle } from 'ionicons/icons'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { IonToast } from '@ionic/react'
import { usePostActionsStaffServices } from '../hooks/usePostStaffServices'
import CategorySelection from '@/features/user/components/shared/CategorySelection'
import CategorySelectionTrigger from '@/features/user/components/shared/CategorySelectionTrigger'
import TextArea from '@/shared/components/TextArea'
import { isConnected } from '@/shared/utils/networkCheck'
import { generateAndAutofillFields } from '@/features/user/utils/aiAutofill'
import {
  initializeDateTimeState,
  toISODate
} from '@/shared/utils/dateTimeHelpers'
import { useUser } from '@/features/auth/contexts/UserContext'

/** ---------- Component ---------- */
export default function NewPost () {
  // Initialize Philippine time
  const initialDateTime = initializeDateTimeState()

  // state
  const [errorMessage, setErrorMessage] = useState('') // for error message
  const [showToast, setShowToast] = useState(false)
  const [toastColor, setToastColor] = useState<'danger' | 'success'>('danger')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(initialDateTime.date)
  const [time, setTime] = useState(initialDateTime.time)
  const [meridian, setMeridian] = useState(initialDateTime.meridian)
  const [image, setImage] = useState<File | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [showCategorySheet, setShowCategorySheet] = useState(false)
  const [locationDetails, setLocationDetails] = useState({
    level1: '',
    level2: '',
    level3: ''
  })
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [showAiConfirmModal, setShowAiConfirmModal] = useState(false)
  const [aiGeneratedContent, setAiGeneratedContent] = useState<{
    itemName?: string
    itemDescription?: string
    itemCategory?: string
  } | null>(null)
  const { navigate } = useNavigation()
  const { createPost } = usePostActionsStaffServices()
  const { user } = useUser()
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false)
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Helper to check if form has unsaved changes
  const hasUnsavedChanges = () => {
    return (
      title.trim() !== '' ||
      desc.trim() !== '' ||
      image !== null ||
      category !== null ||
      locationDetails.level1.trim() !== '' ||
      locationDetails.level2.trim() !== '' ||
      locationDetails.level3.trim() !== ''
    )
  }

  // Detect when user tries to leave the page
  useIonViewWillLeave(() => {
    if (hasUnsavedChanges() && !loading && !showFinalizeModal) {
      setShowLeaveConfirmModal(true)
    }
  })

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

  const handleCancel = () => {
    setShowCancelModal(true)
  }

  /**
   * UI handler: Handle image upload and trigger AI autofill
   */
  const handleImageChange = async (file: File | null) => {
    setImage(file)

    // Guard: only trigger AI generation if image is uploaded (not null/removed)
    if (!file) return

    // Set generating state
    setAiGenerating(true)

    try {
      // Trigger AI generation - always generate regardless of field state
      const result = await generateAndAutofillFields({
        imageFile: file,
        currentTitle: '',
        currentDesc: '',
        currentCategory: null
      })

      // Handle rate limit
      if (result.rateLimitExceeded) {
        setErrorMessage('Autogeneration is limited to 10 times per 5 minutes. Try again at a later time.')
        setToastColor('danger')
        setShowToast(true)
        return
      }

      // Handle success
      if (result.success && result.content) {
        // Store generated content and show confirmation modal
        setAiGeneratedContent(result.content)
        setShowAiConfirmModal(true)
        return
      }

      // Handle failure
      if (!result.success) {
        if (result.error === 'ai_timeout') {
          setErrorMessage(
            'AI autofill took too long. Please fill in the fields manually.'
          )
        } else {
          setErrorMessage(
            'AI autofill failed. Please fill in the fields manually.'
          )
        }
        setToastColor('danger')
        setShowToast(true)
      }
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAiConfirm = () => {
    if (aiGeneratedContent) {
      if (aiGeneratedContent.itemName) setTitle(aiGeneratedContent.itemName)
      if (aiGeneratedContent.itemDescription)
        setDesc(aiGeneratedContent.itemDescription)
      if (aiGeneratedContent.itemCategory)
        setCategory(aiGeneratedContent.itemCategory)
    }
    setShowAiConfirmModal(false)
    setAiGeneratedContent(null)
  }

  const handleAiCancel = () => {
    setShowAiConfirmModal(false)
    setAiGeneratedContent(null)
  }

  const handleSubmit = async () => {
    // Clear any existing timeout (debounce)
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }

    // Debounce the submit action
    submitTimeoutRef.current = setTimeout(async () => {
      if (loading) return

      setLoading(true)

      // Trim text inputs
      const titleTrimmed = title.trim()
      const descTrimmed = desc.trim()

      // Validate required fields
      if (
        !titleTrimmed ||
        !descTrimmed ||
        !image ||
        !category ||
        !locationDetails.level1.trim() ||
        !locationDetails.level2.trim() ||
        !locationDetails.level3.trim() ||
        !date ||
        !time ||
        !meridian
      ) {
        setErrorMessage('Please fill in all required fields.')
        setToastColor('danger')
        setShowToast(true)
        setLoading(false)
        return
      }

      // Check if user is available
      if (!user?.user_id) {
        setErrorMessage('User not authenticated')
        setToastColor('danger')
        setShowToast(true)
        setLoading(false)
        return
      }

      // Check network connectivity
      const connected = await isConnected()
      if (!connected) {
        setErrorMessage(
          'Failed to create new post - device not connected to the internet'
        )
        setToastColor('danger')
        setShowToast(true)
        setLoading(false)
        return
      }

      try {
        const payload = {
          anonymous: false, // Staff posts are never anonymous
          item: {
            title: titleTrimmed,
            desc: descTrimmed,
            type: 'found' as const // Staff posts are always 'found'
          },
          category: category as any,
          lastSeenISO: toISODate(date, time, meridian),
          locationDetails: {
            level1: locationDetails.level1.trim(),
            level2: locationDetails.level2.trim(),
            level3: locationDetails.level3.trim()
          },
          image: image
        }

        console.log('Submitting Staff Post:', payload)

        const result = await createPost(payload)

        if (result.error || !result.post) {
          setErrorMessage(result.error || 'Failed to create post')
          setToastColor('danger')
          setShowToast(true)
          setLoading(false)
          return
        }

        // Success
        setErrorMessage('Post created successfully!')
        setToastColor('success')
        setShowToast(true)
        setLoading(false)

        // Navigate after a brief delay to show the toast
        setTimeout(() => {
          navigate('/staff/post-records')
        }, 1000)
      } catch (error) {
        console.error('Error creating post:', error)
        setErrorMessage('Failed to create post')
        setToastColor('danger')
        setShowToast(true)
        setLoading(false)
      }
    }, 300) // 300ms debounce
  }

  return (
    <IonContent>
      <HeaderWithButtons
        loading={loading}
        onCancel={() => handleCancel()}
        onSubmit={() => setShowFinalizeModal(true)}
      />
      <div className=' bg-gray-50 mb-5 w-full font-default-font'>
        <div className='mt-3 shadow-md p-4 border border-gray-200'>
          <div className='flex items-center space-x-2'>
            <IonIcon
              icon={create}
              className='text-[#1e2b87]'
              style={{ fontSize: '32px', ['--ionicon-stroke-width']: '40px' }}
            />
            <div className='text-umak-blue font-default-font text-base font-normal'>
              New Post
            </div>
          </div>
          <div className='w-full h-px bg-slate-900 my-3' />
          <div>
            <div className='mb-4'>
              <ImageUpload
                label='Image'
                image={image}
                onImageChange={handleImageChange}
                isRequired={true}
              />
            </div>
            <div className='flex items-start gap-2 p-2 bg-blue-100 mb-4 -mt-4 rounded-md'>
              <IonIcon
                icon={informationCircle}
                className='text-umak-blue text-lg mt-0.5 flex-shrink-0'
              />
              <div className='text-sm text-gray-700'>
                <span className='font-medium'>Tip:</span> Uploading an image
                will automatically generate content for title, description, and
                category using AI.
              </div>
            </div>
            {/* ITEM NAME */}
            <div className='mb-4'>
              <FormSectionHeader header='Item Name/Title' isRequired />
              <input
                type='text'
                className='border-2 border-black rounded-xs py-1 px-2 w-full focus:border-2-umak-blue focus:outline-none font-default-font text-base'
                value={title}
                placeholder='Max 32 characters'
                maxLength={32}
                onChange={e => setTitle(e.target.value)}
                disabled={aiGenerating}
                required
              />
            </div>

            <div className='mb-4'>
              <FormSectionHeader header='Description' />
              <TextArea
                value={desc}
                setValue={setDesc}
                maxLength={150}
                placeholder='Provide additional details about the item (e.g., color, brand, unique features). Max 150 characters.'
                disabled={aiGenerating}
              />
            </div>
            <div className='mb-4'>
              <FormSectionHeader header='Category' isRequired />
              <div>
                <CategorySelectionTrigger
                  category={category}
                  onOpenSelector={() => setShowCategorySheet(true)}
                  onClear={() => setCategory(null)}
                />
              </div>
            </div>
            <DateTimeSelector
              dateTimeButtonClassName='date-time-last-seen'
              header='Last Seen'
              isRequired={true}
              datetimeId='last-seen-datetime'
              value={toISODate(date, time, meridian)}
              onChange={handleDateChange}
              max={new Date().toISOString()}
            />
            <LocationDetailsSelector
              locationDetails={locationDetails}
              setLocationDetails={setLocationDetails}
              isRequired={true}
            />
            <div className='rounded-md overflow-hidden'>
              <IonButton
                style={{ '--background': 'var(--color-umak-blue)' }}
                expand='full'
                onClick={() => setShowFinalizeModal(true)}
                disabled={loading || aiGenerating}
              >
                {loading || aiGenerating ? (
                  <IonSpinner name='crescent' />
                ) : (
                  'Submit'
                )}
              </IonButton>
            </div>
          </div>
        </div>
      </div>

      {/* Finalize Submit Modal */}
      <ConfirmationModal
        isOpen={showFinalizeModal}
        heading='Finalize and submit report?'
        subheading='Once submitted, your report will be posted immediately.'
        onSubmit={() => {
          setShowFinalizeModal(false)
          void handleSubmit()
        }}
        onCancel={() => setShowFinalizeModal(false)}
        submitLabel='Upload report'
        cancelLabel='Continue editing'
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        heading='Discard post?'
        subheading='You have unsaved changes. Are you sure you want to discard this post?'
        onSubmit={() => {
          setShowCancelModal(false)
          navigate('/staff/post-records')
        }}
        onCancel={() => setShowCancelModal(false)}
        submitLabel='Discard'
        cancelLabel='Keep editing'
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={errorMessage}
        duration={2000}
        color={toastColor}
        position='bottom'
      />

      {/* Leave Confirmation Modal - triggered by native back or navigation away */}
      <ConfirmationModal
        isOpen={showLeaveConfirmModal}
        heading='Discard changes?'
        subheading='You have unsaved changes. Are you sure you want to leave without saving?'
        onSubmit={() => {
          setShowLeaveConfirmModal(false)
          navigate('/staff/post-records')
        }}
        onCancel={() => setShowLeaveConfirmModal(false)}
        submitLabel='Discard'
        cancelLabel='Keep editing'
      />
      <CategorySelection
        isOpen={showCategorySheet}
        selected={category}
        onClose={() => setShowCategorySheet(false)}
        onSelect={c => {
          setCategory(c)
          setShowCategorySheet(false)
        }}
      />

      {/* AI generating overlay */}
      {aiGenerating && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50'>
          <div className='bg-white rounded-md p-6 flex flex-col items-center'>
            <IonSpinner name='crescent' />
            <div className='mt-3 text-base font-medium text-gray-800'>
              Generating suggestions…
            </div>
            <div className='mt-1 text-sm text-gray-600'>
              This may take a few seconds.
            </div>
          </div>
        </div>
      )}

      {/* AI Confirmation Popover */}
      {showAiConfirmModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          onClick={handleAiCancel}
        >
          <div
            className='bg-white rounded-lg shadow-xl max-w-md w-11/12 mx-4 overflow-hidden'
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className='bg-umak-blue text-white p-4 flex items-center justify-center'>
              <IonIcon icon={informationCircle} className='text-2xl mr-2' />
              <div className='text-lg font-semibold'>Generated Content</div>
            </div>

            {/* Content */}
            <div className='p-4 space-y-4 max-h-96 overflow-y-auto'>
              {aiGeneratedContent?.itemName && (
                <div>
                  <div className='font-semibold text-sm text-gray-700 mb-1'>
                    Item Name:
                  </div>
                  <div className='text-base text-gray-900 bg-gray-50 p-2 rounded border border-gray-200'>
                    {aiGeneratedContent.itemName}
                  </div>
                </div>
              )}
              {aiGeneratedContent?.itemDescription && (
                <div>
                  <div className='font-semibold text-sm text-gray-700 mb-1'>
                    Description:
                  </div>
                  <div className='text-base text-gray-900 bg-gray-50 p-2 rounded border border-gray-200'>
                    {aiGeneratedContent.itemDescription}
                  </div>
                </div>
              )}
              {aiGeneratedContent?.itemCategory && (
                <div>
                  <div className='font-semibold text-sm text-gray-700 mb-1'>
                    Category:
                  </div>
                  <div className='text-base text-gray-900 bg-gray-50 p-2 rounded border border-gray-200'>
                    {aiGeneratedContent.itemCategory}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='flex border-t border-gray-200 py-4'>
              <button
                onClick={handleAiCancel}
                className='flex-1 py-3 text-center font-medium text-gray-600 hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <div className='w-px bg-gray-200' />
              <button
                onClick={handleAiConfirm}
                className='flex-1 py-3 text-center font-medium text-umak-blue hover:bg-blue-50 transition-colors'
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </IonContent>
  )
}
