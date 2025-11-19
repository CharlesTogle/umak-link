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
import { uploadAndGetPublicUrl } from '@/shared/utils/supabaseStorageUtils'
import { supabase } from '@/shared/lib/supabase'
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

  const handlePost = async () => {
    setLoading(true)
    try {
      let imageUrl = ''
      if (image) {
        const path = `announcements/${Date.now()}_${image.name}`
        const blob = image
        imageUrl = await uploadAndGetPublicUrl(
          path,
          blob,
          image.type || 'image/jpeg'
        )
      }

      // invoke edge function to notify users — payload uses message/description/image_url
      const payload = {
        user_id: '1a824e1b-7103-41f3-82a7-12aba52fbc09',
        message: title || 'New Feature Available',
        description:
          description ||
          'Check out our latest update with amazing new features!',
        image_url: imageUrl || ''
      }

      try {
        supabase.functions.invoke('send-global-announcements', {
          body: payload
        })
      } catch (e) {
        console.error('Failed to invoke edge function', e)
      }

      setToast({
        show: true,
        message: 'Announcement posted and notifications sent.'
      })
      setTitle('')
      setDescription('')
      setImage(null)
      setTimeout(() => {
        navigate('/admin/announcement')
      }, 1000)
    } catch (e) {
      console.error('Failed to post announcement', e)
      setToast({ show: true, message: 'Failed to post announcement' })
    } finally {
      setLoading(false)
    }
  }

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
            onClick={() => navigate('/admin/announcement')}
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
              onClick={handlePost}
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
              <FormSectionHeader header='Message' isRequired />
              <TextArea
                value={title}
                setValue={setTitle}
                maxLength={100}
                placeholder='Enter additional details (optional). Max 100 characters'
                className='min-h-35! max-h-35!'
              />

              <FormSectionHeader header='Description' isRequired />
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

              <div className='mt-4'>
                <IonButton
                  onClick={handlePost}
                  disabled={loading}
                  expand='full'
                  style={{
                    '--background': 'var(--color-umak-blue)'
                  }}
                >
                  {loading ? <IonSpinner name='crescent' /> : 'Post'}
                </IonButton>
              </div>
              {/* Post button moved to header */}
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
    </>
  )
}
