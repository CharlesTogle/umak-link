// components/user/notifications/NotificationItem.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react'
import { IonIcon, IonActionSheet, IonButton } from '@ionic/react'
import ExpandableImage from '@/shared/components/ExpandableImage'
import {
  shieldOutline,
  checkmarkCircleOutline,
  checkmarkDoneCircleOutline,
  mailOutline,
  ellipsisVertical,
  megaphoneOutline,
  closeCircleOutline,
  hourglassOutline,
  trashOutline,
  informationCircleOutline
} from 'ionicons/icons'
import { useNavigation } from '@/shared/hooks/useNavigation'
import { useNotificationContext } from '@/shared/contexts/NotificationContext'
import type { NotificationPayloadData } from '@/shared/lib/api-types'

export type NotificationType =
  | 'match'
  | 'success'
  | 'acceptance'
  | 'accept'
  | 'info'
  | 'message'
  | 'rejection'
  | 'post_accepted'
  | 'global_announcement'
  | 'progress'
  | 'delete'

export type ActionItem = {
  color: 'danger' | 'primary' // danger => umak-blue, primary => slate-900
  type: string // label text shown in the action sheet
  onClick: () => void
  icon?: string // optional ionicon, e.g. trashOutline
}

interface NotificationItemProps {
  type: NotificationType | string
  title: string
  description: string
  read?: boolean
  actions?: ActionItem[]
  actionSheetHeader?: string
  notificationId?: string
  handleMarkAsRead?: (notificationId: string) => void
  href?: string
  imageUrl?: string
  notificationData?: NotificationPayloadData | null
}

function normalizeMatchedPostIds (
  matchedPostIds: string | string[] | number | boolean | null | undefined
): string[] | null {
  if (Array.isArray(matchedPostIds)) {
    return matchedPostIds.map(String)
  }

  if (typeof matchedPostIds !== 'string' || matchedPostIds.length === 0) {
    return null
  }

  try {
    const parsed = JSON.parse(matchedPostIds)
    return Array.isArray(parsed) ? parsed.map(String) : null
  } catch (error) {
    console.error('Failed to parse matched_post_ids:', error)
    return null
  }
}

function elementHasOverflow (element: HTMLElement | null): boolean {
  if (!element) return false

  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  )
}

