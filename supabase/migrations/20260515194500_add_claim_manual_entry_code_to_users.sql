alter table public.user_table
  add column if not exists claim_manual_entry_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_table_claim_manual_entry_code_format_check'
      and conrelid = 'public.user_table'::regclass
  ) then
    alter table public.user_table
      add constraint user_table_claim_manual_entry_code_format_check
      check (
        claim_manual_entry_code is null
        or claim_manual_entry_code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$'
      );
  end if;
end;
$$;

create unique index if not exists idx_user_claim_manual_entry_code_unique
  on public.user_table using btree (claim_manual_entry_code)
  where claim_manual_entry_code is not null;

comment on column public.user_table.claim_manual_entry_code is
  'Short student-facing fallback code for direct claim verification lookup.';
