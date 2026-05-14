-- Schedule automated escalation for accepted custody handovers that have not
-- reached the Security Office within 48 hours of the guard decision.
--
-- Prerequisites:
-- 1. The backend route /jobs/custody/escalate-stale-accepted must be deployed.
-- 2. The backend must have SYSTEM_TOKEN and CUSTODY_AUTOMATION_STAFF_USER_ID configured.
-- 3. Supabase Vault must contain the backend SYSTEM_TOKEN as:
--      umak_link_backend_system_token
--
-- Example:
--   SELECT vault.create_secret(
--     'YOUR_SYSTEM_TOKEN',
--     'umak_link_backend_system_token',
--     'Backend SYSTEM_TOKEN used by custody pg_cron jobs'
--   );

CREATE SCHEMA IF NOT EXISTS vault;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  backend_url constant text := 'https://umak-link-backend.onrender.com';
  backend_system_token text;
  scheduled_job record;
BEGIN
  SELECT decrypted_secret
  INTO backend_system_token
  FROM vault.decrypted_secrets
  WHERE name = 'umak_link_backend_system_token'
  ORDER BY created_at DESC
  LIMIT 1;

  IF backend_system_token IS NULL OR btrim(backend_system_token) = '' THEN
    RAISE EXCEPTION
      'Missing Vault secret "umak_link_backend_system_token". Create it before running this migration.';
  END IF;

  FOR scheduled_job IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'custody-stale-accepted-escalation'
  LOOP
    PERFORM cron.unschedule(scheduled_job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'custody-stale-accepted-escalation',
    '0 * * * *',
    format(
      $command$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || (
            SELECT decrypted_secret
            FROM vault.decrypted_secrets
            WHERE name = 'umak_link_backend_system_token'
            ORDER BY created_at DESC
            LIMIT 1
          ),
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
      $command$,
      backend_url || '/jobs/custody/escalate-stale-accepted'
    )
  );
END $$;
