// pages/user/Notifications.tsx
import { useEffect, useState } from 'react'
import {
  IonContent,
  IonButton,
  IonIcon,
  IonActionSheet,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react'
import Header from '@/shared/components/Header'
import NotificationItem from '@/features/user/components/notifications/NotificationItem'
import type { ActionItem } from '@/features/posts/types/notifications'
import useNotifications from '@/features/user/hooks/useNotifications'
import { useUser } from '@/features/auth/contexts/UserContext'
import {
  trashOutline,
  checkmarkOutline,
  ellipsisVertical
} from 'ionicons/icons'
import NotificationItemSkeleton from '../components/notifications/NotificationItemSkeleton'

// Extend to include id & read status for local state
// Local shim type was removed — notifications are provided by the hook

export default function Notifications () {
  const { getUser } = useUser()
  const {
    notifications: notificationsList,
    loading,
    getAllNotifications,
    markAsRead,
    deleteNotification
  } = useNotifications()

  // Local view-state for action sheet
  const [showBulkSheet, setShowBulkSheet] = useState(false)
  const [user, setUser] = useState<{ user_id: string } | null>(null)

  useEffect(() => {
    let mounted = true
    try {
      getUser().then(currentUser => {
        if (mounted) setUser(currentUser)
      })
    } catch (e) {
      console.error('Failed to get user', e)
    }
  }, [])

  const fetchNotificationsForUser = async (userId: string) => {
    try {
      console.log('Fetching notifications for user', userId)
      await getAllNotifications(userId)
    } catch (e) {
      console.error('Failed to fetch notifications for user', e)
    }
  }

  useEffect(() => {
    let mounted = true
    async function load () {
      fetchNotificationsForUser(user?.user_id || '').catch(err => {
        if (mounted) {
          console.error('Failed to load notifications', err)
        }
      })
    }
    load()
    return () => {
      mounted = false
    }
  }, [user])

  // Per-item actions
  const handleNotificationDelete = async (notificationId?: string) => {
    if (!notificationId) return
    const ok = await deleteNotification(notificationId)
    if (!ok) console.error('Failed to delete notification', notificationId)
  }

  const handleMarkAsRead = async (notificationId?: string) => {
    if (!notificationId) return
    const ok = await markAsRead(notificationId)
    if (!ok) console.error('Failed to mark as read', notificationId)
  }

  // Bulk actions (horizontal ellipsis)
  const handleDeleteAll = async () => {
    setShowBulkSheet(false)
    try {
      await Promise.all(
        (notificationsList ?? []).map(n =>
          deleteNotification(n.notification_id)
        )
      )
    } catch (e) {
      console.error('Failed to delete all notifications', e)
    }
  }

  const handleMarkAllRead = async () => {
    setShowBulkSheet(false)
    try {
      await Promise.all(
        (notificationsList ?? []).map(n => markAsRead(n.notification_id))
      )
    } catch (e) {
      console.error('Failed to mark all notifications read', e)
    }
  }

  const handleRefresh = async (event: CustomEvent) => {
    try {
      const currentUser = await getUser()
      if (!currentUser) return
      await getAllNotifications(currentUser.user_id)
    } catch (e) {
      console.error('Failed to refresh notifications', e)
    } finally {
      event.detail.complete()
    }
  }

  return (
    <IonContent className='bg-gray-50'>
      {/* App header you already have */}
      <Header
        logoShown={true}
        isProfileAndNotificationShown={true}
        isNotificationPage={true}
      />
      <IonRefresher slot='fixed' onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      {/* Section header with horizontal ellipsis for list-level actions */}
      <div className='bg-white border-y border-slate-200 px-3 py-2 font-default-font'>
        <div className='flex items-center justify-between'>
          <div className='text-[13px] text-slate-600'>Notifications</div>

          <IonButton
            onClick={() => setShowBulkSheet(true)}
            aria-label='List actions'
            fill='clear'
            size='small'
            className='m-0 p-0'
            style={
              {
                '--background': 'transparent',
                '--background-hover': 'transparent',
                '--background-activated': 'transparent',
                '--background-focused': 'transparent',
                '--box-shadow': 'none',
                '--ripple-color': 'transparent'
              } as React.CSSProperties
            }
          >
            <IonIcon
              icon={ellipsisVertical}
              slot='icon-only'
              className='text-slate-700'
            />
          </IonButton>
        </div>
      </div>

      {/* Notifications list */}
      <div className='bg-white'>
        {loading ? (
          [...Array(10)].map((_, idx) => <NotificationItemSkeleton key={idx} />)
        ) : (notificationsList ?? []).length === 0 ? (
          <div className='px-4 py-10 text-center text-slate-500 font-default-font text-sm'>
            You’re all caught up.
          </div>
        ) : (
          (notificationsList ?? []).map(n => {
            // Construct title/description from available fields
            const title = n.description ?? 'Notification'
            const data = n.data ?? {}
            let link
            if (data['link'] && data['postId']) {
              link = data['link']
            }
            const description = n.description ?? JSON.stringify(n.data ?? '')

            const actions: ActionItem[] = [
              {
                color: 'danger',
                type: 'Delete notification',
                onClick: () => handleNotificationDelete(n.notification_id),
                icon: trashOutline
              }
            ]
            if (!n.is_read) {
              actions.push({
                color: 'primary',
                type: 'Mark as read',
                onClick: () => handleMarkAsRead(n.notification_id),
                icon: checkmarkOutline
              })
            }
            return (
              <NotificationItem
                key={n.notification_id}
                type={(n.type as any) || 'info'}
                title={title}
                href={link}
                description={description}
                read={Boolean(n.is_read)}
                actions={actions}
                notificationId={n.notification_id}
                handleMarkAsRead={handleMarkAsRead}
                imageUrl={n.image_url ?? undefined}
              />
            )
          })
        )}
      </div>

      {/* Bulk Action Sheet (Delete all / Mark all as read) */}
      <IonActionSheet
        isOpen={showBulkSheet}
        header='Notifications'
        onDidDismiss={() => setShowBulkSheet(false)}
        buttons={[
          {
            text: 'Delete all',
            icon: trashOutline,
            handler: handleDeleteAll,
            // "danger" mapping → umak-blue text
            cssClass: ['font-default-font', 'text-[var(--color-umak-blue)]']
          },
          {
            text: 'Mark all as read',
            icon: checkmarkOutline,
            handler: handleMarkAllRead,
            cssClass: ['font-default-font', 'text-slate-900']
          },
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: ['font-default-font', 'text-slate-500']
          }
        ]}
      />
    </IonContent>
  )
}
