# API Migration Guide

This guide explains how to use the new backend API services in the UMak-LINK frontend.

## Overview

All Supabase direct calls have been replaced with backend API calls for security and centralization. The frontend now communicates with the Fastify backend, which handles:

- Authentication (JWT tokens)
- Database operations (via Supabase service role)
- File uploads (signed URLs)
- Push notifications (Firebase FCM)
- AI operations (Gemini API - server-side only)

## Quick Start

### 1. Start the Backend

```bash
cd ../umak-link-backend
pnpm run dev
```

The backend runs on `http://localhost:8080` by default.

### 2. Configure Frontend

Ensure `VITE_API_URL` is set in `.env`:

```bash
VITE_API_URL=http://localhost:8080
```

### 3. Use API Services

Import from the centralized services:

```typescript
import { postApiService, searchApiService, api } from '@/shared/services';
```

## API Services

### Authentication

**File**: `src/features/auth/services/authServices.tsx`

```typescript
// Login with Google
const response = await api.auth.loginWithGoogle(googleIdToken);
api.setToken(response.token); // Store JWT

// Get current user
const { user } = await api.auth.getMe();

// Logout
api.setToken(null); // Clear JWT
```

**User Context**: `src/features/auth/contexts/UserContext.tsx`
- Automatically uses `api.auth.getMe()` to fetch user
- Stores JWT token in localStorage via `api.setToken()`

### Posts

**File**: `src/shared/services/postApiService.ts`

```typescript
import { postApiService } from '@/shared/services';

// Create post
const { post_id } = await postApiService.createPost({
  anonymous: false,
  item: { title: 'Lost Phone', desc: 'iPhone 13', type: 'lost' },
  category: 'Electronics',
  lastSeenISO: '2026-02-04T10:00:00Z',
  locationDetails: { level1: 'Building A', level2: 'Floor 3', level3: 'Room 301' },
  imageName: 'phone.jpg',
  image: fileObject,
  userId: user.user_id,
});

// List posts
const posts = await postApiService.listPublicPosts();

// Get single post
const post = await postApiService.getPost(postId);

// Update status (staff only)
await postApiService.updatePostStatus(postId, 'accepted');

// Delete post
await postApiService.deletePost(postId);
```

### Search

**File**: `src/shared/services/searchApiService.ts`

```typescript
import { searchApiService } from '@/shared/services';

// User search
const results = await searchApiService.searchItems({
  query: 'phone',
  category: ['Electronics'],
  itemStatus: ['unclaimed'],
  sort: 'submission_date',
  sortDirection: 'desc',
});

// Staff search (additional filters)
const results = await searchApiService.searchItemsStaff({
  query: 'phone',
  sort: 'accepted_on_date',
});

// Search users (staff/admin)
const users = await searchApiService.searchUsers('john@umak.edu.ph');
```

### Claims

**File**: `src/shared/services/claimApiService.ts`

```typescript
import { claimApiService } from '@/shared/services';

// Process claim (staff only)
const { claim_id } = await claimApiService.processClaim({
  foundPostId: 123,
  missingPostId: 456,
  claimDetails: {
    claimer_name: 'John Doe',
    claimer_school_email: 'john@umak.edu.ph',
    claimer_contact_num: '09123456789',
    poster_name: 'Jane Smith',
    staff_id: staffUser.user_id,
    staff_name: staffUser.user_name,
  },
});

// Check existing claim
const { exists, claim } = await claimApiService.checkExistingClaim(itemId);
```

### Fraud Reports

**File**: `src/shared/services/fraudReportApiService.ts`

```typescript
import { fraudReportApiService } from '@/shared/services';

// Create fraud report
const { report_id } = await fraudReportApiService.createReport({
  post_id: 123,
  reason: 'Fraudulent claim',
  proof_image_url: 'https://...',
  reported_by: user.user_id,
});

// List reports (staff only)
const reports = await fraudReportApiService.listReports();

// Update status (staff only)
await fraudReportApiService.updateStatus(reportId, 'verified');

// Resolve report (staff only)
await fraudReportApiService.resolveReport(reportId, true);
```

### Notifications

**File**: `src/shared/services/notificationApiService.ts`

