import { useState } from 'react'
import { Network } from '@capacitor/network'
import { getPost } from '@/features/posts/data/posts'
import type { PublicPost } from '@/features/posts/types/post'

export function useClaimItemPostValidation () {
  const [lostItemPost, setLostItemPost] = useState<PublicPost | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndFetchPost = async (url: string) => {
    try {
      setError(null)

      // Check network connectivity first
      const status = await Network.getStatus()
      if (!status.connected) {
        setError('No internet connection. Please check your network.')
        setLostItemPost(null)
        return
      }

      // Extract post ID from URL patterns:
      // root-link/staff/post/view/:postId or root-link/user/post/view/:postId
      const postIdMatch = url.match(/\/(?:staff|user)\/post\/view\/([^/?]+)/)

      if (!postIdMatch || !postIdMatch[1]) {
        setError('Invalid post link format. Please use a valid post URL.')
        setLostItemPost(null)
        return
      }

      const extractedPostId = postIdMatch[1]

      setLoading(true)
      const fetchedPost = await getPost(extractedPostId)

      if (!fetchedPost) {
        setError('Post not found. Please check the link and try again.')
        setLostItemPost(null)
        return
      }

      // Validate that the post is a 'missing' item, not 'found'
      if (fetchedPost.item_type === 'found') {
        setError(
          'This is a Found item post. Please link to a Missing item post instead.'
        )
        setLostItemPost(null)
        return
      }

      // Validate that the item hasn't been returned already
      if (fetchedPost.item_status === 'returned') {
        setError('This item has already been returned and cannot be linked.')
        setLostItemPost(null)
        return
      }

      setLostItemPost(fetchedPost)
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
