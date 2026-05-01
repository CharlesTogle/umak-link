# Session Handoff

## Working Rules

1. Use `../umak-link-backup` as the business logic reference.
   The backup is the source of truth for expected behavior, field meaning, and user-facing flows.
   The current repo is the target architecture, but behavior should be reconciled back to the backup unless the user explicitly approves a behavior change.

2. Do not use `unknown` or `any` for type casting or type definitions.
   Exact types, explicit unions, typed adapters, and type guards are allowed.
   Small validator helpers such as `getString(value: unknown)` are allowed when used for narrowing or validation, not for bypassing typing.

3. Prefer flat types for backend fetching.
   Backend fetch contracts should match the fetched payload shape directly.
   Do not hide contract drift behind broad casts.
   If the UI needs a different shape, map from exact backend DTOs into exact feature-facing types.

4. Do not remove behavior casually to make TypeScript pass.
   Preserve existing business behavior whenever possible.
   If something appears unused or incompatible, first determine whether it represents lost business logic, a migration regression, or a real dead path.

5. Favor compatibility fixes over silent simplification.
   If a function previously supported an argument, timeout, field, or behavior, do not strip it out just to satisfy the compiler.
   Restore compatibility where practical, especially when the backup confirms it was intentional behavior.

6. Ask the user before making product or behavior decisions.
   If a fix requires choosing between:
   - removing behavior,
   - changing an API contract,
   - weakening a type contract,
   - dropping a timeout/retry/validation rule,
   - or changing business semantics,
   stop and ask the user instead of deciding unilaterally.

## Implementation Guidance

- Use typed boundary adapters instead of `as` casts.
- Keep shared API contracts precise.
- If backend changes are actually required, create a migration rather than faking missing fields in the frontend.
- When a mismatch appears between layered-architecture code and the backup, prefer preserving the backup’s business logic and adapting the new structure around it.

## Current Direction

- Continue fixing build errors incrementally.
- Verify each fix against `../umak-link-backup` when business behavior is unclear.
- Treat “make it compile” as insufficient if it changes meaning or removes behavior.

## Current Status

- `npm run build` currently passes in this repo.
- Client-side metadata generation has been removed from the frontend flows.
- Metadata generation is now intended to be server-side only.
- The frontend compatibility wrappers now defer metadata generation to the server-side batch process instead of calling Gemini on the client.

## Metadata Notes

- `src/shared/lib/geminiApi.ts` is now a deprecated client stub and should not be treated as an active metadata path.
- `src/features/user/services/postServices.tsx` no longer performs client-side image fetch/base64/Gemini metadata generation.
- `src/features/staff/utils/catalogPostHandlers.ts` no longer performs client-side background metadata generation on accepted posts.
- Metadata generation should be handled by the scheduled backend batch job for accepted posts with missing metadata and an image available.

## Backend Alignment

- Added SQL migration: `sql/20260501_update_metadata_batch_cron_to_every_10_minutes.sql`
- Intended cron schedule for metadata batch is every 10 minutes: `*/10 * * * *`
- Backend route `../umak-link-backend/src/routes/jobs.ts` was aligned to:
  - read from `items_pending_metadata`
  - process accepted posts only
  - update `item_table.item_metadata`

## Practical Guidance For Next Session

- Do not reintroduce client-side Gemini metadata generation.
- If metadata behavior is changed again, treat the server-side batch path as the source of truth and update cron/backend behavior instead of restoring client calls.
- If future metadata issues appear, verify the cron job, the `/jobs/metadata-batch` path, and the accepted-post selection logic before touching frontend code.
