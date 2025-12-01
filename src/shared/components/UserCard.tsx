import { IonCard, IonCardContent, IonAvatar, IonIcon } from '@ionic/react'
import { personCircle } from 'ionicons/icons'
import { useEffect, useState, useCallback } from 'react'
import { getCachedImage, cachedFileExists } from '@/shared/utils/fileUtils'
import { useUser } from '@/features/auth/contexts/UserContext'

export default function UserCard ({ className }: { className?: string }) {
  const [loading, setLoading] = useState<boolean>(true)
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const { getUser } = useUser()

  const loadData = useCallback(async () => {
    // Return gathered data; avoid setting state inside here so caller can guard with mounted
    const result: { url?: string | null; user?: any | null } = {}

    try {
      const exists = await cachedFileExists(
        'profilePicture.webp',
        'cache/images'
      )
      if (exists) {
        const url = await getCachedImage('profilePicture.webp', 'cache/images')
        result.url = url
      }
    } catch (err) {
      console.error('Error checking cached profile picture', err)
    }

    try {
      const currentUser = await getUser()
      result.user = currentUser
    } catch (err) {
      console.error('Error loading user', err)
      result.user = null
    }

    return result
  }, [getUser])

  useEffect(() => {
    let mounted = true

    loadData()
      .then(({ url, user: currentUser }) => {
        if (!mounted) return
        if (url) setProfilePicUrl(url)
        setUser(currentUser ?? null)
      })
      .catch(err => {
        console.error('Failed to load user card data', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [loadData])
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
              User
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