const iconForType = (type: NotificationType | string) => {
  switch (type) {
    case 'match':
      return { icon: checkmarkCircleOutline, colorClass: 'text-green-600' }
    case 'success':
      return { icon: checkmarkDoneCircleOutline, colorClass: 'text-green-600' }
    case 'acceptance':
      return { icon: checkmarkCircleOutline, colorClass: 'text-green-600' }
    case 'accept':
      return { icon: checkmarkDoneCircleOutline, colorClass: 'text-green-600' }
    case 'info':
      return { icon: informationCircleOutline, colorClass: 'text-blue-600' }
    case 'message':
      return { icon: mailOutline, colorClass: 'text-umak-blue' }
    case 'rejection':
      return { icon: closeCircleOutline, colorClass: 'text-red-600' }
    case 'post_accepted':
      return { icon: checkmarkDoneCircleOutline, colorClass: 'text-green-600' }
    case 'global_announcement':
      return { icon: megaphoneOutline, colorClass: 'text-umak-red' }
    case 'progress':
      return { icon: hourglassOutline, colorClass: 'text-amber-600' }
    case 'delete':
      return { icon: trashOutline, colorClass: 'text-red-600' }
    default:
      return { icon: shieldOutline, colorClass: 'text-slate-700' }
  }
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  type,
  title,
  description,
  read = false,
  actions = [],
  actionSheetHeader = 'Actions',
  notificationId,
  handleMarkAsRead,
  href,
  imageUrl,
  notificationData
}) => {
  const [open, setOpen] = useState(false)
  const { icon, colorClass } = iconForType(type)
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const { setMatchedPostIds, setLostItemPostId } = useNotificationContext()
  const titleRef = useRef<HTMLDivElement | null>(null)
  const descriptionRef = useRef<HTMLDivElement | null>(null)

  // Long-press handling
  const longPressTimeout = useRef<number | null>(null)
  const longPressTriggered = useRef(false)
  const [holding, setHolding] = useState(false)

  const { navigate } = useNavigation()
  useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        window.clearTimeout(longPressTimeout.current)
        longPressTimeout.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (expanded) return

    const updateTruncationState = () => {
      setIsTruncated(
        elementHasOverflow(titleRef.current) ||
          elementHasOverflow(descriptionRef.current)
      )
    }

    updateTruncationState()
    window.addEventListener('resize', updateTruncationState)

    return () => {
      window.removeEventListener('resize', updateTruncationState)
    }
  }, [description, expanded, title])

  const startPress = () => {
    longPressTriggered.current = false
    // indicate the user started pressing
    setHolding(true)
    longPressTimeout.current = window.setTimeout(() => {
      longPressTriggered.current = true
      setOpen(true)
    }, 500)
  }

  const clearPress = () => {
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current)
      longPressTimeout.current = null
    }
    // remove holding visual
    setHolding(false)
  }

  const handlePointerDown = () => startPress()
  const handlePointerUp = () => clearPress()
  const handlePointerLeave = () => clearPress()
  const openLinkedNotification = () => {
    if (!href) return

    if (handleMarkAsRead && notificationId) {
      handleMarkAsRead(notificationId)
    }

    const matchedPostIds = normalizeMatchedPostIds(
      notificationData?.matched_post_ids
    )
    if (matchedPostIds) {
      setMatchedPostIds(matchedPostIds)
    }

    const notificationPostId =
      notificationData?.postId ?? notificationData?.post_id
    if (
      typeof notificationPostId === 'string' ||
      typeof notificationPostId === 'number'
    ) {
      setLostItemPostId(String(notificationPostId))
    }

    navigate(href)
  }

  const handleClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }

    if (href && !expanded) {
      if (isTruncated) {
        setExpanded(true)
      } else {
        openLinkedNotification()
        return
      }
    } else {
      setExpanded(prev => !prev)
    }

    if (handleMarkAsRead && notificationId) {
      handleMarkAsRead(notificationId)
    }
  }

  const sheetButtons = useMemo(
    () =>
      actions.map(a => ({
        text: a.type, // <-- uses "type" as the visible label
        icon: a.icon ?? undefined,
        handler: () => a.onClick(),
        cssClass:
          a.color === 'danger'
            ? 'font-default-font text-[var(--color-umak-blue)]'
            : 'font-default-font text-slate-900'
      })),
    [actions]
  )

  const expandedClassName = expanded
    ? 'line-clamp-none'
    : 'line-clamp-2 truncate'

  return (
    <>
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onClick={() => {
          if (longPressTriggered.current) {
            // ignore click if it was a long-press
            longPressTriggered.current = false
            return
          }
          handleClick()
        }}
        // Use background opacity so children (like the image) aren't made translucent
        // When read && not expanded -> translucent background
        // When read && expanded -> fully opaque background
        className={`flex items-start gap-3 px-3 py-3 border-b border-slate-200 ${
          read
            ? expanded
              ? 'bg-slate-50 opacity-100'
              : 'bg-slate-50 opacity-70'
            : ''
        } ${holding ? 'bg-black/10' : ''}`}
      >
        {/* left icon */}
        <div className={`mt-0.5 ${colorClass}`}>
          <IonIcon icon={icon} style={{ fontSize: 22 }} />
        </div>

        {/* text */}
        <div className='flex-1 min-w-0'>
          <div
            ref={titleRef}
            className={`font-default-font text-[15px] ${
              read ? 'font-default' : 'font-semibold'
            } text-slate-900 ${expandedClassName}`}
          >
            {title}
          </div>
          <div
            ref={descriptionRef}
            className={`font-default-font text-[13px] text-slate-600 ${expandedClassName}`}
          >
            {description}
          </div>
          {expanded && href && (
            <div className='mt-2'>
              <IonButton
                onClick={event => {
                  event.stopPropagation()
                  openLinkedNotification()
                }}
                fill='clear'
                size='small'
                className='min-h-0 text-left'
                style={{
                  '--background': 'transparent',
                  '--background-hover': 'transparent',
                  '--background-activated': 'transparent',
                  '--background-focused': 'transparent',
                  '--box-shadow': 'none',
                  '--padding-start': '0px',
                  '--padding-end': '0px',
                  '--ripple-color': 'transparent'
                }}
              >
                View details
              </IonButton>
            </div>
          )}
          {/* Expanded image (if provided) */}
          {expanded && imageUrl && (
            <div className='mt-3'>
              <ExpandableImage
                src={imageUrl}
                alt='notification-image'
                className='w-full h-60! object-cover rounded'
              />
            </div>
          )}
        </div>

        {/* actions (three dots) */}
        <IonButton
          onClick={e => {
            // Prevent the parent click which toggles expand
            e.stopPropagation()
            setOpen(true)
          }}
          aria-label='Actions'
          fill='clear'
          size='small'
          className='m-0 p-0'
          style={{
            '--background': 'transparent',
            '--background-hover': 'transparent',
            '--background-activated': 'transparent',
            '--background-focused': 'transparent',
            '--box-shadow': 'none',
            '--ripple-color': 'transparent'
          }}
        >
          <IonIcon
            icon={ellipsisVertical}
            slot='icon-only'
            className='text-slate-700'
          />
        </IonButton>
      </div>

      {/* Ionic Action Sheet */}
      <IonActionSheet
        isOpen={open}
        header={actionSheetHeader}
        onDidDismiss={() => setOpen(false)}
        buttons={[
          ...sheetButtons,
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: ['font-default-font', 'text-slate-500']
          }
        ]}
      />
    </>
  )
}

export default NotificationItem
