import { useState } from 'react'
import { Network } from '@capacitor/network'
import { getMissingItem } from '@/features/posts/data/posts'
import type { PublicPost } from '@/features/posts/types/post'

export function useClaimItemPostValidation () {
  const [lostItemPost, setLostItemPost] = useState<PublicPost | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndFetchPost = async (itemId: string) => {
    try {
      setError(null)

      // Check network connectivity first
      const status = await Network.getStatus()
      if (!status.connected) {
        setError('No internet connection. Please check your network.')
        setLostItemPost(null)
        return
      }

      // Validate that itemId is not empty
      if (!itemId || !itemId.trim()) {
        setError('Please enter a valid Item ID.')
        setLostItemPost(null)
        return
      }

      setLoading(true)
      const fetchedItem = await getMissingItem(itemId.trim())

      if (!fetchedItem) {
        setError('Post not found. Please check the Item ID and try again.')
        setLostItemPost(null)
        return
      }

      // Validate that the post is a 'missing' item, not 'found'
      if (fetchedItem.item_type === 'found') {
        setError(
          'This is a Found item post. Please enter a Missing item ID instead.'
        )
        setLostItemPost(null)
        return
      }

      // Validate that the item hasn't been returned already
      if (fetchedItem.item_status === 'returned') {
        setError('This item has already been returned and cannot be linked.')
        setLostItemPost(null)
        return
      }

      if (fetchedItem.post_status !== 'accepted') {
        setError(
          'This post is not accepted yet. Only accepted posts can be claimed.'
        )
        setLostItemPost(null)
        return
      }

      setLostItemPost(fetchedItem)
      setError(null)
    } catch (err) {
      console.error('Error fetching lost item post:', err)
      setError('Failed to load post. Please try again.')
      setLostItemPost(null)
    } finally {
      setLoading(false)
    }
  }

  const clearPost = () => {
    setLostItemPost(null)
    setError(null)
    setLoading(false)
  }

  return {
    lostItemPost,
    loading,
    error,
    validateAndFetchPost,
    clearPost
  }
}
