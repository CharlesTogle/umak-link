
  select jobid, jobname, schedule
  from cron.job
  where jobname = 'custody-stale-accepted-escalation';