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
  imageLink?: string // Optional prop to display existing image from URL
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  label = 'Reverse Image Search',
  image,
  onImageChange,
  className = '',
  isRequired = false,
  imageLink
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Create preview URL when image file changes
  React.useEffect(() => {
    if (image) {
      const url = URL.createObjectURL(image)
      setPreviewUrl(url)
      // Cleanup
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [image])

  // Determine which image to display
  const displayImageUrl = previewUrl || imageLink || null

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
      // Request camera permissions before taking photo
      await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      })

      // Check if permissions were granted
      const permissionStatus = await Camera.checkPermissions()
      const hasPermission =
        permissionStatus.camera === 'granted' ||
        permissionStatus.photos === 'granted'

      if (!hasPermission) {
        console.error('Camera permission not granted')
        throw new Error('Camera permission not granted')
      }

      // Use Base64 result type to avoid URI issues with dev server
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: true
      })

      console.log('Photo captured (base64 length):', photo.base64String?.length)

      if (!photo.base64String) {
        console.error('No base64 data returned')
        throw new Error('No photo data')
      }

      // Convert base64 to blob
      const base64Data = photo.base64String
      const mimeType = `image/${photo.format || 'jpeg'}`

      // Decode base64 to binary
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: mimeType })
      console.log('Blob created:', blob.size, blob.type)

      // Determine file extension
      const ext = photo.format === 'png' ? 'png' : 'jpg'

      // Create a proper File object
      const file = new File([blob], `camera_photo_${Date.now()}.${ext}`, {
        type: mimeType,
        lastModified: Date.now()
      })

      console.log('File created:', file.name, file.size, file.type)

      // Pass the file to parent component
      onImageChange(file)
    } catch (e) {
      console.error('Camera error:', e)
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
        onClick={!displayImageUrl ? openModal : undefined}
        className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg ${
          displayImageUrl ? 'h-auto p-4' : 'h-32'
        } cursor-pointer transition relative hover:bg-gray-50`}
      >
        {!displayImageUrl ? (
          <>
            <IonIcon
              icon={cloudUploadOutline}
              className='text-2xl mb-2 text-gray-400'
            />
            <p className='text-sm text-gray-500'>Upload Image (Max: 1 file)</p>
          </>
        ) : (
          <div className='flex flex-col items-center justify-center text-center w-full'>
            {/* Image Preview - Square Aspect Ratio */}
            <div className='w-48 h-48 mb-3 overflow-hidden rounded-lg border-2 border-gray-200'>
              <img
                src={displayImageUrl}
                alt='Preview'
                className='w-full h-full object-cover'
              />
            </div>

            {/* File name if available */}
            {image && (
              <p className='font-default-font text-sm font-regular mb-2 truncate w-48 text-gray-600'>
                {image.name}
              </p>
            )}

            {/* Action Buttons */}
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
