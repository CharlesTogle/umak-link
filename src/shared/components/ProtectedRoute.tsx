// components/ProtectedRoute.tsx
import type { ReactNode } from 'react'
import { useIonRouter } from '@ionic/react'
import { useEffect, useState } from 'react'
import type { User } from '@/features/auth/contexts/UserContext'
import { useUser } from '@/features/auth/contexts/UserContext'

export default function ProtectedRoute ({
  allowedRoles,
  children,
  user: propUser
}: {
  allowedRoles: string[]
  children: ReactNode
  user?: User | null
}) {
  const router = useIonRouter()
  const { getUser } = useUser()
  const [isChecking, setIsChecking] = useState(true)
  const [user, setUser] = useState<User | null>(
    (propUser ?? null) as User | null
  )

  // Fetch user if not provided (handles direct navigation/refresh)
  useEffect(() => {
    const checkAuth = async () => {
      if (!propUser) {
        try {
          const fetchedUser = await getUser()
          setUser(fetchedUser)
        } catch (error) {
          console.error('[ProtectedRoute] Error fetching user:', error)
          setUser(null)
        }
      } else {
        setUser(propUser)
      }
      setIsChecking(false)
    }

    checkAuth()
  }, [propUser, getUser])

  if (isChecking) {
    return (
      <div className='h-screen w-screen flex items-center justify-center bg-white'>
        <div
          className='h-10 w-10 rounded-full border-4 border-neutral-300 border-t-transparent animate-spin'
          aria-hidden
        />
      </div>
    )
  }

  // Redirect to auth if no user
  if (!user) {
    router.push('/auth', 'forward', 'replace')
    return null
  }

  // Redirect to unauthorized if wrong role
  if (!allowedRoles.includes(user.user_type.toLowerCase())) {
    router.push('/unauthorized', 'forward', 'replace')
    return null
  }

  return <>{children}</>
}
