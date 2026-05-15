alter table public.custody_attempt_table
  add column if not exists session_expires_at timestamp with time zone;

update public.custody_attempt_table
set session_expires_at = coalesce(
  session_expires_at,
  created_at + interval '15 minutes'
)
where session_expires_at is null;

alter table public.custody_attempt_table
  alter column session_expires_at set default (now() + interval '15 minutes');

alter table public.custody_attempt_table
  alter column session_expires_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'custody_attempt_table_session_expires_at_future_check'
  ) then
    alter table public.custody_attempt_table
      add constraint custody_attempt_table_session_expires_at_future_check
      check (session_expires_at > created_at);
  end if;
end;
$$;

comment on column public.custody_attempt_table.session_expires_at is
  'Absolute deadline for the whole student handover session. QR refreshes cannot extend this deadline.';

create index if not exists idx_custody_attempt_session_expires_at_open
  on public.custody_attempt_table using btree (session_expires_at)
  where (status = 'open'::public.custody_attempt_status_enum);
