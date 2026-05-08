-- Replace legacy Edge Function cron jobs with Render backend jobs.
--
-- Prerequisite: store the backend SYSTEM_TOKEN in Supabase Vault.
-- Example:
--   SELECT vault.create_secret(
--     'YOUR_SYSTEM_TOKEN',
--     'umak_link_backend_system_token',
--     'Render backend SYSTEM_TOKEN used by pg_cron jobs'
--   );
--
-- If the secret already exists, update it instead:
--   SELECT vault.update_secret(
--     (SELECT id FROM vault.decrypted_secrets
--      WHERE name = 'umak_link_backend_system_token'
--      ORDER BY created_at DESC
--      LIMIT 1),
--     'YOUR_SYSTEM_TOKEN',
--     'umak_link_backend_system_token',
--     'Render backend SYSTEM_TOKEN used by pg_cron jobs'
--   );

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
    WHERE jobname IN (
      'send_pending_match',
      'generate_metadata_by_batch',
      'healthz_ping',
      'metadata-batch',
      'pending-match'
    )
  LOOP
    PERFORM cron.unschedule(scheduled_job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'generate_metadata_by_batch',
    '*/10 * * * *',
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
      backend_url || '/jobs/metadata-batch'
    )
  );

  PERFORM cron.schedule(
    'send_pending_match',
    '0 */12 * * *',
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
      backend_url || '/jobs/pending-match'
    )
  );

  PERFORM cron.schedule(
    'healthz_ping',
    '*/14 * * * *',
    format(
      $command$
      SELECT http_get(%L);
      $command$,
      backend_url || '/health'
    )
  );
END $$;
