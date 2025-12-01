import {
  IonCard,
  IonContent,
  IonCardContent,
  IonAvatar,
  IonIcon,
  IonActionSheet,
  IonButton,
  IonFab,
  IonFabButton,
  IonSkeletonText,
  IonToast,
  IonLoading,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react'
import { useAdminServices } from '../hooks/useAdminServices'
import { memo, useEffect, useState, useCallback } from 'react'
import type { User } from '@/features/auth/contexts/UserContext'
import { useUser } from '@/features/auth/contexts/UserContext'
import {
  peopleCircle,
  ellipsisVertical,
  personCircle,
  add,
  checkmarkCircle,
  alertCircle
} from 'ionicons/icons'
import CardHeader from '@/shared/components/CardHeader'
import { ConfirmationModal } from '@/shared/components/ConfirmationModal'
import Header from '@/shared/components/Header'
import { useNavigation } from '@/shared/hooks/useNavigation'

const AdminListItemSkeleton = memo(() => (
  <IonCard className='rounded-2xl shadow-sm border mb-4 border-slate-200/70'>
    <IonCardContent className='p-4'>
      <div className='flex items-center gap-4'>
        <IonAvatar className='w-16 h-16 shrink-0'>
          <IonSkeletonText animated className='w-full h-full rounded-full' />
        </IonAvatar>

        <div className='flex-1 min-w-0'>
          <IonSkeletonText
            animated
            className='w-24 h-4 mb-2'
            style={{ borderRadius: '4px' }}
          />
          <IonSkeletonText
            animated
            className='w-40 h-6 mb-1'
            style={{ borderRadius: '4px' }}
          />
          <IonSkeletonText
            animated
            className='w-48 h-4'
            style={{ borderRadius: '4px' }}
          />
        </div>

        <div className='w-10 h-10'>
          <IonSkeletonText
            animated
            className='w-full h-full'
            style={{ borderRadius: '50%' }}
          />
        </div>
      </div>
    </IonCardContent>
  </IonCard>
))

export const AdminListItem = memo(
  ({
    id,
    name,
    image,
    email,
    role,
    isActive,
    onToggle,
    onRemove,
    withActions = true,
    isCurrentUser = false
  }: {
    id: string
    name: string
    image?: string | null
    email: string
    role: string
    isActive: boolean
    onToggle: () => void
    onRemove?: () => void
    withActions?: boolean
    isCurrentUser?: boolean
  }) => {
    const [open, setOpen] = useState(false)
    // id prop intentionally unused within this component now (actions removed)
    void id

    return (
      <IonCard
        className='rounded-2xl mb-4 shadow-sm border border-slate-200/70 cursor-pointer'
        onClick={onToggle}
      >
        <IonCardContent className='p-4'>
          <div className='flex items-center gap-4'>
            <IonAvatar className='w-16 h-16 shrink-0'>
              {image ? (
                <img src={image} alt={name} className='object-cover' />
              ) : (
                <div className='w-full h-full grid place-items-center bg-slate-100 text-slate-500'>
                  <IonIcon icon={personCircle} className='text-5xl' />
                </div>
              )}
            </IonAvatar>

            <div className='flex-1 min-w-0'>
              <div className='text-sm text-indigo-700 font-medium flex items-center gap-2'>
                {role}
                {isCurrentUser && (
                  <span
                    className='text-xs font-medium text-white px-3 py-1 rounded-md'
                    style={{ backgroundColor: 'var(--color-umak-blue)' }}
                  >
                    Current User
                  </span>
                )}
              </div>
              <div
                className={`text-lg font-extrabold text-slate-900 transition-all duration-200 ${
                  isActive ? 'whitespace-normal break-words' : 'truncate'
                }`}
              >
                {name}
              </div>
              <div
                className={`text-sm text-slate-500 transition-all duration-200 ${
                  isActive ? 'whitespace-normal break-words' : 'truncate'
                }`}
              >
                {email}
              </div>
            </div>

            {withActions && (
              <IonButton
                onClick={e => {
                  e.stopPropagation()
                  setOpen(true)
                }}
                fill='clear'
                className='text-slate-500'
                aria-label='Actions'
              >
                <IonIcon slot='icon-only' icon={ellipsisVertical} />
              </IonButton>
            )}
          </div>

          {withActions && (
            <IonActionSheet
              isOpen={open}
              onDidDismiss={() => setOpen(false)}
              buttons={[
                {
                  text: 'Remove',
                  role: 'destructive',
                  handler: () => {
                    if (onRemove) {
                      onRemove()
                    }
                  }
                }
              ]}
            />
          )}
        </IonCardContent>
      </IonCard>
    )
  }
)

export default function StaffManagement () {
  const [staffs, setStaffs] = useState<Partial<User>[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [admins, setAdmins] = useState<Partial<User>[]>([])
  const [activeUserId, setActiveUserId] = useState<string | number | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{
    email: string
    userId: string
    userType: string
    name: string
  } | null>(null)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { getAllStaffAndAdmin, removeAdminOrStaffMember } = useAdminServices()
  const { navigate } = useNavigation()
  const { getUser } = useUser()

  useEffect(() => {
    const fetchStaffsAndAdmins = async () => {
      setLoading(true)
      try {
        const currentUser = await getUser()
        setCurrentUserId(currentUser?.user_id || null)
        const data = await getAllStaffAndAdmin()
        if (data) {
          const staffUsers = data.filter(
            user => (user.user_type as string) === 'Staff'
          )
          const adminUsers = data.filter(
            user => (user.user_type as string) === 'Admin'
          )

          const sortedAdmins = adminUsers.sort((a, b) => {
            if (a.user_id === currentUser?.user_id) return -1
            if (b.user_id === currentUser?.user_id) return 1
            return 0
          })

          setAdmins(sortedAdmins)
          setStaffs(staffUsers)
        }
      } catch (err) {
        console.error('Error fetching staffs/admins', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStaffsAndAdmins()
  }, [])

  const fetchStaffsAndAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = await getUser()
      setCurrentUserId(currentUser?.user_id || null)
      const data = await getAllStaffAndAdmin()
      if (data) {
        const staffUsers = data.filter(
          user => (user.user_type as string) === 'Staff'
        )
        const adminUsers = data.filter(
          user => (user.user_type as string) === 'Admin'
        )

        const sortedAdmins = adminUsers.sort((a, b) => {
          if (a.user_id === currentUser?.user_id) return -1
          if (b.user_id === currentUser?.user_id) return 1
          return 0
        })

        setAdmins(sortedAdmins)
        setStaffs(staffUsers)
      }
    } catch (err) {
      console.error('Error fetching staffs/admins', err)
    } finally {
      setLoading(false)
    }
  }, [getAllStaffAndAdmin, getUser])

  const handleRefresh = async (event: CustomEvent) => {
    try {
      await fetchStaffsAndAdmins()
    } catch (err) {
      console.error('Error refreshing staffs/admins', err)
    } finally {
      try {
        event.detail.complete()
      } catch {
        const target = event.target as any
        target?.complete?.()
      }
    }
  }

  const handleToggle = (userId: string | number) => {
    setActiveUserId(prev => (prev === userId ? null : userId))
  }

  const handleRemove = async (
    email: string,
    userId: string,
    userType: string,
    name: string
  ) => {
    setRemovingUserId(userId)
    try {
      const success = await removeAdminOrStaffMember({
        userId,
        email,
        name,
        previousRole: userType as 'Staff' | 'Admin'
      })
      if (success) {
        if (userType === 'Staff') {
          setStaffs(prevStaffs =>
            prevStaffs.filter(staff => staff.user_id !== userId)
          )
          setToastMessage('Staff member removed successfully')
        } else {
          setAdmins(prevAdmins =>
            prevAdmins.filter(admin => admin.user_id !== userId)
          )
          setToastMessage('Admin removed successfully')
        }
        setShowSuccessToast(true)
      } else {
        setToastMessage('Failed to remove member. Please try again.')
        setShowErrorToast(true)
      }
    } catch (err) {
      console.error('Failed to remove member', err)
      setToastMessage('Failed to remove member. Please try again.')
      setShowErrorToast(true)
    } finally {
      setRemovingUserId(null)
    }
  }

  const openConfirmFor = (
    email: string,
    userId: string,
    userType: string,
    name: string
  ) => {
    setConfirmTarget({ email, userId, userType, name })
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!confirmTarget) return
    const { email, userId, userType, name } = confirmTarget
    setConfirmOpen(false)
    setConfirmTarget(null)
    await handleRemove(email, userId, userType, name)
  }

  return (
    <IonContent>
      <Header logoShown isProfileAndNotificationShown />
      <IonRefresher slot='fixed' onIonRefresh={handleRefresh}>
        <IonRefresherContent
          pullingText='Pull to refresh'
          refreshingSpinner='crescent'
          refreshingText='Refreshing data...'
        />
      </IonRefresher>
      <IonCard>
        <IonCardContent>
          <CardHeader icon={peopleCircle} title='Admin List' />
          {loading ? (
            <>
              <AdminListItemSkeleton />
              <AdminListItemSkeleton />
            </>
          ) : admins.length === 0 ? (
            <div className='text-center py-8 text-slate-500'>
              <p>No Users</p>
            </div>
          ) : (
            admins.map(admin => {
              const isCurrentUser = admin.user_id === currentUserId
              return (
                <AdminListItem
                  key={admin.email}
                  id={admin.user_id!}
                  name={admin.user_name!}
                  image={admin.profile_picture_url!}
                  email={admin.email!}
                  role={admin.user_type!}
                  isActive={activeUserId === admin.user_id}
                  onToggle={() => handleToggle(admin.user_id!)}
                  onRemove={
                    !isCurrentUser
                      ? () =>
                          openConfirmFor(
                            admin.email!,
                            admin.user_id!,
                            admin.user_type!,
                            admin.user_name!
                          )
                      : undefined
                  }
                  withActions={!isCurrentUser}
                  isCurrentUser={isCurrentUser}
                />
              )
            })
          )}
        </IonCardContent>
      </IonCard>
      <IonCard>
        <IonCardContent>
          <CardHeader icon={peopleCircle} title='Staff List' />
          {loading ? (
            <>
              <AdminListItemSkeleton />
              <AdminListItemSkeleton />
              <AdminListItemSkeleton />
            </>
          ) : staffs.length === 0 ? (
            <div className='text-center py-8 text-slate-500'>
              <p>No Users</p>
            </div>
          ) : (
            staffs.map(staff => (
              <AdminListItem
                key={staff.email}
                id={staff.user_id!}
                name={staff.user_name!}
                image={staff.profile_picture_url!}
                email={staff.email!}
                role={staff.user_type!}
                isActive={activeUserId === staff.user_id}
                onToggle={() => handleToggle(staff.user_id!)}
                onRemove={() =>
                  openConfirmFor(
                    staff.email!,
                    staff.user_id!,
                    staff.user_type!,
                    staff.user_name!
                  )
                }
              />
            ))
          )}
        </IonCardContent>
      </IonCard>
      <IonFab
        slot='fixed'
        vertical='bottom'
        horizontal='end'
        className='mb-3 mr-2'
      >
        <IonFabButton
          style={{
            '--background': 'var(--color-umak-blue)'
          }}
          onClick={() => navigate('/admin/staff/add')}
        >
          <IonIcon icon={add}></IonIcon>
        </IonFabButton>
      </IonFab>

      {/* Success Toast */}
      <IonToast
        isOpen={showSuccessToast}
        onDidDismiss={() => setShowSuccessToast(false)}
        message={toastMessage}
        duration={3000}
        position='top'
        color='success'
        icon={checkmarkCircle}
      />

      {/* Error Toast */}
      <IonToast
        isOpen={showErrorToast}
        onDidDismiss={() => setShowErrorToast(false)}
        message={toastMessage}
        duration={4000}
        position='top'
        color='danger'
        icon={alertCircle}
      />

      <IonLoading
        isOpen={Boolean(removingUserId)}
        message='Removing member...'
      />

      <ConfirmationModal
        isOpen={Boolean(confirmOpen)}
        heading='Remove account'
        subheading={
          confirmTarget
            ? `Are you sure you want to remove ${confirmTarget.name} as a ${confirmTarget.userType}? You can add them again later.`
            : 'Are you sure you want to remove this account? You can add them again later.'
        }
        onSubmit={handleConfirmSubmit}
        onCancel={() => setConfirmOpen(false)}
        submitLabel='Remove'
        cancelLabel='Cancel'
      />
    </IonContent>
  )
}
