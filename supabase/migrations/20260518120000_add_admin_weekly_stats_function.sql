create or replace function public.get_admin_weekly_stats()
returns table (
  week_start date,
  missing_count integer,
  found_count integer,
  reports_count integer,
  pending_count integer
)
language sql
stable
security definer
set search_path = public
as $$
with local_clock as (
  select (now() at time zone 'Asia/Manila')::date as local_today
),
week_bounds as (
  select
    (local_today - extract(dow from local_today)::int) as current_week_start,
    ((local_today - extract(dow from local_today)::int) - 77)::date as oldest_week_start,
    ((local_today - extract(dow from local_today)::int) + 7)::date as range_end
  from local_clock
),
weeks as (
  select (oldest_week_start + (bucket_index * 7))::date as week_start
  from week_bounds
  cross join generate_series(0, 11) as gs(bucket_index)
),
post_counts as (
  select
    (submission_date::date - extract(dow from submission_date::date)::int) as week_start,
    count(*) filter (where item_type = 'missing')::integer as missing_count,
    count(*) filter (where item_type = 'found')::integer as found_count,
    count(*) filter (where post_status = 'pending')::integer as pending_count
  from post_public_view
  cross join week_bounds
  where submission_date >= week_bounds.oldest_week_start::timestamp
    and submission_date < week_bounds.range_end::timestamp
  group by 1
),
report_counts as (
  select
    ((date_reported at time zone 'Asia/Manila')::date - extract(dow from (date_reported at time zone 'Asia/Manila')::date)::int) as week_start,
    count(*)::integer as reports_count
  from fraud_reports_table
  cross join week_bounds
  where report_status in ('open', 'under_review')
    and date_reported >= (week_bounds.oldest_week_start::timestamp at time zone 'Asia/Manila')
    and date_reported < (week_bounds.range_end::timestamp at time zone 'Asia/Manila')
  group by 1
)
select
  weeks.week_start,
  coalesce(post_counts.missing_count, 0) as missing_count,
  coalesce(post_counts.found_count, 0) as found_count,
  coalesce(report_counts.reports_count, 0) as reports_count,
  coalesce(post_counts.pending_count, 0) as pending_count
from weeks
left join post_counts on post_counts.week_start = weeks.week_start
left join report_counts on report_counts.week_start = weeks.week_start
order by weeks.week_start asc;
$$;

revoke all on function public.get_admin_weekly_stats() from public;
revoke all on function public.get_admin_weekly_stats() from anon;
revoke all on function public.get_admin_weekly_stats() from authenticated;
grant execute on function public.get_admin_weekly_stats() to service_role;
