import React, { useRef, useState } from 'react'
import { IonButton, IonIcon } from '@ionic/react'
import {
  cloudUploadOutline,
  refreshOutline,
  camera,
  images,
  informationCircle,
  trashOutline
} from 'ionicons/icons'
import ActionModal from './ActionModal'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import FormSectionHeader from '@/shared/components/FormSectionHeader'

interface ImageUploadSectionProps {
  label?: string
  image: File | null
  onImageChange: (file: File | null) => void
  className?: string
  isRequired?: boolean
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  label = 'Reverse Image Search',
  image,
  onImageChange,
  className = '',
  isRequired = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(e.target.files[0])
    }
  }

  const handleReplaceClick = () => {
    openModal()
  }

  const handleRemoveImage = () => {
    onImageChange(null)
  }

  const handlePickFile = () => {
    closeModal()
    // trigger native file picker
    fileInputRef.current?.click()
  }

  const handleTakePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      })
      const uri = photo.webPath || photo.path
      if (!uri) throw new Error('No photo path')
      const resp = await fetch(uri)
      const blob = await resp.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const file = new File([blob], `photo_${Date.now()}.${ext}`, {
        type: blob.type || 'image/jpeg'
      })
      onImageChange(file)
    } catch (e) {
      // optional: toast error
    } finally {
      closeModal()
    }
  }

  return (
    <div className={`mb-6 ${className}`}>
      <FormSectionHeader header={label} isRequired={isRequired} />
      <div
        role='button'
        aria-label='Upload image'
        onClick={!image ? openModal : undefined}
        className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-32 cursor-pointer transition relative hover:bg-gray-50`}
      >
        {!image ? (
          <>
            <IonIcon
              icon={cloudUploadOutline}
              className='text-2xl mb-2 text-gray-400'
            />
            <p className='text-sm text-gray-500'>Upload Image (Max: 1 file)</p>
          </>
        ) : (
          <div className='flex flex-col items-center justify-center text-center'>
            <p className='font-default-font text-base font-regular mb-2 truncate w-48'>
              {image.name}
            </p>
            <div className='flex gap-2'>
              <IonButton
                type='button'
                onClick={handleReplaceClick}
                className='flex items-center gap-1 text-xs font-default-font hover:underline bg-umak'
                style={{
                  '--background': 'var(--color-umak-blue)'
                }}
              >
                <IonIcon icon={refreshOutline} className='text-base mr-2' />
                Replace
              </IonButton>
              <IonButton
                type='button'
                onClick={handleRemoveImage}
                className='flex items-center gap-1 text-xs font-default-font hover:underline'
                style={{
                  '--background': 'var(--color-umak-red)'
                }}
              >
                <IonIcon icon={trashOutline} className='text-base mr-2' />
                Remove
              </IonButton>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleUpload}
          hidden
        />
      </div>

      <ActionModal
        isOpen={isOpen}
        onDidDismiss={closeModal}
        header={
          <div className='flex flex-col items-center'>
            <IonIcon
              icon={informationCircle}
              className='text-3xl text-umak-blue'
            />
            <p>Select Picture Method</p>
          </div>
        }
        actions={[
          {
            text: 'Open Camera',
            icon: camera,
            onClick: close => {
              // close modal then take photo
              close()
              // small timeout to ensure modal closed before native camera opens
              setTimeout(() => void handleTakePhoto(), 50)
            }
          },
          {
            text: 'Select from gallery',
            icon: images,
            onClick: close => {
              close()
              setTimeout(() => void handlePickFile(), 50)
            }
          }
        ]}
        initialBreakpoint={0.25}
        breakpoints={[0, 0.25, 0.35]}
        backdropDismiss={true}
        className='category-selection-modal font-default-font'
      />
    </div>
  )
}

export default ImageUploadSection
