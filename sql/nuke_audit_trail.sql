BEGIN;

-- App audit trail used by the UI.
TRUNCATE TABLE public.audit_table RESTART IDENTITY;

-- Supabase auth audit trail.
TRUNCATE TABLE auth.audit_log_entries RESTART IDENTITY;

COMMIT;
