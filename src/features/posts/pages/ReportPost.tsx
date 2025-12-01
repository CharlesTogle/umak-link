import {
  IonCard,
  IonCardContent,
  IonButton,
  IonContent,
  IonSpinner,
  IonToast
} from '@ionic/react'
import { useIonViewWillLeave } from '@ionic/react'
import CardHeader from '@/shared/components/CardHeader'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import { informationCircle } from 'ionicons/icons'
import { useParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { getPost } from '../data/posts'
import type { PublicPost } from '../types/post'
import { useEffect, useState, useRef } from 'react'
import ReportContents from '../components/ReportContents'
import ReportPostSkeleton from '../components/ReportPostSkeleton'
import { usePostActions } from '@/features/user/hooks/usePostActions'
import { Network } from '@capacitor/network'
import { useNavigation } from '@/shared/hooks/useNavigation'
import useNotifications from '@/features/user/hooks/useNotifications'
import { useUser } from '@/features/auth/contexts/UserContext'
import { HeaderWithButtons } from '@/shared/components/HeaderVariants'

export default function ReportPost () {
  const [post, setPost] = useState<PublicPost | null | undefined>(undefined)
  const [concern, setConcern] = useState<string>('')
  const [additionalDetails, setAdditionalDetails] = useState<string>('')
  const [image, setImage] = useState<File | null>(null)
  const [customConcernText, setCustomConcernText] = useState('')
  const [reviewed, setReviewed] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastColor, setToastColor] = useState<'danger' | 'success'>('danger')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDuplicateWarningModal, setShowDuplicateWarningModal] =
    useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<
    (() => Promise<any>) | null
  >(null)
  const { reportPost } = usePostActions()
  const { getUser } = useUser()
  const { sendNotification } = useNotifications()
  const { postId } = useParams<{ postId: string }>()
  const { navigate } = useNavigation()
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false)
  const submitDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const getCurrentPost = async () => {
      if (!postId) return

      const fetchedPost = await getPost(postId as string)
      setPost(fetchedPost)
    }
    getCurrentPost()
  }, [postId])

  const hasUnsavedChanges = () => {
    return (
      concern.trim() !== '' ||
      additionalDetails.trim() !== '' ||
      image !== null ||
      customConcernText.trim() !== ''
    )
  }

  // Detect when user tries to leave the page
  useIonViewWillLeave(() => {
    if (hasUnsavedChanges() && !submitting) {
      setShowCancelModal(true)
    }
  })

  if (post === null) {
    return <div>No post found.</div>
  }

  const handleSubmitReport = async () => {
    setShowSubmitConfirmModal(true)
  }

  const performSubmitReport = async () => {
    if (!postId || submitting) return

    // Validate required fields
    if (!concern || (concern === 'Others' && !customConcernText.trim())) {
      setToastMessage('Please select a concern')
      setToastColor('danger')
      setShowToast(true)
      return
    }

    if (!reviewed) {
      setToastMessage('Please review and confirm the details')
      setToastColor('danger')
      setShowToast(true)
      return
    }

    // Check network connectivity
    const status = await Network.getStatus()
    if (status.connected === false) {
      setToastMessage('You are not connected to the internet')
      setToastColor('danger')
      setShowToast(true)
      return
    }

    setSubmitting(true)

    try {
      const user = await getUser()
      if (!user) {
        setToastMessage('User not authenticated')
        setToastColor('danger')
        setShowToast(true)
        setSubmitting(false)
        return
      }

      const result = await reportPost({
        postId,
        concern: concern === 'Others' ? customConcernText : concern,
        additionalDetails,
        proofImage: image,
        claimerName: post?.claimed_by_name,
        claimerEmail: post?.claimed_by_email,
        claimerContact: post?.claimed_by_contact,
        claimedAt: post?.claimed_at,
        claimProcessedByStaffId: post?.claim_processed_by_staff_id,
        claimId: post?.claim_id
      })

      // Handle duplicate self - block submission
      if (result.hasDuplicateSelf) {
        setToastMessage(
          'You have already reported this item. Please wait for staff to review your previous report.'
        )
        setToastColor('danger')
        setShowToast(true)
        setSubmitting(false)
        return
      }

      // Handle duplicate others - show warning modal
      if (result.hasDuplicateOthers && result.submit) {
        setPendingSubmit(() => result.submit)
        setShowDuplicateWarningModal(true)
        setSubmitting(false)
        return
      }

      // No duplicates, proceed with submission
      if (result.submit) {
        const submitResult = await result.submit()

        if (submitResult.error) {
          setToastMessage(submitResult.error)
          setToastColor('danger')
          setShowToast(true)
          setSubmitting(false)
          return
        }

        // Send notification to self
        sendNotification({
          title: 'Report Submitted',
          message: `Greetings! Your report for post "${post?.item_name}" has been submitted successfully. Thank you for helping us keep the community safe.`,
          type: 'progress',
          userId: user.user_id
        })
        // Success
        setToastMessage('Report submitted successfully!')
        setToastColor('success')
        setShowToast(true)

        // Navigate after a brief delay
        setTimeout(() => {
          navigate('/user/home')
        }, 1500)
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      setToastMessage('Failed to submit report')
      setToastColor('danger')
      setShowToast(true)
      setSubmitting(false)
    }
  }

  const handleDuplicateWarningProceed = async () => {
    setShowDuplicateWarningModal(false)

    if (!pendingSubmit) return

    // Debounce duplicate-submit action to avoid accidental double submits
    setSubmitting(true)
    if (submitDebounceRef.current) clearTimeout(submitDebounceRef.current)
    submitDebounceRef.current = setTimeout(async () => {
      try {
        const user = await getUser()
        if (!user) {
          setToastMessage('User not authenticated')
          setToastColor('danger')
          setShowToast(true)
          setSubmitting(false)
          setPendingSubmit(null)
          return
        }

        const result = await pendingSubmit()

        if (result.error) {
          setToastMessage(result.error)
          setToastColor('danger')
          setShowToast(true)
          setSubmitting(false)
          setPendingSubmit(null)
          return
        }

        // Send notification to self
        sendNotification({
          title: 'Report Submitted',
          message: `Greetings! Your report for post "${post?.item_name}" has been submitted successfully. Thank you for helping us keep the community safe.`,
          type: 'progress',
          userId: user.user_id
        })
        // Success
        setToastMessage('Report submitted successfully!')
        setToastColor('success')
        setShowToast(true)

        // Navigate after a brief delay
        setTimeout(() => {
          navigate('/user/home')
        }, 1500)
      } catch (error) {
        console.error('Error submitting report:', error)
        setToastMessage('Failed to submit report')
        setToastColor('danger')
        setShowToast(true)
        setSubmitting(false)
      } finally {
        setPendingSubmit(null)
      }
    }, 500)
  }

  const handleDuplicateWarningCancel = () => {
    setShowDuplicateWarningModal(false)
    setPendingSubmit(null)
  }

  const handleCancel = () => {
    setShowCancelModal(true)
  }

  useEffect(() => {
    return () => {
      if (submitDebounceRef.current) clearTimeout(submitDebounceRef.current)
    }
  }, [])

  return (
    <IonContent>
      {post === undefined ? (
        <ReportPostSkeleton />
      ) : (
        <>
          <div className='fixed w-full z-10'>
            <HeaderWithButtons
              loading={submitting}
              onCancel={() => handleCancel()}
              onSubmit={() => handleSubmitReport()}
            />
          </div>
          <IonCard className='mt-16'>
            <IonCardContent>
              <CardHeader
                title='Fraud Report'
                icon={informationCircle}
              ></CardHeader>
              <PostCard
                imgUrl={post?.item_image_url ?? ''}
                title={post?.item_name ?? ''}
                description={post?.item_description ?? ''}
                owner={post?.is_anonymous ? 'Anonymous' : post?.username ?? ''}
              />
              <ReportContents
                additionalDetails={additionalDetails}
                concern={concern}
                image={image}
                setAdditionalDetails={setAdditionalDetails}
                setConcern={setConcern}
                setImage={setImage}
                customConcernText={customConcernText}
                setCustomConcernText={setCustomConcernText}
                reviewed={reviewed}
                setReviewed={setReviewed}
              />
              <IonButton
                className='w-full'
                style={{
                  '--background': 'var(--color-umak-blue)'
                }}
                onClick={handleSubmitReport}
                disabled={submitting}
              >
                {submitting ? <IonSpinner name='crescent' /> : 'Submit'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMessage}
            duration={3000}
            color={toastColor}
          />

          {/* Cancel Confirmation Modal */}
          <ConfirmationModal
            isOpen={showCancelModal}
            heading='Discard report?'
            subheading='You have unsaved changes. Are you sure you want to discard this report?'
            onSubmit={() => {
              setShowCancelModal(false)
              navigate('/user/home')
            }}
            onCancel={() => setShowCancelModal(false)}
            submitLabel='Discard'
            cancelLabel='Keep editing'
          />

          {/* Submit Confirmation Modal */}
          <ConfirmationModal
            isOpen={showSubmitConfirmModal}
            heading='Submit report?'
            subheading='Once submitted, your report will be sent for review and processing.'
            onSubmit={() => {
              setShowSubmitConfirmModal(false)
              // Debounce the actual submission to avoid double clicks
              if (submitDebounceRef.current)
                clearTimeout(submitDebounceRef.current)
              submitDebounceRef.current = setTimeout(() => {
                performSubmitReport()
              }, 500)
            }}
            onCancel={() => setShowSubmitConfirmModal(false)}
            submitLabel='Submit'
            cancelLabel='Keep editing'
          />

          {/* Duplicate Warning Modal */}
          <ConfirmationModal
            isOpen={showDuplicateWarningModal}
            heading='Duplicate report?'
            subheading='Someone has already reported this item with a similar concern. Submitting a duplicate report may result in your report being rejected.'
            onSubmit={handleDuplicateWarningProceed}
            onCancel={handleDuplicateWarningCancel}
            submitLabel='Submit anyway'
            cancelLabel='Cancel'
          />
        </>
      )}
    </IonContent>
  )
}
