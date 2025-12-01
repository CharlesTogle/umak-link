import { supabase } from '@/shared/lib/supabase'
import { uploadAndGetPublicUrl } from '@/shared/utils/supabaseStorageUtils'
import { getPhilippineTimeISO } from '@/shared/utils/dateTimeHelpers'

export type InsertAuditLogFn = (payload: any) => Promise<any>

export async function generateAnnouncementAction (options: {
  title: string
  description: string
  image?: File | null
  insertAuditLog: InsertAuditLogFn
}): Promise<{ success: boolean; message: string }> {
  const { title, description, image, insertAuditLog } = options
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

    // get current user id and name
    let currentUserId: string | null = null
    let currentUserName = ''
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      currentUserId = user?.id ?? null
      if (currentUserId) {
        const { data: udata, error: uerr } = await supabase
          .from('user_table')
          .select('user_name')
          .eq('user_id', currentUserId)
          .single()
        if (!uerr && udata) {
          currentUserName = (udata as any).user_name ?? ''
        }
      }
    } catch (e) {
      console.error('Failed to get current user', e)
    }

    const payload = {
      user_id: currentUserId ?? '',
      message: title || 'New Feature Available',
      description:
        description || 'Check out our latest update with amazing new features!',
      image_url: imageUrl || ''
    }

    try {
      await supabase.functions.invoke('send-global-announcements', {
        body: payload
      })
    } catch (e) {
      console.error('Failed to invoke edge function', e)
    }

    try {
      await insertAuditLog({
        user_id: currentUserId ?? '',
        action_type: 'create_announcement',
        details: {
          title: payload.message,
          message: `${currentUserName} has sent a global announcement`,
          description: payload.description,
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