```typescript
import { notificationApiService } from '@/shared/services';

// Send notification (staff only)
await notificationApiService.sendNotification({
  user_id: targetUser.user_id,
  title: 'Item Found',
  body: 'Your item may have been found!',
  type: 'match',
  data: { post_id: 123 },
});

// List notifications
const notifications = await notificationApiService.listNotifications();

// Get unread count
const count = await notificationApiService.getUnreadCount();

// Mark as read
await notificationApiService.markAsRead(notificationId);

// Send announcement (staff only)
await notificationApiService.sendAnnouncement({
  userId: staff.user_id,
  message: 'System maintenance scheduled',
  description: 'Details here...',
});
```

### Storage

File uploads now use signed URLs via the backend:

```typescript
import api from '@/shared/lib/api';

// Get upload URL
const uploadData = await api.storage.getUploadUrl(
  'items', // or 'profilePictures'
  'file.jpg',
  'image/jpeg'
);

// Upload to Supabase Storage
await fetch(uploadData.uploadUrl, {
  method: 'PUT',
  body: fileBlob,
  headers: { 'Content-Type': 'image/jpeg' },
});

// Confirm upload
await api.storage.confirmUpload('items', uploadData.objectPath);

// Use public URL
console.log(uploadData.publicUrl);
```

### Admin

**File**: `src/shared/services/adminApiService.ts`

```typescript
import { adminApiService } from '@/shared/services';

// Get dashboard stats (admin only)
const stats = await adminApiService.getDashboardStats();

// Insert audit log (staff/admin)
await adminApiService.insertAuditLog({
  userId: user.user_id,
  action: 'update',
  tableName: 'post_table',
  recordId: '123',
  changes: { status: 'accepted' },
});

// Get audit logs (admin only)
const logs = await adminApiService.getAuditLogs(100, 0);
```

## Deprecated Features

### ❌ Client-Side Gemini API

**File**: `src/shared/lib/geminiApi.ts` (now stubbed)

- `callGeminiApi()` - ❌ Deprecated
- `generateItemMetadata()` - ❌ Deprecated

**Why?** Security - API keys must stay server-side.

**What now?**
- Metadata is generated **automatically** by the backend after post creation
- Backend job runs every 10 minutes: `/jobs/metadata-batch`
- Item matching runs automatically: `/jobs/pending-match`

### ❌ Direct Supabase Calls

All `supabase.from()`, `supabase.auth.*`, `supabase.storage.*` calls should be replaced with API service calls.

## Error Handling

The API client throws `ApiError` for failed requests:

```typescript
import { ApiError } from '@/shared/lib/api';

try {
  await postApiService.createPost(data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error (${error.statusCode}):`, error.message);
    if (error.statusCode === 401) {
      // Unauthorized - redirect to login
      api.setToken(null);
      router.push('/auth');
    }
  }
}
```

## Migration Checklist

To migrate existing code:

1. ✅ Replace `supabase.auth.*` with `api.auth.*`
2. ✅ Replace `supabase.from('post_table').*` with `postApiService.*`
3. ✅ Replace `supabase.from('user_table').*` with `api.auth.getMe()`
4. ✅ Replace search RPC calls with `searchApiService.*`
5. ✅ Replace claim RPC calls with `claimApiService.*`
6. ✅ Replace fraud report calls with `fraudReportApiService.*`
7. ✅ Replace notification calls with `notificationApiService.*`
8. ✅ Replace storage calls with `api.storage.*`
9. ✅ Remove `callGeminiApi()` / `generateItemMetadata()` calls
10. ✅ Store JWT with `api.setToken()` after login
11. ✅ Check for `api.getToken()` to verify authentication

## Testing

1. Start backend: `cd ../umak-link-backend && pnpm run dev`
2. Start frontend: `pnpm run dev`
3. Test login flow - JWT should be stored
4. Test post creation - image upload via signed URL
5. Test search - results from backend API
6. Check browser console for API calls
7. Verify no Supabase direct calls (except legacy code)

## Troubleshooting

### "Network error" / Can't connect to backend

- Ensure backend is running on `http://localhost:8080`
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### "Unauthorized" (401)

- JWT token expired or invalid
- Call `api.setToken(null)` and redirect to login
- Check backend logs for JWT verification errors

### "Forbidden" (403)

- User doesn't have required role (User/Staff/Admin)
- Check `requireAuth`, `requireStaff`, `requireAdmin` middleware

### Upload fails

- Check signed URL expiration (default: 1 hour)
- Ensure you call `api.storage.confirmUpload()` after upload
- Check Supabase Storage bucket permissions

## Support

For backend API documentation, see:
- `../umak-link-backend/README.md`
- Backend API routes in `../umak-link-backend/src/routes/`
