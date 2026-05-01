-- Update the metadata batch cron to run every 10 minutes instead of every 12 hours.
-- This migration updates the existing job in place so it preserves the current
-- HTTP target, headers, and body that are already stored in cron.job.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'generate_metadata_by_batch'
  ) THEN
    UPDATE cron.job
    SET schedule = '*/10 * * * *'
    WHERE jobname = 'generate_metadata_by_batch';
  ELSIF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'metadata-batch'
  ) THEN
    UPDATE cron.job
    SET schedule = '*/10 * * * *'
    WHERE jobname = 'metadata-batch';
  ELSE
    RAISE EXCEPTION
      'Metadata batch cron job not found. Expected jobname generate_metadata_by_batch or metadata-batch.';
  END IF;
END $$;
