# Migration Status - Supabase to Backend API

## Overview

The migration from direct Supabase calls to the backend API is **in progress**. A hybrid approach is being used to allow gradual migration.

## Completed ✅

### Core Infrastructure
- ✅ Backend API fully implemented (Phases 1-6)
- ✅ API client with JWT authentication (`src/shared/lib/api.ts`)
- ✅ API service wrappers created
- ✅ Authentication migrated to backend
- ✅ Client-side Gemini deprecated

### Migrated Services
- ✅ `authServices.tsx` - Uses backend API
- ✅ `UserContext.tsx` - Uses `api.auth.getMe()`
- ✅ Service wrappers created for all endpoints

## In Progress 🚧

### Files Still Using Direct Supabase (28 files)

These files need gradual migration to use the API services:

**Admin (6 files)**
- `src/features/admin/components/DonutChart.tsx`
- `src/features/admin/components/SystemStatsChart.tsx`
- `src/features/admin/data/dashboardStats.ts` → Use `adminApiService`
- `src/features/admin/hooks/useAdminServices.tsx`
- `src/features/admin/hooks/useStaffSearch.ts` → Use `searchApiService`
- `src/features/admin/pages/Announcement.tsx` → Use `notificationApiService`
- `src/features/admin/utils/generateAnnouncementUtil.ts`

**Staff (8 files)**
- `src/features/staff/hooks/useClaimItemSubmit.ts` → Use `claimApiService`
- `src/features/staff/hooks/useExistingClaimCheck.ts` → Use `claimApiService`
- `src/features/staff/hooks/useFraudReports.tsx` → Use `fraudReportApiService`
- `src/features/staff/hooks/usePostStaffServices.tsx` → Use `postApiService`
- `src/features/staff/hooks/useStaffPostActions.tsx` → Use `postApiService`
- `src/features/staff/hooks/useStaffSearch.tsx` → Use `searchApiService`
- `src/features/staff/pages/ExpandedFraudReport.tsx` → Use `fraudReportApiService`
- `src/features/staff/pages/ExpandedPostRecord.helpers.ts` → Use `postApiService`
- `src/features/staff/utils/catalogPostHandlers.ts` (Remove Gemini calls)

**User (6 files)**
- `src/features/user/data/matchedPosts.ts` → Use `postApiService`
- `src/features/user/hooks/useNotifications.ts` → Use `notificationApiService`
- `src/features/user/hooks/usePostActions.tsx` → Use `postApiService`
- `src/features/user/hooks/useSearch.tsx` → Use `searchApiService`
- `src/features/user/hooks/useUnreadNotificationCount.ts` → Use `notificationApiService`
- `src/features/user/services/postServices.tsx` → Use `postApiService`

**Posts (2 files)**
- `src/features/posts/data/posts.ts` → Use `postApiService`
- `src/features/posts/data/postsRefresh.ts` → Use `postApiService`

**Shared (6 files)**
- `src/shared/components/PostList.tsx` → Use `postApiService`
- `src/shared/hooks/useAuditLogs.tsx` → Use `adminApiService`
- `src/shared/utils/emailService.ts` (Server-side only now)
- `src/shared/utils/supabaseStorageUtils.ts` → Use `api.storage`

## Migration Strategy

### Approach: Gradual Migration

1. **Phase 1** ✅ - Core infrastructure and authentication
2. **Phase 2** 🚧 - Update hooks and services as needed
3. **Phase 3** - Update components and pages
4. **Phase 4** - Remove all Supabase direct calls
5. **Phase 5** - Deploy and test

### How to Migrate a File

**Before:**
```typescript
import { supabase } from '@/shared/lib/supabase';

const { data } = await supabase
  .from('post_public_view')
  .select('*')
  .eq('post_id', postId);
```

**After:**
```typescript
import { postApiService } from '@/shared/services';

const post = await postApiService.getPost(postId);
```

### Quick Reference

| Old (Supabase) | New (API Service) |
|----------------|-------------------|
| `supabase.from('post_public_view').select()*` | `postApiService.listPublicPosts()` |
| `supabase.from('post_table').insert()` | `postApiService.createPost()` |
| `supabase.from('post_table').update()` | `postApiService.updatePostStatus()` |
| `supabase.rpc('search_items_fts', ...)` | `searchApiService.searchItems()` |
| `supabase.rpc('process_claim', ...)` | `claimApiService.processClaim()` |
| `supabase.from('fraud_reports_table').*` | `fraudReportApiService.*` |
| `supabase.from('notification_table').*` | `notificationApiService.*` |
| `supabase.storage.from().upload()` | `api.storage.getUploadUrl()` |
| `callGeminiApi()` | ❌ Deprecated (server-side only) |

## Current Status

**Backend:** ✅ 100% Complete
**Frontend Migration:** 🚧 ~25% Complete
**Estimated Remaining:** ~20-25 files to migrate

## Testing

### Backend (Ready)
```bash
cd umak-link-backend
pnpm run dev  # http://localhost:8080
```

### Frontend (Hybrid Mode)
```bash
cd UMak-LINK
pnpm run dev  # Uses API + legacy Supabase
```

## Notes

- **Backward Compatibility**: Existing Supabase calls still work (for now)
- **Security**: New code should use API services only
- **Gemini**: All AI operations now server-side automatically
- **Storage**: Use signed URLs via API
- **Auth**: JWT tokens managed by API client

## Next Steps

1. ⏭️ Migrate high-traffic hooks first (search, posts, notifications)
2. ⏭️ Update components to use new services
3. ⏭️ Integration testing
4. ⏭️ Remove `@/shared/lib/supabase` import completely
5. ⏭️ Deploy backend to Cloud Run
6. ⏭️ Update frontend env to point to production API

---

**Last Updated:** 2026-02-04
