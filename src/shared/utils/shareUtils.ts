/**
 * Share a post using native share API or clipboard fallback
 * @param postId - The ID of the post to share
 * @param domain - The domain prefix (user/staff/admin)
 * @returns Promise with share result
 */
export async function sharePost (
  postId: string,
  domain: 'user' | 'staff' | 'admin' = 'user'
): Promise<{
  success: boolean
  method: 'native' | 'clipboard'
  error?: string
}> {
  try {
    const shareUrl = `${window.location.origin}/${domain}/post/view/${postId}`

    // Try native share API first (mobile)
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this post',
        text: 'Found this interesting post on UMatch',
        url: shareUrl
      })
      return { success: true, method: 'native' }
    }

    // Fallback to clipboard
    await navigator.clipboard.writeText(shareUrl)
    return { success: true, method: 'clipboard' }
  } catch (error) {
    console.error('Error sharing post:', error)
    return {
      success: false,
      method: 'clipboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate share URL for a post
 * @param postId - The ID of the post
 * @param domain - The domain prefix
 */
export function getPostShareUrl (
  postId: string,
  domain: 'user' | 'staff' | 'admin' = 'user'
): string {
  return `${window.location.origin}/${domain}/post/view/${postId}`
}
