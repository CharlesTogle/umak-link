# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UMak-LINK is a lost-and-found matching system for the University of Makati. It's a hybrid mobile/web application supporting three user roles: User, Staff, and Admin.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Mobile**: Ionic React 8 + Capacitor 7 (iOS/Android)
- **Backend**: Express.js BFF (being migrated to Fastify)
- **Database**: Supabase (PostgreSQL 17)
- **Auth**: Google OAuth + JWT
- **AI**: Google Gemini API (server-side)
- **Push Notifications**: Firebase FCM + Capacitor
- **Email**: Resend API

## Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run backend          # Run Express backend with nodemon

# Mobile
npm run android:run      # Run on Android device
npm run android:open     # Open in Android Studio
npm run build:android    # Build + sync with Capacitor

# Combined
npm run full:open        # Open Android Studio + start backend
npm run full:run         # Run on device + start backend

# Quality
npm run lint             # ESLint check
npm run build            # TypeScript compile + Vite build
```

## Architecture

### Directory Structure

```
src/
├── app/                  # App shell, routing, global components
│   ├── routes/           # UserRoutes, AdminRoutes, StaffRoutes
│   └── components/       # Toolbar (bottom nav)
├── features/             # Feature-based modules
│   ├── admin/            # Dashboard, StaffManagement, AuditTrail, Announcements
│   ├── auth/             # UserContext, authServices, Auth page
│   ├── posts/            # Post types, data fetching, components
│   ├── staff/            # Post records, claim processing, fraud reports
│   └── user/             # Home, History, NewPost, Search, Notifications, Matches
├── shared/               # Cross-feature utilities
│   ├── lib/              # supabase.ts, geminiApi.ts, cache.ts
│   ├── contexts/         # SearchContext, NotificationContext
│   ├── hooks/            # usePostFetching, useAuditLogs, useFilterAndSortPosts
│   └── components/       # ProtectedRoute, LogOut, Unauthorized
backend/                  # Express BFF server
supabase/functions/       # Edge functions (notifications, email, AI jobs)
```

### Key Patterns

- **Role-based routing**: `ProtectedRoute.tsx` enforces User/Staff/Admin access
- **Hybrid storage**: `src/shared/lib/supabase.ts` adapts storage for Capacitor (native) vs web
- **Feature isolation**: Each feature has its own pages/, hooks/, components/, services/

### Database Views (preserve these shapes)

- `post_public_view` - Public post listings
- `v_post_records_details` - Staff post records with full details
- `fraud_reports_public_v` - Fraud report listings
- `notification_view` - User notifications

### Important Enums

```typescript
type ItemType = 'found' | 'lost' | 'missing';
type ItemStatus = 'claimed' | 'unclaimed' | 'discarded' | 'returned' | 'lost';
type PostStatus = 'pending' | 'accepted' | 'rejected' | 'archived' | 'deleted' | 'reported' | 'fraud';
type UserType = 'User' | 'Staff' | 'Admin';
```

## Security Constraints

- `SUPABASE_SERVICE_ROLE_KEY` must never reach clients
- Gemini API key must stay server-side only
- All sensitive operations go through the backend BFF

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.app.json)
