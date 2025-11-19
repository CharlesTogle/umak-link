# usePostActions Hook - Usage Guide

## Overview
The `usePostActions` hook provides a clean interface for post operations with automatic user authentication handling. It abstracts away the complexity of user context management and provides ready-to-use functions for components.

## Import

```typescript
import { usePostActions } from '@/features/user/hooks/usePostActions'
```

## API Reference

### Operations Requiring Authentication

#### `createPost(postData)`
Creates a new post for the currently authenticated user.

**Parameters:**
- `postData: CreatePostInput`

**Returns:** `Promise<{ post: Post | null, error: string | null }>`

**Example:**
```typescript
const { createPost } = usePostActions()

const handleSubmit = async (formData) => {
  const { post, error } = await createPost({
    item_name: 'iPhone 13',
    description: 'Lost near library',
    category: 'Electronics',
    status: 'Lost',
    location_last_seen: 'University Library',
    date_last_seen: '2025-10-20'
  })

  if (error) {
    console.error('Failed to create post:', error)
    return
  }

  console.log('Post created:', post)
}
```

---

#### `getUserPosts()`
Gets all posts created by the current user.

**Returns:** `Promise<{ posts: Post[] | null, error: string | null }>`

**Example:**
```typescript
const { getUserPosts } = usePostActions()

useEffect(() => {
  const loadMyPosts = async () => {
    const { posts, error } = await getUserPosts()
    if (error) {
      console.error('Failed to load posts:', error)
      return
    }
    setMyPosts(posts)
  }
  loadMyPosts()
}, [getUserPosts])
```

---

#### `updatePost(updateData)`
Updates an existing post. User must be authenticated.

**Parameters:**
- `updateData: UpdatePostInput` (must include `post_id`)

**Returns:** `Promise<{ post: Post | null, error: string | null }>`

**Example:**
```typescript
const { updatePost } = usePostActions()

const handleStatusChange = async (postId: string) => {
  const { post, error } = await updatePost({
    post_id: postId,
    status: 'Found'
  })

  if (error) {
    console.error('Failed to update post:', error)
    return
  }

  console.log('Post updated:', post)
}
```

---

#### `deletePost(postId)`
Deletes a post. User must be authenticated.

**Parameters:**
- `postId: string`

**Returns:** `Promise<{ success: boolean, error: string | null }>`

**Example:**
```typescript
const { deletePost } = usePostActions()

const handleDelete = async (postId: string) => {
  const { success, error } = await deletePost(postId)

  if (error) {
    console.error('Failed to delete post:', error)
    return
  }

  console.log('Post deleted successfully')
}
```

---

### Public Operations (No Auth Required)

#### `getPost(postId)`
Gets a single post by ID. No authentication required.

**Parameters:**
- `postId: string`

**Returns:** `Promise<{ post: Post | null, error: string | null }>`

**Example:**
```typescript
const { getPost } = usePostActions()

const loadPost = async (id: string) => {
  const { post, error } = await getPost(id)
  if (error) {
    console.error('Failed to load post:', error)
    return
  }
  setPost(post)
}
```

---

#### `getPosts(filters?)`
Gets all posts with optional filters. No authentication required.

**Parameters:**
- `filters?: { status?, category?, userId?, limit?, offset? }`

**Returns:** `Promise<{ posts: Post[] | null, error: string | null }>`

**Example:**
```typescript
const { getPosts } = usePostActions()

// Get all lost items
const { posts, error } = await getPosts({ 
  status: 'Lost',
  limit: 20 
})

// Get electronics only
const { posts, error } = await getPosts({ 
  category: 'Electronics' 
})

// Pagination
const { posts, error } = await getPosts({ 
  limit: 10,
  offset: 20 
})
```

---

#### `searchPosts(searchTerm, filters?)`
Searches posts by item name or description. No authentication required.

**Parameters:**
- `searchTerm: string`
- `filters?: { status?, category?, limit? }`

**Returns:** `Promise<{ posts: Post[] | null, error: string | null }>`

**Example:**
```typescript
const { searchPosts } = usePostActions()

const handleSearch = async (query: string) => {
  const { posts, error } = await searchPosts(query, {
    status: 'Lost',
    limit: 50
  })

  if (error) {
    console.error('Search failed:', error)
    return
  }

  setSearchResults(posts)
}
```

---

## Complete Component Example

```typescript
import { useState } from 'react'
import { usePostActions } from '@/features/user/hooks/usePostActions'
import type { Post } from '@/features/auth/services/postServices'

export function CreatePostPage() {
  const { createPost } = usePostActions()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { post, error } = await createPost({
      item_name: 'Lost Wallet',
      description: 'Black leather wallet',
      category: 'Other',
      status: 'Lost',
      location_last_seen: 'Cafeteria',
      date_last_seen: '2025-10-21'
    })

    setLoading(false)

    if (error) {
      alert(`Error: ${error}`)
      return
    }

    alert('Post created successfully!')
    // Navigate to post detail page
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}
```

```typescript
import { useState, useEffect } from 'react'
import { usePostActions } from '@/features/user/hooks/usePostActions'
import type { Post } from '@/features/auth/services/postServices'

export function MyPostsPage() {
  const { getUserPosts, deletePost } = usePostActions()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      const { posts, error } = await getUserPosts()
      
      if (error) {
        console.error('Error:', error)
        setLoading(false)
        return
      }

      setPosts(posts || [])
      setLoading(false)
    }

    loadPosts()
  }, [getUserPosts])

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return

    const { success, error } = await deletePost(postId)
    
    if (error) {
      alert(`Error: ${error}`)
      return
    }

    // Remove from local state
    setPosts(prev => prev.filter(p => p.post_id !== postId))
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>My Posts</h1>
      {posts.map(post => (
        <div key={post.post_id}>
          <h3>{post.item_name}</h3>
          <p>{post.description}</p>
          <button onClick={() => handleDelete(post.post_id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## Error Handling

The hook automatically catches authentication errors and other exceptions:

```typescript
const { createPost } = usePostActions()

const { post, error } = await createPost(data)

if (error) {
  // Common errors:
  // - "No user is currently logged in" (from getUser)
  // - "User data not found in database"
  // - Supabase errors (permissions, network, etc.)
  // - "Failed to create post" (generic error)
  
  console.error(error)
  // Show error to user
}
```

---

## Notes

- **Authentication**: Functions like `createPost`, `getUserPosts`, `updatePost`, and `deletePost` require the user to be logged in. They will throw an error if no user is authenticated.

- **Ownership Verification**: The current implementation includes TODO comments for ownership verification in `updatePost` and `deletePost`. In production, you should verify that the authenticated user owns the post before allowing modifications.

- **Public Access**: Functions like `getPost`, `getPosts`, and `searchPosts` are public and don't require authentication, allowing any user to view posts.

---

## Benefits

✅ **Clean Component Code** - No manual user management in components  
✅ **Automatic Authentication** - User context is handled automatically  
✅ **Error Handling** - Errors are caught and returned in a consistent format  
✅ **Type Safety** - Full TypeScript support  
✅ **Reusable** - Use across multiple components  
✅ **Testable** - Easy to mock for unit tests  
✅ **Flexible** - Service layer remains independent for admin features
