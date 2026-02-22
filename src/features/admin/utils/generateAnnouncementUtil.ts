import { uploadAndGetPublicUrl } from '@/shared/utils/supabaseStorageUtils'
import { getPhilippineTimeISO } from '@/shared/utils/dateTimeHelpers'
import { notificationApiService } from '@/shared/services'

export type InsertAuditLogFn = (payload: any) => Promise<any>

export async function generateAnnouncementAction (options: {
  title: string
  description: string
  image?: File | null
  insertAuditLog: InsertAuditLogFn
  currentUser: { user_id: string; user_name: string } | null
}): Promise<{ success: boolean; message: string }> {
  const { title, description, image, insertAuditLog, currentUser } = options
  try {
    let imageUrl = ''
    if (image) {
      const path = `announcements/${Date.now()}_${image.name}`
      imageUrl = await uploadAndGetPublicUrl(
        path,
        image,
        image.type || 'image/jpeg'
      )
    }

    // Use provided user info
    const currentUserId = currentUser?.user_id ?? ''
    const currentUserName = currentUser?.user_name ?? ''

    try {
      await notificationApiService.sendAnnouncement({
        userId: currentUserId,
        message: title || 'New Feature Available',
        description: description || 'Check out our latest update with amazing new features!',
        imageUrl: imageUrl || null
      })
    } catch (e) {
      console.error('Failed to send announcement', e)
      return { success: false, message: 'Failed to send announcement notification' }
    }

    const auditPayload = {
      user_id: currentUserId,
      message: title || 'New Feature Available',
      description: description || 'Check out our latest update with amazing new features!'
    }

    try {
      await insertAuditLog({
        user_id: currentUserId ?? '',
        action_type: 'create_announcement',
        details: {
          title: auditPayload.message,
          message: `${currentUserName} has sent a global announcement`,
          description: auditPayload.description,
          timestamp: getPhilippineTimeISO()
        }
      })
    } catch (e) {
      console.error('Failed to insert audit log for announcement', e)
    }

    return {
      success: true,
      message: 'Announcement posted and notifications sent.'
    }
  } catch (e) {
    console.error('Failed to post announcement', e)
    return { success: false, message: 'Failed to post announcement' }
  }
}

// debounce with leading option (immediate)
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait = 1000,
  immediate = true
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function debounced (this: unknown, ...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) {
        fn.apply(this, args)
      }
    }
    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) {
      fn.apply(this, args)
    }
  }
}
