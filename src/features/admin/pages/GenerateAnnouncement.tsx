import { useReducer, useEffect, useRef, useMemo } from 'react'
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
import { useUser, type User } from '@/features/auth/contexts/UserContext'

interface State {
  title: string
  description: string
  image: File | null
  loading: boolean
  toast: { show: boolean; message: string }
  showConfirmPost: boolean
  showConfirmCancel: boolean
  currentUser: User | null
}

type Action =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_IMAGE'; payload: File | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'SET_CONFIRM_POST'; payload: boolean }
  | { type: 'SET_CONFIRM_CANCEL'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'RESET_FORM' }

const initialState: State = {
  title: '',
  description: '',
  image: null,
  loading: false,
  toast: { show: false, message: '' },
  showConfirmPost: false,
  showConfirmCancel: false,
  currentUser: null
}

function reducer (state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload }
    case 'SET_DESCRIPTION':
      return { ...state, description: action.payload }
    case 'SET_IMAGE':
      return { ...state, image: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SHOW_TOAST':
      return { ...state, toast: { show: true, message: action.payload } }
    case 'HIDE_TOAST':
      return { ...state, toast: { show: false, message: '' } }
    case 'SET_CONFIRM_POST':
      return { ...state, showConfirmPost: action.payload }
    case 'SET_CONFIRM_CANCEL':
      return { ...state, showConfirmCancel: action.payload }
    case 'SET_USER':
      return { ...state, currentUser: action.payload }
    case 'RESET_FORM':
      return { ...state, title: '', description: '', image: null }
    default:
      return state
  }
}

export default function GenerateAnnouncement () {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { title, description, image, loading, toast, showConfirmPost, showConfirmCancel, currentUser } = state

  const { navigate } = useNavigation()
  const { insertAuditLog } = useAuditLogs()
  const { getUser } = useUser()

  useEffect(() => {
    const fetchUser = async () => {
      const u = await getUser()
      dispatch({ type: 'SET_USER', payload: u })
    }
    fetchUser()
  }, [getUser])

  const openConfirmPost = () => {
    if (title.trim() === '' && description.trim() === '') {
      dispatch({ type: 'SHOW_TOAST', payload: 'Title or Message must not be empty' })
      return
    }
    dispatch({ type: 'SET_CONFIRM_POST', payload: true })
  }

  const openConfirmCancel = () => {
    dispatch({ type: 'SET_CONFIRM_CANCEL', payload: true })
  }

  // Use a ref-backed callback so the debounced wrapper always calls the latest logic
  const handlePostCall = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const res = await generateAnnouncementAction({
        title,
        description,
        image,
        insertAuditLog,
        currentUser
      })

      dispatch({ type: 'SHOW_TOAST', payload: res.message })

      if (res.success) {
        dispatch({ type: 'RESET_FORM' })
        setTimeout(() => {
          navigate('/admin/announcement')
        }, 1000)
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Keep a stable ref to the latest handler
  const handlePostRef = useRef(handlePostCall)
  useEffect(() => {
    handlePostRef.current = handlePostCall
  }, [handlePostCall])

  // Create debounced function once and keep it stable
  const debouncedHandlePost = useMemo(
    () =>
      debounce(
        () => {
          void handlePostRef.current()
        },
        1000,
        true
      ),
    []
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
                setValue={(v: string) => dispatch({ type: 'SET_TITLE', payload: v })}
                maxLength={100}
                placeholder='Enter additional details (optional). Max 100 characters'
                className='min-h-35! max-h-35!'
              />

              <FormSectionHeader header='Message' isRequired />
              <TextArea
                value={description}
                setValue={(v: string) => dispatch({ type: 'SET_DESCRIPTION', payload: v })}
                maxLength={500}
                placeholder='Enter additional details (optional). Max 500 characters'
                className='min-h-35! max-h-35!'
              />

              <ImageUpload
                label='Preview Image'
                image={image}
                onImageChange={(img: File | null) => dispatch({ type: 'SET_IMAGE', payload: img })}
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
        onDidDismiss={() => dispatch({ type: 'HIDE_TOAST' })}
      />

      {/* Confirmation modals */}
      <ConfirmationModal
        isOpen={showConfirmPost}
        heading='Post announcement?'
        subheading='Are you sure you want to post this announcement and send notifications to users?'
        onSubmit={() => {
          dispatch({ type: 'SET_CONFIRM_POST', payload: false })
          void debouncedHandlePost()
        }}
        onCancel={() => dispatch({ type: 'SET_CONFIRM_POST', payload: false })}
        submitLabel='Post'
        cancelLabel='Cancel'
      />

      <ConfirmationModal
        isOpen={showConfirmCancel}
        heading='Discard announcement?'
        subheading='Are you sure you want to discard this announcement? Unsaved changes will be lost.'
        onSubmit={() => {
          dispatch({ type: 'SET_CONFIRM_CANCEL', payload: false })
          navigate('/admin/announcement')
        }}
        onCancel={() => dispatch({ type: 'SET_CONFIRM_CANCEL', payload: false })}
        submitLabel='Discard'
        cancelLabel='Keep editing'
      />
    </>
  )
}
