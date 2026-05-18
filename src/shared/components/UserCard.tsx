import { IonCard, IonCardContent, IonAvatar, IonIcon } from '@ionic/react'
import { personCircle } from 'ionicons/icons'
import { useEffect, useState } from 'react'
import { getCachedImage, cachedFileExists } from '@/shared/utils/fileUtils'
import { useUser } from '@/features/auth/contexts/UserContext'

export default function UserCard ({ className }: { className?: string }) {
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  const { user, loading } = useUser()

  useEffect(() => {
    let mounted = true

    const loadCachedProfilePicture = async () => {
      try {
        const exists = await cachedFileExists(
          'profilePicture.webp',
          'cache/images'
        )
        if (!exists || !mounted) return

        const url = await getCachedImage('profilePicture.webp', 'cache/images')
        if (mounted) {
          setProfilePicUrl(url)
        }
      } catch (err) {
        console.error('Error checking cached profile picture', err)
      }
    }

    void loadCachedProfilePicture()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <IonCard
      className={`shadow-md mt-4 border-t-3 border-gray-200 ion-padding ${className}`}
    >
      <IonCardContent>
        <div className='flex items-center gap-4'>
          <IonAvatar className='w-16 h-16'>
            {profilePicUrl || user?.profile_picture_url ? (
              <img
                src={profilePicUrl || user?.profile_picture_url || ''}
                alt='Profile'
                className='border-2 border-umak-blue'
              />
            ) : (
              <IonIcon
                icon={personCircle}
                style={{ width: '64px', height: '64px' }}
              />
            )}
          </IonAvatar>
          <div>
            <p className='uppercase tracking-wide text-xs  font-default-font'>
              {loading ? 'Loading…' : user?.user_type || 'User'}
            </p>
            <p className='text-lg font-semibold!'>
              {loading ? 'Loading…' : user?.user_name}
            </p>
            <p>{user?.email}</p>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  )
}
