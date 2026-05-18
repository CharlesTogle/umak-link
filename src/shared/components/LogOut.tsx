import { IonIcon } from '@ionic/react'
import { logOut } from 'ionicons/icons'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUser } from '@/features/auth/contexts/UserContext'

export default function Logout () {
  const { logout } = useAuth()
  const { clearUser } = useUser()

  const handleLogout = async () => {
    await clearUser()
    const { error } = await logout()
    if (error) {
      console.error('[Logout] Logout failed:', error)
      return
    }

    sessionStorage.removeItem('redirect_after_login')
    window.location.replace('/auth')
  }
  return (
    <div className='px-4 pb-20 pt-3'>
      <button
        type='button'
        onClick={handleLogout}
        className='flex w-full items-center gap-3 rounded-2xl bg-[var(--color-umak-red)] px-4 py-4 text-left text-white shadow-sm transition active:scale-[0.99]'
      >
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10'>
          <IonIcon icon={logOut} className='text-xl text-white' />
        </div>
        <span className='text-lg font-semibold'>Log out</span>
      </button>
    </div>
  )
}
