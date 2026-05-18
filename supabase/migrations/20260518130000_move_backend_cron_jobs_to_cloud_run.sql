-- Move backend pg_cron jobs from the retired Render host to the Cloud Run host.
-- This updates the existing jobs in place so their schedules, headers, and bodies
-- remain unchanged.

DO $$
DECLARE
  old_backend_url constant text := 'https://umak-link-backend.onrender.com';
  new_backend_url constant text := 'https://umak-link-backend-209394384519.asia-southeast1.run.app';
  scheduled_job record;
  updated_count integer := 0;
BEGIN
  FOR scheduled_job IN
    SELECT jobid, command
    FROM cron.job
    WHERE jobname IN (
      'generate_metadata_by_batch',
      'send_pending_match',
      'healthz_ping',
      'custody-stale-accepted-escalation'
    )
      AND command LIKE '%' || old_backend_url || '%'
  LOOP
    PERFORM cron.alter_job(
      scheduled_job.jobid,
      command := replace(scheduled_job.command, old_backend_url, new_backend_url)
    );
    updated_count := updated_count + 1;
  END LOOP;

  IF updated_count = 0 THEN
    RAISE NOTICE
      'No cron job commands were updated. The jobs may already point to %.',
      new_backend_url;
  END IF;
END $$;
