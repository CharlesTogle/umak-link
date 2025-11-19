import React, { createContext, useCallback, useContext, useState } from 'react'

type NotificationContextType = {
  notificationPostIds: string[]
  setNotifications: (postIds: string[]) => void
  addNotification: (postId: string) => void
  removeNotification: (postId: string) => void
  clearNotifications: () => void
  hasPostId: (postId: string) => boolean
  getCount: () => number
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [notificationPostIds, setNotificationPostIds] = useState<string[]>([])

  const setNotifications = useCallback((postIds: string[]) => {
    setNotificationPostIds(postIds)
  }, [])

  const addNotification = useCallback((postId: string) => {
    setNotificationPostIds(prev =>
      prev.includes(postId) ? prev : [...prev, postId]
    )
  }, [])

  const removeNotification = useCallback((postId: string) => {
    setNotificationPostIds(prev => prev.filter(id => id !== postId))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotificationPostIds([])
  }, [])

  const hasPostId = useCallback(
    (postId: string) => {
      return notificationPostIds.includes(postId)
    },
    [notificationPostIds]
  )

  const getCount = useCallback(
    () => notificationPostIds.length,
    [notificationPostIds]
  )

  return (
    <NotificationContext.Provider
      value={{
        notificationPostIds,
        setNotifications,
        addNotification,
        removeNotification,
        clearNotifications,
        hasPostId,
        getCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext (): NotificationContextType {
  const ctx = useContext(NotificationContext)
  if (!ctx)
    throw new Error(
      'useNotificationContext must be used within NotificationProvider'
    )
  return ctx
}

export default NotificationContext
