import { useState } from 'react'
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonToast,
  IonSpinner
} from '@ionic/react'
import Header from '@/shared/components/Header'
import ImageUpload from '@/shared/components/ImageUpload'
import { useAuditLogs } from '@/shared/hooks/useAuditLogs'
import {
  generateAnnouncementAction,
  debounce
} from '@/features/admin/utils/generateAnnouncementUtil'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import TextArea from '@/shared/components/TextArea'
import { useNavigation } from '@/shared/hooks/useNavigation'
import FormSectionHeader from '@/shared/components/FormSectionHeader'
import CardHeader from '@/shared/components/CardHeader'
import { megaphone } from 'ionicons/icons'

export default function GenerateAnnouncement () {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const { navigate } = useNavigation()
  const { insertAuditLog } = useAuditLogs()
  const [showConfirmPost, setShowConfirmPost] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const openConfirmPost = () => {
    if (title.trim() === '' && description.trim() === '') {
      setToast({ show: true, message: 'Title or Message must not be empty' })
      return
    }
    setShowConfirmPost(true)
  }

  const openConfirmCancel = () => {
    setShowConfirmCancel(true)
  }

  // Use a ref-backed callback so the debounced wrapper always calls the latest logic
  const handlePostCall = async () => {
    setLoading(true)
    try {
      const res = await generateAnnouncementAction({
        title,
        description,
        image,
        insertAuditLog
      })

      setToast({ show: true, message: res.message })

      if (res.success) {
        setTitle('')
        setDescription('')
        setImage(null)
        setTimeout(() => {
          navigate('/admin/announcement')
        }, 1000)
      }
    } finally {
      setLoading(false)
    }
  }

  // Keep a stable debounced function that calls the latest handler via a ref
  const handlePostRef = { current: handlePostCall }
  // create debounced function (leading=true) and keep it stable
  // we intentionally create it once per render here because the handler uses a ref to invoke latest
  const debouncedHandlePost = debounce(
    () => {
      void handlePostRef.current()
    },
    1000,
    true
  )

  return (
    <>
      <Header logoShown={false} isProfileAndNotificationShown={false}>
        <div className='flex justify-between items-center bg-[#1e2b87] ion-padding-start ion-padding-end'>
          <IonButton
            style={
              {
                '--background': 'var(--color-umak-red)',
                '--box-shadow': 'none'
              } as any
            }
            onClick={openConfirmCancel}
          >
            Cancel
          </IonButton>
          <div className='flex items-center space-x-2 w-fit h-fit border-1 border-white rounded-md'>
            <IonButton
              style={
                {
                  '--background': 'transparent',
                  '--box-shadow': 'none'
                } as any
              }
              onClick={openConfirmPost}
              disabled={loading}
            >
              {loading ? <IonSpinner name='crescent' /> : 'Post'}
            </IonButton>
          </div>
        </div>
      </Header>
      <IonContent className='bg-default-bg'>
        <IonCard className='mb-4'>
          <IonCardContent>
            <div className='p-4'>
              <CardHeader icon={megaphone} title='Create Announcements' />
              <FormSectionHeader header='Title' isRequired />
              <TextArea
                value={title}
                setValue={setTitle}
                maxLength={100}
                placeholder='Enter additional details (optional). Max 100 characters'
                className='min-h-35! max-h-35!'
              />

              <FormSectionHeader header='Message' isRequired />
              <TextArea
                value={description}
                setValue={setDescription}
                maxLength={500}
                placeholder='Enter additional details (optional). Max 500 characters'
                className='min-h-35! max-h-35!'
              />

              <ImageUpload
                label='Preview Image'
                image={image}
                onImageChange={setImage}
              />

              <div className='mt-4 mb-10'>
                <IonButton
                  onClick={openConfirmPost}
                  disabled={loading}
                  expand='full'
                  style={{
                    '--background': 'var(--color-umak-blue)'
                  }}
                >
                  {loading ? <IonSpinner name='crescent' /> : 'Post'}
                </IonButton>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>

      <IonToast
        isOpen={toast.show}
        message={toast.message}
        duration={3000}
        onDidDismiss={() => setToast({ show: false, message: '' })}
      />

      {/* Confirmation modals */}
      <ConfirmationModal
        isOpen={showConfirmPost}
        heading='Post announcement?'
        subheading='Are you sure you want to post this announcement and send notifications to users?'
        onSubmit={() => {
          setShowConfirmPost(false)
          void debouncedHandlePost()
        }}
        onCancel={() => setShowConfirmPost(false)}
        submitLabel='Post'
        cancelLabel='Cancel'
      />

      <ConfirmationModal
        isOpen={showConfirmCancel}
        heading='Discard announcement?'
        subheading='Are you sure you want to discard this announcement? Unsaved changes will be lost.'
        onSubmit={() => {
          setShowConfirmCancel(false)
          navigate('/admin/announcement')
        }}
        onCancel={() => setShowConfirmCancel(false)}
        submitLabel='Discard'
        cancelLabel='Keep editing'
      />
    </>
  )
}
