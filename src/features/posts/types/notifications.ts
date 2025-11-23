// types/notifications.ts
export type NotificationType =
  | 'match'
  | 'success'
  | 'info'
  | 'message'
  | 'rejection'
  | 'post_accepted'
  | 'global_announcement'
  | 'progress'
  | 'found'
  | 'resolved'

/**
 * Shape mapped from DB `notification_table`.
 * notification_id is a UUID string in the DB; created_at is ISO timestamp.
 */
export interface NotificationData {
  notification_id: string
  type: NotificationType | string
  title?: string | null
  description?: string | null
  is_read?: boolean | null
  created_at?: string | null
  data?: any
  sent_to?: string | null
  sent_by?: string | null
  item_id?: string | null
  image_url?: string | null
}

export interface ActionItem {
  color: 'danger' | 'primary' // "danger" → umak-blue, "primary" → slate-900 (per your spec)
  type: string
  onClick: () => void
  icon: string // ionicon name, e.g. trashOutline
}
