import { useEffect, useState, type ReactNode } from 'react'
import { useIonRouter } from '@ionic/react'
import type { User } from '@/features/auth/contexts/UserContext'
import { useUser } from '@/features/auth/contexts/UserContext'
import { getNormalizedRoleKey } from '@/features/auth/utils/userRole'

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
  const { user: contextUser, loading } = useUser()
  const [isChecking, setIsChecking] = useState(true)
  const user = propUser ?? contextUser
  const normalizedRole = getNormalizedRoleKey(user?.user_type)

  useEffect(() => {
    if (loading && !propUser && !contextUser) {
      setIsChecking(true)
      return
    }

    setIsChecking(false)
  }, [loading, propUser, contextUser])

  useEffect(() => {
    if (isChecking) {
      return
    }

    if (!user) {
      router.push('/auth', 'forward', 'replace')
      return
    }

    if (!normalizedRole || !allowedRoles.includes(normalizedRole)) {
      router.push('/unauthorized', 'forward', 'replace')
    }
  }, [allowedRoles, isChecking, normalizedRole, router, user])

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

  if (!user) {
    return null
  }

  if (!normalizedRole || !allowedRoles.includes(normalizedRole)) {
    return null
  }

  return <>{children}</>
}
