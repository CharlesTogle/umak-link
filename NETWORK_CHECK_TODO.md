# Network Connectivity Check - Implementation TODO

## Summary
All Supabase database operations need to be wrapped with `Network.getStatus()` checks to handle offline scenarios gracefully.

## Completed Files
- ✅ `src/features/staff/pages/ClaimItem.tsx` - Added network checks for:
  - Loading post on mount
  - Fetching lost item post
  - Submitting claim

## Pattern to Follow

```typescript
import { Network } from '@capacitor/network'

// Before any Supabase operation:
const status = await Network.getStatus()
if (!status.connected) {
  // Show error message to user
  setToast({
    show: true,
    message: 'No internet connection. Please check your network.',
    color: 'danger'
  })
  return
}

// Proceed with Supabase operation
```

## Files Requiring Network Checks

### High Priority (User-Facing Operations)

#### Posts Data Layer
1. **`src/features/posts/data/posts.ts`**
   - `getTotalPostsCount()` - line 19
   - `getPost()` - line 33
   - `listOwnPosts()` - line 108
   - `getOwnPostsCount()` - line 131
   - `searchPosts()` - line 175
   - `listPublicPosts()` - line 239
   - `getPublicPostCount()` - line 298
   - `listPublicPostsWithinRange()` - line 365

2. **`src/features/posts/data/postsRefresh.ts`**
   - `refreshSinglePost()` - line 25
   - `refreshPublicPosts()` - line 81
   - `refreshOwnPosts()` - line 134
   - `refreshPublicPostsByIds()` - line 187

#### User Services
3. **`src/features/user/services/postServices.tsx`**
   - `updateItemMetadata()` - line 166
   - `createPost()` - line 255
   - `createFraudReport()` - line 308
   - `getMyPost()` - line 352
   - `updatePostStatus()` - line 452

4. **`src/features/user/hooks/useSearch.tsx`**
   - `performSearch()` - line 199

5. **`src/features/user/hooks/usePostActions.tsx`**
   - `acceptPost()` - line 76
   - `rejectPost()` - line 167

6. **`src/features/user/hooks/useNotifications.ts`**
   - `sendNotification()` - line 61
   - `getUnreadCount()` - line 90
   - `getNotifications()` - line 117
   - `markAsRead()` - line 167
   - `deleteNotification()` - line 212

7. **`src/features/user/hooks/useUnreadNotificationCount.ts`**
   - `fetchUnreadCount()` - line 114
   - Realtime subscription setup - line 156

#### Staff Services
8. **`src/features/staff/hooks/usePostStaffServices.tsx`**
   - `createPost()` - line 38
   - Other operations - line 92+

9. **`src/features/staff/hooks/useFraudReports.tsx`**
   - `getUser()` calls - lines 465, 626

#### Admin Services
10. **`src/features/admin/hooks/useStaffSearch.ts`**
    - `search_users_secure()` - line 128
    - `search_users_secure_staff()` - line 135

11. **`src/features/admin/data/dashboardStats.ts`**
    - `getDashboardStats()` - line 16

#### Audit Logs
12. **`src/shared/hooks/useAuditLogs.tsx`**
    - `insertAuditLog()` - line 34
    - `getAuditLogs()` - line 60
    - `getAuditLogsWithUserDetails()` - line 89
    - `getAuditLogsByUserId()` - line 120
    - `getAuditLogsByAction()` - line 152

#### Storage Operations
13. **`src/shared/utils/supabaseStorageUtils.ts`**
    - `uploadImageToSupabase()` - line 8
    - All storage operations

### Medium Priority (Background Operations)

#### Authentication
14. **`src/features/auth/services/authServices.tsx`**
    - `signInWithIdToken()` - line 52
    - `signOut()` - line 155

15. **`src/features/auth/contexts/UserContext.tsx`**
    - `getUser()` - line 64
    - `signOut()` - line 126

### Implementation Notes

1. **User Feedback**: Always provide clear feedback when offline:
   - Toast notifications
   - Inline error messages
   - Disabled state for buttons

2. **Retry Logic**: Consider implementing retry logic for critical operations

3. **Caching**: Leverage existing cache mechanisms when offline

4. **Realtime Subscriptions**: Handle disconnections gracefully
   - Remove channels when going offline
   - Reconnect when coming back online

5. **Error Handling**: Distinguish between:
   - Network errors (offline)
   - Server errors (online but failed)
   - Data errors (validation, etc.)

## Helper Utility

A network check utility has been created at:
`src/shared/utils/networkCheck.ts`

It provides:
- `isConnected()` - Simple connectivity check
- `executeIfOnline()` - Execute function only if online
- `supabaseWithNetworkCheck()` - Wrapper for Supabase operations

## Testing Checklist

For each file updated:
- [ ] Test with network disabled
- [ ] Test with slow network (throttling)
- [ ] Test network loss during operation
- [ ] Test network restoration
- [ ] Verify error messages are user-friendly
- [ ] Check that UI doesn't break

## Additional Considerations

1. **Queue Failed Operations**: Consider implementing a queue for failed operations to retry when connection is restored

2. **Optimistic Updates**: Update UI optimistically, then sync with server

3. **Background Sync**: Use Capacitor's background sync capabilities for critical operations

4. **Network Status Monitoring**: Consider adding a global network status indicator in the UI
