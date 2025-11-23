import React, { createContext, useCallback, useContext, useState } from 'react'

type NotificationContextType = {
  notificationPostIds: string[]
  matchedPostIds: string[]
  lostItemPostId: string | null
  setNotifications: (postIds: string[]) => void
  setMatchedPostIds: (postIds: string[]) => void
  setLostItemPostId: (postId: string | null) => void
  addNotification: (postId: string) => void
  removeNotification: (postId: string) => void
  clearNotifications: () => void
  clearMatchedPostIds: () => void
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
  const [matchedPostIds, setMatchedPostIdsState] = useState<string[]>([])
  const [lostItemPostId, setLostItemPostIdState] = useState<string | null>(null)

  const setNotifications = useCallback((postIds: string[]) => {
    setNotificationPostIds(postIds)
  }, [])

  const setMatchedPostIds = useCallback((postIds: string[]) => {
    setMatchedPostIdsState(postIds)
  }, [])

  const setLostItemPostId = useCallback((postId: string | null) => {
    setLostItemPostIdState(postId)
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

  const clearMatchedPostIds = useCallback(() => {
    setMatchedPostIdsState([])
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
        matchedPostIds,
        lostItemPostId,
        setNotifications,
        setMatchedPostIds,
        setLostItemPostId,
        addNotification,
        removeNotification,
        clearNotifications,
        clearMatchedPostIds,
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
