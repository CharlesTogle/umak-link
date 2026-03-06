# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## **⚠️ CRITICAL: Standards File Priority**

**ALWAYS check for a `standards.md` file in the current working directory or subdirectories FIRST before making any code changes.**

When working in any subdirectory (e.g., `umak-link-web/`, `UMak-LINK/`, `umak-link-backend/`):

1. **FIRST**: Look for a local `standards.md` file in that subdirectory
2. **IF FOUND**: Strictly follow ALL standards, patterns, and conventions defined in that file
3. **OVERRIDE**: The local `standards.md` takes precedence over any general guidance in this CLAUDE.md
4. **MANDATORY**: Validate your code against the standards before submitting changes

Known standards files:
- `umak-link-web/standards.md` - Frontend standards for the Next.js admin portal (Tailwind v4, TypeScript strict mode, Zustand, TanStack Query)

**Never skip reading standards.md if it exists. It contains critical project-specific conventions, architecture decisions, and quality requirements.**

---

## Project Overview

UMak-LINK is a lost-and-found matching system for the University of Makati. It's a hybrid mobile/web application supporting three user roles: User, Staff, and Admin.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Mobile**: Ionic React 8 + Capacitor 7 (iOS/Android)
- **Backend**: Fastify 5 (separate service in `umak-link-backend/`)
- **Database**: Supabase (PostgreSQL 17)
- **Auth**: Google OAuth + JWT
- **AI**: Google Gemini API (server-side)
- **Push Notifications**: Firebase FCM + Capacitor
- **Email**: Resend API

## Repository Structure

This is a monorepo with three main services:

```
umak-link/
├── UMak-LINK/           # Frontend (Ionic React + Capacitor)
│   ├── src/             # React application source
│   ├── android/         # Android native project
│   ├── ios/             # iOS native project
│   └── capacitor.config.ts
├── umak-link-backend/   # Backend BFF (Fastify)
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth, error handling
│   │   ├── services/    # Supabase, AI, notifications
│   │   └── types/       # TypeScript types
│   └── Dockerfile
└── umak-link-web/       # Admin/Staff Web Portal (Next.js 15)
    ├── src/             # Next.js application (⚠️ READ standards.md FIRST)
    ├── standards.md     # **MANDATORY READING** - Project standards
    └── next.config.ts
```

**⚠️ When working in `umak-link-web/`, you MUST read `standards.md` before making any changes.**

## Commands

### Frontend (from `UMak-LINK/`)

```bash
# Development
npm run dev              # Start Vite dev server (port 5173)
npm run backend          # Start backend with nodemon (legacy, see below)

# Mobile
npm run android:run      # Build and run on Android device
npm run android:open     # Open project in Android Studio
npm run build:android    # Build frontend + sync with Capacitor

# Combined (runs both services)
npm run full:open        # Open Android Studio + start backend
npm run full:run         # Run on device + start backend

# Quality
npm run lint             # ESLint check
npm run build            # TypeScript compile + Vite build
```

### Backend (from `umak-link-backend/`)

```bash
# Development
npm run dev              # Start with tsx watch (hot reload, port 8080)

# Production
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled code from dist/

# Quality
npm run typecheck        # TypeScript type checking (no emit)
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format with Prettier
```

**Note**: The frontend's `npm run backend` is a legacy script that runs an old Express backend via nodemon. The actual backend service is now in `umak-link-backend/` using Fastify.

## Environment Configuration

Frontend (`UMak-LINK/.env`):

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:8080
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON=your-supabase-anon-key
```

Backend (`umak-link-backend/.env`):

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-strong-random-secret
```

**Critical requirements:**
- `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` must be identical or Google token verification will fail
- `VITE_API_URL` must point to the backend service (defaults to `http://localhost:8080`)
- `CORS_ORIGIN` in backend must match frontend URL to avoid CORS errors

## Authentication Flow

Google OAuth implementation uses a two-step flow:

1. **Frontend**: User signs in with Google via `@react-oauth/google` (web) or `@capgo/capacitor-social-login` (mobile)
2. **Google**: Returns ID token (JWT) to frontend
3. **Frontend → Backend**: Sends ID token to `POST /auth/google`
4. **Backend**: Verifies token with Google's OAuth2Client, checks `audience` claim matches `GOOGLE_CLIENT_ID`, validates `@umak.edu.ph` email domain
5. **Backend**: Creates/updates user in Supabase, generates internal JWT signed with `JWT_SECRET`
6. **Backend → Frontend**: Returns JWT + user profile
7. **Frontend**: Stores JWT in localStorage, includes as `Authorization: Bearer <token>` in all subsequent requests
8. **Backend**: Validates JWT using `requireAuth` middleware for protected routes

Key files:
- Frontend: `src/features/auth/pages/Auth.tsx`, `src/features/auth/services/authServices.tsx`, `src/shared/lib/api.ts`
- Backend: `src/routes/auth.ts`, `src/middleware/auth.ts`

## Architecture

### Frontend Directory Structure (`UMak-LINK/src/`)

