alter table public.custody_attempt_table
  add column if not exists number_of_attempts integer not null default 1;

update public.custody_attempt_table
set number_of_attempts = 1
where number_of_attempts is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'custody_attempt_table_number_of_attempts_check'
  ) then
    alter table public.custody_attempt_table
      add constraint custody_attempt_table_number_of_attempts_check
      check (number_of_attempts > 0);
  end if;
end;
$$;

comment on column public.custody_attempt_table.number_of_attempts is
  'Counts QR issuance attempts inside a single student handover session loop.';

create index if not exists idx_custody_attempt_post_poster_created_at
  on public.custody_attempt_table using btree (post_id, poster_id, created_at desc);
