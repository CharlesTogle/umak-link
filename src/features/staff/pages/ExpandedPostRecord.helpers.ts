import { claimApiService } from '@/shared/services'
import { getPostFull } from '@/features/posts/data/posts'

/**
 * Formats a date/time value for display
 */
export const formatDateTime = (value?: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Gets the color associated with a status
 */
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return '#16a34a' // green-600
    case 'rejected':
      return '#C1272D' // umak-red
    case 'pending':
      return '#d97706' // amber-600
    case 'claimed':
    case 'returned':
      return '#16a34a' // green-600
    case 'unclaimed':
    case 'lost':
      return '#d97706' // amber-600
    case 'fraud':
      return '#b91c1c' // red-700
    case 'discarded':
      return '#C1272D' // umak-red
    default:
      return '#f59e0b' // amber-500
  }
}

/**
 * Gets available post status options
 */
export const getStatusOptions = () => {
  return ['pending', 'accepted', 'rejected']
}

/**
 * Gets available item status options based on item type
 */
export const getItemStatusOptions = (itemType?: string) => {
  if (!itemType) return []

  // Filter based on item type
  if (itemType === 'found') {
    return ['claimed', 'unclaimed', 'discarded']
  } else {
    // missing items
    return ['returned', 'lost']
  }
}

/**
 * Validates if item status is allowed based on selected post status
 */
export const isItemStatusAllowed = (
  itemStatus: string,
  selectedStatus: string | null
) => {
  if (!selectedStatus) return true

  switch (selectedStatus) {
    case 'pending':
      return itemStatus === 'unclaimed'
    case 'accepted':
      return true // All item statuses allowed
    case 'rejected':
      return itemStatus === 'unclaimed' || itemStatus === 'discarded'
    default:
      return true
  }
}

/**
 * Validates if post status is allowed based on selected item status
 */
export const isPostStatusAllowed = (
  postStatus: string,
  selectedItemStatus: string | null
) => {
  if (!selectedItemStatus) return true

  switch (selectedItemStatus) {
    case 'claimed':
    case 'returned':
      return postStatus === 'accepted'
    case 'unclaimed':
    case 'lost':
      return true // All post statuses allowed
    case 'discarded':
      return postStatus === 'rejected' || postStatus === 'accepted'
    default:
      return true
  }
}

/**
 * Deletes claim record and updates linked missing item status
 */
export const deleteClaimAndUpdateLinkedItem = async (itemId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Use the backend API to delete the claim and update linked item
    const result = await claimApiService.deleteClaimByItem(itemId)
    return { success: result.success }
  } catch (err: any) {
    console.error('Exception deleting claim record:', err)
    return { success: false, error: err.message || 'Failed to delete claim record' }
  }
}

/**
 * Performs the status change operation
 */
export const performStatusChangeOperation = async (params: {
  record: any
  selectedStatus: string | null
  selectedItemStatus: string | null
  updatePostStatusWithNotification: (
    postId: string,
    status: 'accepted' | 'rejected' | 'pending',
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>
  updateItemStatus: (
    postId: string,
    status: 'claimed' | 'unclaimed' | 'discarded' | 'returned' | 'lost'
  ) => Promise<{ success: boolean; error?: string }>
}) => {
  const {
    record,
    selectedStatus,
    selectedItemStatus,
    updatePostStatusWithNotification,
    updateItemStatus
  } = params

  try {
    // Update post status if selected
    if (selectedStatus && selectedStatus !== record.post_status) {
      const result = await updatePostStatusWithNotification(
        record.post_id,
        selectedStatus as 'accepted' | 'rejected' | 'pending'
      )

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to update post status'
        }
      }
    }

    // Update item status if selected
    if (selectedItemStatus && selectedItemStatus !== record.item_status) {
      // If changing from claimed to any other status, delete the claim record
      if (
        record.item_status === 'claimed' &&
        selectedItemStatus !== 'claimed'
      ) {
        const deleteResult = await deleteClaimAndUpdateLinkedItem(
          record.item_id
        )

        if (!deleteResult.success) {
          return {
            success: false,
            error: deleteResult.error
          }
        }
      }

      const itemStatusResult = await updateItemStatus(
        record.post_id,
        selectedItemStatus as
          | 'claimed'
          | 'unclaimed'
          | 'discarded'
          | 'returned'
          | 'lost'
      )

      if (!itemStatusResult.success) {
        return {
          success: false,
          error: itemStatusResult.error || 'Failed to update item status'
        }
      }
    }

    // Refresh the record
    const updatedData = await getPostFull(record.post_id)

    return {
      success: true,
      updatedRecord: updatedData
    }
  } catch (err) {
    console.error('Error applying status change', err)
    return {
      success: false,
      error: 'Failed to apply status change'
    }
  }
}