```
src/
├── app/                  # App shell, routing, global setup
│   ├── routes/           # UserRoutes, AdminRoutes, StaffRoutes (role-based routing)
│   └── components/       # Toolbar (bottom navigation)
├── features/             # Feature-based modules (vertical slices)
│   ├── admin/            # Dashboard, StaffManagement, AuditTrail, Announcements
│   ├── auth/             # UserContext, authServices, Auth page
│   ├── posts/            # Post types, data fetching, post components
│   ├── staff/            # Post records, claim processing, fraud reports
│   └── user/             # Home, History, NewPost, Search, Notifications, Matches
└── shared/               # Cross-feature utilities (horizontal slices)
    ├── lib/              # api.ts, supabase.ts, geminiApi.ts, cache.ts
    ├── contexts/         # SearchContext, NotificationContext
    ├── hooks/            # usePostFetching, useAuditLogs, useFilterAndSortPosts
    └── components/       # ProtectedRoute, LogOut, Unauthorized
```

### Backend Directory Structure (`umak-link-backend/src/`)

```
src/
├── routes/               # API endpoints (one file per resource)
│   ├── auth.ts           # POST /auth/google, GET /auth/me
│   ├── posts.ts          # CRUD for posts/items
│   ├── claims.ts         # Claim processing
│   ├── fraud-reports.ts  # Fraud report management
│   ├── search.ts         # User/staff search
│   ├── notifications.ts  # Push notification management
│   ├── announcements.ts  # Global announcements
│   ├── storage.ts        # Signed upload URLs
│   ├── users.ts          # User management
│   ├── admin.ts          # Admin dashboard, audit logs
│   ├── items.ts          # Item-specific operations
│   ├── pending-matches.ts # Match suggestions
│   ├── jobs.ts           # Background jobs (AI metadata, matching)
│   └── email.ts          # Email notifications
├── middleware/
│   ├── auth.ts           # requireAuth, requireRole, requireSystemAuth
│   └── error-handler.ts  # Global error handling
├── services/
│   ├── supabase.ts       # Supabase client (service role)
│   ├── storage.ts        # File upload/delete
│   ├── notifications.ts  # Firebase FCM
│   └── gemini.ts         # Google Gemini AI
├── types/                # TypeScript type definitions
└── utils/
    └── logger.ts         # Pino logger configuration
```

### Key Patterns

- **BFF Architecture**: All Supabase access, AI operations, and sensitive keys are centralized in the backend. Frontend never uses `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY`.
- **Role-based routing**: `ProtectedRoute.tsx` enforces User/Staff/Admin access on frontend routes
- **Role-based middleware**: Backend uses `requireAuth`, `requireRole(['Staff', 'Admin'])`, and `requireSystemAuth` decorators
- **Hybrid storage**: `src/shared/lib/supabase.ts` adapts storage API for Capacitor (native) vs web (different file path handling)
- **Feature isolation**: Each frontend feature has its own pages/, hooks/, components/, services/
- **Vertical API slicing**: Backend routes are organized by resource (posts, claims, users), not by operation

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

## Backend API Endpoints

Full endpoint reference is in `umak-link-backend/README.md`. Key endpoints:

**Authentication**:
- `POST /auth/google` - Login with Google ID token
- `GET /auth/me` - Get current user (requires JWT)

**Posts**: `GET /posts/public`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id`, `PUT /posts/:id/status`

**Claims**: `POST /claims/process` (staff), `GET /claims/by-item/:itemId`

**Search**: `POST /search/items`, `POST /search/items/staff`

**Notifications**: `POST /notifications/send`, `GET /notifications`, `PATCH /notifications/:id/read`

**Admin**: `GET /admin/dashboard-stats`, `POST /admin/audit-logs`, `GET /admin/audit-logs`

**Jobs** (system token required): `POST /jobs/metadata-batch`, `POST /jobs/pending-match`

**Health**: `GET /health`

## Security Constraints

- `SUPABASE_SERVICE_ROLE_KEY` must NEVER reach clients (only used in backend)
- `GEMINI_API_KEY` must stay server-side only
- All sensitive operations go through the backend BFF
- Frontend uses anonymous Supabase key (`VITE_SUPABASE_ANON`) for direct storage operations only
- Backend validates JWT tokens using `JWT_SECRET` on protected routes
- Role-based access control enforced on both frontend (routing) and backend (middleware)

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.app.json)

## Code Quality and Standards Enforcement

### Before Making ANY Changes

1. **Check for `standards.md`** in the current subdirectory
2. **Read the entire standards file** if it exists
3. **Follow ALL conventions** specified in that file (naming, architecture, patterns, etc.)
4. **Validate your changes** against the standards before completion

### Standards File Locations

Each subdirectory may have its own `standards.md` with project-specific conventions:

- **`umak-link-web/standards.md`**: Next.js admin portal standards
  - Stack: React 18, Next.js 15, TypeScript strict, Tailwind v4, Zustand, TanStack Query
  - Patterns: Atomic selectors, immutable updates, no dead code
  - Validation: Run `npx tsc --noEmit` and `npx react-doctor` before commits
  - Quality target: React Doctor score 95+/100, zero errors

### Standards Override Priority

```
Local standards.md (highest priority)
    ↓
CLAUDE.md (general guidance)
    ↓
General best practices (lowest priority)
```

**When in doubt, always defer to the local `standards.md` file.**
