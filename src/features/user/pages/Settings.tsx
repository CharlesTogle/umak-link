import {
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonPopover,
  IonButton
} from '@ionic/react'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { logOut } from 'ionicons/icons'
import Header from '@/shared/components/Header'
import SettingsList from '@/shared/components/SettingsList'

import { useRef, useEffect, useState } from 'react'

export default function Settings () {
  const { navigate } = useNavigation()
  const { logout } = useAuth()
  const isMounted = useRef(true)
  const [showLogoutPopover, setShowLogoutPopover] = useState(false)
  const [popoverEvent, setPopoverEvent] = useState<any>(undefined)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleLogoutClick = (e: React.MouseEvent) => {
    setPopoverEvent(e.nativeEvent)
    setShowLogoutPopover(true)
  }

  const handleConfirmLogout = async () => {
    setShowLogoutPopover(false)
    await logout()
    if (isMounted.current) navigate('/auth')
  }

  return (
    <>
      <Header logoShown={true} />
      <SettingsList />
      <div>
        <IonCard className='mt-3 mb-20 bg-transparent shadow-none'>
          <IonCardContent>
            <IonList>
              <IonItem
                button
                style={{ '--background': 'var(--color-umak-red)' }}
                className='text-white font-default-font rounded-lg'
                onClick={handleLogoutClick}
              >
                <IonIcon icon={logOut} className='mr-3 text-white' />
                <IonLabel className='text-red-600'>Log out</IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>
      </div>
      {/* Logout confirmation popover */}
      <IonPopover
        isOpen={showLogoutPopover}
        event={popoverEvent}
        onDidDismiss={() => setShowLogoutPopover(false)}
      >
        <div className='p-4 max-w-xs'>
          <div className='mb-3 text-sm'>Are you sure you want to logout?</div>
          <div className='flex justify-end gap-2'>
            <IonButton onClick={() => setShowLogoutPopover(false)} fill='clear'>
              Cancel
            </IonButton>
            <IonButton color='danger' onClick={handleConfirmLogout}>
              Logout
            </IonButton>
          </div>
        </div>
      </IonPopover>
    </>
  )
}
