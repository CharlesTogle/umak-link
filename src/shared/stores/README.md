# Zustand Global Stores

This directory contains global state management stores using Zustand for the UMak LINK application.

## Available Stores

### 1. Search Store (`useSearchStore`)
Manages search result post IDs for displaying similar items.

**Usage:**
```typescript
import { useSearchStore } from '@/shared/stores'

function SearchComponent() {
  // Get state and actions
  const searchResultPostIds = useSearchStore(state => state.searchResultPostIds)
  const setSearchResults = useSearchStore(state => state.setSearchResults)
  const addSearchResult = useSearchStore(state => state.addSearchResult)
  const clearSearchResults = useSearchStore(state => state.clearSearchResults)
  const hasPostId = useSearchStore(state => state.hasPostId)
  
  // Set multiple search results
  const handleSearch = async () => {
    const results = await fetchSearchResults()
    setSearchResults(results.map(r => r.post_id))
  }
  
  // Add single result
  const handleAddSimilarItem = (postId: string) => {
    addSearchResult(postId)
  }
  
  // Check if post exists
  const isSimilar = hasPostId('some-post-id')
  
  // Clear results
  const handleClearSearch = () => {
    clearSearchResults()
  }
  
  return (
    <div>
      <p>Found {searchResultPostIds.length} similar items</p>
      {searchResultPostIds.map(id => (
        <div key={id}>Post: {id}</div>
      ))}
    </div>
  )
}
```

**Available Methods:**
- `setSearchResults(postIds: string[])` - Replace all search results
- `addSearchResult(postId: string)` - Add a single post ID (no duplicates)
- `removeSearchResult(postId: string)` - Remove a specific post ID
- `clearSearchResults()` - Clear all search results
- `hasPostId(postId: string)` - Check if a post ID exists

---

### 2. Notification Store (`useNotificationStore`)
Manages notification-related post IDs for showing similar items in notifications.

**Usage:**
```typescript
import { useNotificationStore } from '@/shared/stores'

function NotificationComponent() {
  // Get state and actions
  const notificationPostIds = useNotificationStore(state => state.notificationPostIds)
  const setNotifications = useNotificationStore(state => state.setNotifications)
  const addNotification = useNotificationStore(state => state.addNotification)
  const clearNotifications = useNotificationStore(state => state.clearNotifications)
  const getCount = useNotificationStore(state => state.getCount)
  
  // Set multiple notification post IDs
  const handleNewNotifications = (postIds: string[]) => {
    setNotifications(postIds)
  }
  
  // Add single notification
  const handleAddNotification = (postId: string) => {
    addNotification(postId)
  }
  
  // Get count
  const count = getCount()
  
  return (
    <div>
      <p>You have {count} similar items</p>
      {notificationPostIds.map(id => (
        <div key={id}>Similar post: {id}</div>
      ))}
    </div>
  )
}
```

**Available Methods:**
- `setNotifications(postIds: string[])` - Replace all notification post IDs
- `addNotification(postId: string)` - Add a single post ID (no duplicates)
- `removeNotification(postId: string)` - Remove a specific post ID
- `clearNotifications()` - Clear all notification post IDs
- `hasPostId(postId: string)` - Check if a post ID exists
- `getCount()` - Get total count of notification post IDs

---

## Installation

Make sure zustand is installed:
```bash
npm install zustand
```

## Common Patterns

### Using Multiple Stores Together
```typescript
import { useSearchStore, useNotificationStore } from '@/shared/stores'

function SimilarItemsPage() {
  const searchResults = useSearchStore(state => state.searchResultPostIds)
  const notificationResults = useNotificationStore(state => state.notificationPostIds)
  
  // Combine results
  const allSimilarItems = [...new Set([...searchResults, ...notificationResults])]
  
  return <div>Total similar items: {allSimilarItems.length}</div>
}
```

### Optimized Selector (prevent re-renders)
```typescript
// Only re-render when count changes, not when array content changes
const count = useSearchStore(state => state.searchResultPostIds.length)

// Only re-render when specific post ID presence changes
const hasSimilarItem = useSearchStore(state => 
  state.hasPostId('specific-post-id')
)
```

### Subscribing Outside React Components
```typescript
import { useSearchStore } from '@/shared/stores'

// Subscribe to changes
const unsubscribe = useSearchStore.subscribe(
  state => state.searchResultPostIds,
  (postIds) => {
    console.log('Search results updated:', postIds)
  }
)

// Cleanup
unsubscribe()
```

## Best Practices

1. **Selective Subscriptions**: Only subscribe to the specific state you need to avoid unnecessary re-renders
   ```typescript
   // ❌ Bad - re-renders on any state change
   const store = useSearchStore()
   
   // ✅ Good - only re-renders when searchResultPostIds changes
   const postIds = useSearchStore(state => state.searchResultPostIds)
   ```

2. **Batch Updates**: When updating multiple times, consider batching
   ```typescript
   const addMultipleResults = (newIds: string[]) => {
     setSearchResults([...searchResultPostIds, ...newIds])
   }
   ```

3. **Persistence**: Consider persisting to storage for offline support
   ```typescript
   import { persist } from 'zustand/middleware'
   
   // Can be added to store configuration if needed
   ```

4. **Clear on Logout**: Remember to clear stores when user logs out
   ```typescript
   const handleLogout = () => {
     clearSearchResults()
     clearNotifications()
     // ... other logout logic
   }
   ```
