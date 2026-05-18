-- Update the metadata batch cron to run every 10 minutes instead of every 12 hours.
-- This migration updates the existing job in place so it preserves the current
-- HTTP target, headers, and body that are already stored in cron.job.

DO $$
DECLARE
  target_job_id bigint;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'generate_metadata_by_batch'
  ) THEN
    SELECT jobid
    INTO target_job_id
    FROM cron.job
    WHERE jobname = 'generate_metadata_by_batch';

    PERFORM cron.alter_job(target_job_id, schedule := '*/10 * * * *');
  ELSIF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'metadata-batch'
  ) THEN
    SELECT jobid
    INTO target_job_id
    FROM cron.job
    WHERE jobname = 'metadata-batch';

    PERFORM cron.alter_job(target_job_id, schedule := '*/10 * * * *');
  ELSE
    RAISE EXCEPTION
      'Metadata batch cron job not found. Expected jobname generate_metadata_by_batch or metadata-batch.';
  END IF;
END $$;
