create or replace function public._generate_qr_manual_entry_code()
returns text
language plpgsql
as $$
declare
  code_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  generated_code text := '';
  alphabet_index integer;
begin
  for alphabet_position in 1..6 loop
    alphabet_index := floor(random() * length(code_alphabet) + 1);
    generated_code := generated_code || substr(code_alphabet, alphabet_index, 1);
  end loop;

  return generated_code;
end;
$$;

alter table public.qr_code_session_table
  add column if not exists manual_entry_code text;

alter table public.qr_code_session_table
  disable trigger trg_validate_qr_code_session;

do $$
declare
  session_record record;
  candidate_code text;
begin
  for session_record in
    select qr_code_session_id
    from public.qr_code_session_table
    where manual_entry_code is null
  loop
    loop
      candidate_code := public._generate_qr_manual_entry_code();

      exit when not exists (
        select 1
        from public.qr_code_session_table
        where manual_entry_code = candidate_code
      );
    end loop;

    update public.qr_code_session_table
    set manual_entry_code = candidate_code
    where qr_code_session_id = session_record.qr_code_session_id;
  end loop;
end;
$$;

alter table public.qr_code_session_table
  enable trigger trg_validate_qr_code_session;

do $$
begin
  if exists (
    select 1
    from public.qr_code_session_table
    where manual_entry_code is null
  ) then
    raise exception 'manual_entry_code backfill failed for one or more qr_code_session rows';
  end if;
end;
$$;

alter table public.qr_code_session_table
  alter column manual_entry_code set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'qr_code_session_table_manual_entry_code_format_check'
      and conrelid = 'public.qr_code_session_table'::regclass
  ) then
    alter table public.qr_code_session_table
      add constraint qr_code_session_table_manual_entry_code_format_check
      check (manual_entry_code ~ '^[A-Z0-9]{6}$');
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'qr_code_session_table_manual_entry_code_key'
      and conrelid = 'public.qr_code_session_table'::regclass
  ) then
    alter table public.qr_code_session_table
      add constraint qr_code_session_table_manual_entry_code_key
      unique (manual_entry_code);
  end if;
end;
$$;

comment on column public.qr_code_session_table.manual_entry_code is
  'Short guard-facing fallback code for manual custody review lookup.';

drop function public._generate_qr_manual_entry_code();
