alter type public.user_type_enum add value if not exists 'Guard';

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'custody_status_enum'
  ) then
    create type public.custody_status_enum as enum (
      'untracked',
      'with_reporter',
      'handover_in_progress',
      'with_guard',
      'in_security_office',
      'under_investigation'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'custody_attempt_status_enum'
  ) then
    create type public.custody_attempt_status_enum as enum (
      'open',
      'accepted',
      'rejected',
      'timed_out',
      'cancelled'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'qr_code_session_status_enum'
  ) then
    create type public.qr_code_session_status_enum as enum (
      'active',
      'accepted',
      'rejected',
      'expired',
      'cancelled'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'custody_record_type_enum'
  ) then
    create type public.custody_record_type_enum as enum (
      'attempt_started',
      'qr_generated',
      'qr_scanned',
      'guard_rejected',
      'qr_expired',
      'guard_accepted',
      'security_office_received',
      'investigation_opened',
      'physical_take_reported',
      'attempt_cancelled'
    );
  end if;
end
$$;

create or replace function public.is_guard()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.user_table u
    where u.user_id = auth.uid()
      and u.user_type::text = 'Guard'
  );
$$;

create or replace function public.is_guard_or_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.is_guard() or public.is_staff_or_admin();
$$;

alter table only public.item_table
  add column if not exists custody_status public.custody_status_enum not null default 'untracked'::public.custody_status_enum;

comment on column public.item_table.custody_status is
  'Current custody source of truth for found-item handover flow.';

create table if not exists public.guard_post_table (
  guard_post_id uuid default gen_random_uuid() not null,
  guard_post_name text not null,
  location_id integer not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint guard_post_table_pkey primary key (guard_post_id),
  constraint guard_post_table_guard_post_name_key unique (guard_post_name),
  constraint guard_post_table_location_id_key unique (location_id),
  constraint guard_post_table_location_id_fkey foreign key (location_id)
    references public.location_lookup(location_id) on delete restrict
);

alter table only public.guard_post_table force row level security;

comment on table public.guard_post_table is
  'Controlled list of handover guard posts. In custody flow, handover location is the selected guard post.';

create table if not exists public.custody_attempt_table (
  custody_attempt_id uuid default gen_random_uuid() not null,
  post_id integer not null,
  item_id uuid not null,
  poster_id uuid not null,
  guard_post_id uuid not null,
  handover_image_id integer not null,
  attempt_number integer not null,
  status public.custody_attempt_status_enum not null default 'open'::public.custody_attempt_status_enum,
  decision_by_guard_id uuid,
  decision_at timestamp with time zone,
  decision_reason text,
  office_received_by_staff_id uuid,
  office_received_at timestamp with time zone,
  investigation_opened_by uuid,
  investigation_opened_at timestamp with time zone,
  closed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  details jsonb not null default '{}'::jsonb,
  constraint custody_attempt_table_pkey primary key (custody_attempt_id),
  constraint custody_attempt_table_post_attempt_number_key unique (post_id, attempt_number),
  constraint custody_attempt_table_attempt_number_check check (attempt_number > 0),
  constraint custody_attempt_table_post_id_fkey foreign key (post_id)
    references public.post_table(post_id) on delete cascade,
  constraint custody_attempt_table_item_id_fkey foreign key (item_id)
    references public.item_table(item_id) on delete cascade,
  constraint custody_attempt_table_poster_id_fkey foreign key (poster_id)
    references public.user_table(user_id) on delete restrict,
  constraint custody_attempt_table_guard_post_id_fkey foreign key (guard_post_id)
    references public.guard_post_table(guard_post_id) on delete restrict,
  constraint custody_attempt_table_handover_image_id_fkey foreign key (handover_image_id)
    references public.item_image_table(item_image_id) on delete restrict,
  constraint custody_attempt_table_decision_by_guard_id_fkey foreign key (decision_by_guard_id)
    references public.user_table(user_id) on delete restrict,
  constraint custody_attempt_table_office_received_by_staff_id_fkey foreign key (office_received_by_staff_id)
    references public.user_table(user_id) on delete restrict,
  constraint custody_attempt_table_investigation_opened_by_fkey foreign key (investigation_opened_by)
    references public.user_table(user_id) on delete restrict
);

alter table only public.custody_attempt_table force row level security;

comment on table public.custody_attempt_table is
  'One row per student handover attempt for a post. Attempt closes on accept, reject, timeout, or cancel.';

create table if not exists public.qr_code_session_table (
  qr_code_session_id uuid default gen_random_uuid() not null,
  custody_attempt_id uuid not null,
  session_token_hash text not null,
  status public.qr_code_session_status_enum not null default 'active'::public.qr_code_session_status_enum,
  expires_at timestamp with time zone not null,
  scanned_by_guard_id uuid,
  scanned_at timestamp with time zone,
  closed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint qr_code_session_table_pkey primary key (qr_code_session_id),
  constraint qr_code_session_table_custody_attempt_id_key unique (custody_attempt_id),
  constraint qr_code_session_table_session_token_hash_key unique (session_token_hash),
  constraint qr_code_session_table_custody_attempt_id_fkey foreign key (custody_attempt_id)
    references public.custody_attempt_table(custody_attempt_id) on delete cascade,
  constraint qr_code_session_table_scanned_by_guard_id_fkey foreign key (scanned_by_guard_id)
    references public.user_table(user_id) on delete restrict
);

alter table only public.qr_code_session_table force row level security;

comment on table public.qr_code_session_table is
  'Tracks the live QR session bound to a single custody attempt.';

create table if not exists public.custody_record_table (
  custody_record_id uuid default gen_random_uuid() not null,
  post_id integer not null,
  item_id uuid not null,
  custody_attempt_id uuid,
  qr_code_session_id uuid,
  guard_post_id uuid,
  actor_user_id uuid,
  record_type public.custody_record_type_enum not null,
  visible_to_poster boolean not null default true,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  constraint custody_record_table_pkey primary key (custody_record_id),
  constraint custody_record_table_post_id_fkey foreign key (post_id)
    references public.post_table(post_id) on delete cascade,
  constraint custody_record_table_item_id_fkey foreign key (item_id)
    references public.item_table(item_id) on delete cascade,
  constraint custody_record_table_custody_attempt_id_fkey foreign key (custody_attempt_id)
    references public.custody_attempt_table(custody_attempt_id) on delete set null,
  constraint custody_record_table_qr_code_session_id_fkey foreign key (qr_code_session_id)
    references public.qr_code_session_table(qr_code_session_id) on delete set null,
  constraint custody_record_table_guard_post_id_fkey foreign key (guard_post_id)
    references public.guard_post_table(guard_post_id) on delete set null,
  constraint custody_record_table_actor_user_id_fkey foreign key (actor_user_id)
    references public.user_table(user_id) on delete set null
);

alter table only public.custody_record_table force row level security;

comment on table public.custody_record_table is
  'Append-only custody tracking history per post.';

create index if not exists idx_item_custody_status
  on public.item_table using btree (custody_status);

create index if not exists idx_guard_post_is_active
  on public.guard_post_table using btree (is_active);

create index if not exists idx_custody_attempt_item_id
  on public.custody_attempt_table using btree (item_id);

create index if not exists idx_custody_attempt_poster_id
  on public.custody_attempt_table using btree (poster_id);

create index if not exists idx_custody_attempt_guard_post_id
  on public.custody_attempt_table using btree (guard_post_id);

create index if not exists idx_custody_attempt_status
  on public.custody_attempt_table using btree (status);

create unique index if not exists idx_custody_attempt_one_open_per_post
  on public.custody_attempt_table using btree (post_id)
  where (status = 'open'::public.custody_attempt_status_enum);

create index if not exists idx_qr_code_session_status
  on public.qr_code_session_table using btree (status);

create index if not exists idx_qr_code_session_expires_at
  on public.qr_code_session_table using btree (expires_at);

create index if not exists idx_custody_record_post_id_occurred_at
  on public.custody_record_table using btree (post_id, occurred_at desc);

create index if not exists idx_custody_record_item_id_occurred_at
  on public.custody_record_table using btree (item_id, occurred_at desc);

create index if not exists idx_custody_record_attempt_id
  on public.custody_record_table using btree (custody_attempt_id);

create or replace function public.set_custody_attempt_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.validate_custody_attempt()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_post_item_id uuid;
  v_post_poster_id uuid;
  v_item_type public.item_type_enum;
  v_user_type public.user_type_enum;
begin
  select p.item_id, p.poster_id
  into v_post_item_id, v_post_poster_id
  from public.post_table p
  where p.post_id = new.post_id;

  if not found then
    raise exception 'custody attempt post_id % does not exist', new.post_id;
  end if;

  if new.item_id <> v_post_item_id then
    raise exception 'custody attempt item_id must match post_table.item_id for post_id %', new.post_id;
  end if;

  if new.poster_id <> v_post_poster_id then
    raise exception 'custody attempt poster_id must match post_table.poster_id for post_id %', new.post_id;
  end if;

  select i.type
  into v_item_type
  from public.item_table i
  where i.item_id = new.item_id;

  if v_item_type is distinct from 'found'::public.item_type_enum then
    raise exception 'custody flow only applies to found items';
  end if;

  if new.status = 'open'::public.custody_attempt_status_enum and new.closed_at is not null then
    raise exception 'open custody attempts cannot have closed_at set';
  end if;

  if new.status in (
    'accepted'::public.custody_attempt_status_enum,
    'rejected'::public.custody_attempt_status_enum
  ) and new.decision_by_guard_id is null then
    raise exception 'accepted or rejected custody attempts require decision_by_guard_id';
  end if;

  if new.decision_by_guard_id is not null then
    select u.user_type
    into v_user_type
    from public.user_table u
    where u.user_id = new.decision_by_guard_id;

    if v_user_type::text is distinct from 'Guard' then
      raise exception 'decision_by_guard_id must belong to a Guard user';
    end if;
  end if;

  if new.office_received_by_staff_id is not null then
    select u.user_type
    into v_user_type
    from public.user_table u
    where u.user_id = new.office_received_by_staff_id;

    if v_user_type not in ('Staff'::public.user_type_enum, 'Admin'::public.user_type_enum) then
      raise exception 'office_received_by_staff_id must belong to a Staff or Admin user';
    end if;
  end if;

  if new.investigation_opened_by is not null then
    select u.user_type
    into v_user_type
    from public.user_table u
    where u.user_id = new.investigation_opened_by;

    if v_user_type not in ('Staff'::public.user_type_enum, 'Admin'::public.user_type_enum) then
      raise exception 'investigation_opened_by must belong to a Staff or Admin user';
    end if;
  end if;

  if new.office_received_at is not null and new.office_received_by_staff_id is null then
    raise exception 'office_received_at requires office_received_by_staff_id';
  end if;

  if new.investigation_opened_at is not null and new.investigation_opened_by is null then
    raise exception 'investigation_opened_at requires investigation_opened_by';
  end if;

  if new.status in (
    'accepted'::public.custody_attempt_status_enum,
    'rejected'::public.custody_attempt_status_enum
  ) and new.decision_at is null then
    new.decision_at := now();
  end if;

  if new.status in (
    'accepted'::public.custody_attempt_status_enum,
    'rejected'::public.custody_attempt_status_enum,
    'timed_out'::public.custody_attempt_status_enum,
    'cancelled'::public.custody_attempt_status_enum
  ) and new.closed_at is null then
    new.closed_at := coalesce(new.decision_at, now());
  end if;

  return new;
end;
$$;

create or replace function public.validate_qr_code_session()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_user_type public.user_type_enum;
begin
  if new.expires_at <= new.created_at then
    raise exception 'qr_code_session expires_at must be after created_at';
  end if;

  if new.scanned_by_guard_id is not null then
    select u.user_type
    into v_user_type
    from public.user_table u
    where u.user_id = new.scanned_by_guard_id;

    if v_user_type::text is distinct from 'Guard' then
      raise exception 'scanned_by_guard_id must belong to a Guard user';
    end if;

    if new.scanned_at is null then
      new.scanned_at := now();
    end if;
  end if;

  if new.status = 'active'::public.qr_code_session_status_enum and new.closed_at is not null then
    raise exception 'active qr_code_session rows cannot have closed_at set';
  end if;

  if new.status <> 'active'::public.qr_code_session_status_enum and new.closed_at is null then
    new.closed_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.validate_custody_record()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_post_item_id uuid;
  v_item_type public.item_type_enum;
  v_user_type public.user_type_enum;
begin
  select p.item_id
  into v_post_item_id
  from public.post_table p
  where p.post_id = new.post_id;

  if not found then
    raise exception 'custody record post_id % does not exist', new.post_id;
  end if;

  if new.item_id <> v_post_item_id then
    raise exception 'custody record item_id must match post_table.item_id for post_id %', new.post_id;
  end if;

  select i.type
  into v_item_type
  from public.item_table i
  where i.item_id = new.item_id;

  if v_item_type is distinct from 'found'::public.item_type_enum then
    raise exception 'custody records only apply to found items';
  end if;

  if new.actor_user_id is not null then
    select u.user_type
    into v_user_type
    from public.user_table u
    where u.user_id = new.actor_user_id;

    if new.record_type in (
      'qr_scanned'::public.custody_record_type_enum,
      'guard_rejected'::public.custody_record_type_enum,
      'guard_accepted'::public.custody_record_type_enum
    ) and v_user_type::text is distinct from 'Guard' then
      raise exception 'actor_user_id must belong to a Guard user for record_type %', new.record_type;
    end if;

    if new.record_type in (
      'security_office_received'::public.custody_record_type_enum,
      'investigation_opened'::public.custody_record_type_enum
    ) and v_user_type not in ('Staff'::public.user_type_enum, 'Admin'::public.user_type_enum) then
      raise exception 'actor_user_id must belong to a Staff or Admin user for record_type %', new.record_type;
    end if;
  end if;

  if new.record_type in (
    'qr_scanned'::public.custody_record_type_enum,
    'guard_rejected'::public.custody_record_type_enum,
    'guard_accepted'::public.custody_record_type_enum,
    'security_office_received'::public.custody_record_type_enum,
    'investigation_opened'::public.custody_record_type_enum
  ) and new.actor_user_id is null then
    raise exception 'record_type % requires actor_user_id', new.record_type;
  end if;

  return new;
end;
$$;

create or replace function public.recompute_item_custody_status(p_post_id integer, p_item_id uuid)
returns public.custody_status_enum
language plpgsql
set search_path to 'public'
as $$
declare
  v_item_type public.item_type_enum;
  v_next_status public.custody_status_enum;
begin
  select i.type
  into v_item_type
  from public.item_table i
  where i.item_id = p_item_id;

  if not found then
    raise exception 'item_id % does not exist', p_item_id;
  end if;

  if v_item_type <> 'found'::public.item_type_enum then
    v_next_status := 'untracked'::public.custody_status_enum;
  elsif exists (
    select 1
    from public.custody_attempt_table ca
    where ca.post_id = p_post_id
      and ca.item_id = p_item_id
      and ca.office_received_at is not null
  ) or exists (
    select 1
    from public.custody_record_table cr
    where cr.post_id = p_post_id
      and cr.item_id = p_item_id
      and cr.record_type = 'security_office_received'::public.custody_record_type_enum
  ) then
    v_next_status := 'in_security_office'::public.custody_status_enum;
  elsif exists (
    select 1
    from public.custody_attempt_table ca
    where ca.post_id = p_post_id
      and ca.item_id = p_item_id
      and ca.investigation_opened_at is not null
  ) or exists (
    select 1
    from public.custody_record_table cr
    where cr.post_id = p_post_id
      and cr.item_id = p_item_id
      and cr.record_type in (
        'investigation_opened'::public.custody_record_type_enum,
        'physical_take_reported'::public.custody_record_type_enum
      )
  ) then
    v_next_status := 'under_investigation'::public.custody_status_enum;
  elsif exists (
    select 1
    from public.custody_attempt_table ca
    where ca.post_id = p_post_id
      and ca.item_id = p_item_id
      and ca.status = 'accepted'::public.custody_attempt_status_enum
  ) then
    v_next_status := 'with_guard'::public.custody_status_enum;
  elsif exists (
    select 1
    from public.custody_attempt_table ca
    where ca.post_id = p_post_id
      and ca.item_id = p_item_id
      and ca.status = 'open'::public.custody_attempt_status_enum
  ) then
    v_next_status := 'handover_in_progress'::public.custody_status_enum;
  else
    v_next_status := 'with_reporter'::public.custody_status_enum;
  end if;

  update public.item_table
  set custody_status = v_next_status
  where item_id = p_item_id;

  return v_next_status;
end;
$$;

create or replace function public.sync_item_custody_status_from_attempt()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_post_id integer;
  v_item_id uuid;
begin
  v_post_id := coalesce(new.post_id, old.post_id);
  v_item_id := coalesce(new.item_id, old.item_id);

  perform public.recompute_item_custody_status(v_post_id, v_item_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.sync_item_custody_status_from_record()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_post_id integer;
  v_item_id uuid;
begin
  v_post_id := coalesce(new.post_id, old.post_id);
  v_item_id := coalesce(new.item_id, old.item_id);

  perform public.recompute_item_custody_status(v_post_id, v_item_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_custody_attempt_set_updated_at on public.custody_attempt_table;
create trigger trg_custody_attempt_set_updated_at
before update on public.custody_attempt_table
for each row
execute function public.set_custody_attempt_updated_at();

drop trigger if exists trg_validate_custody_attempt on public.custody_attempt_table;
create trigger trg_validate_custody_attempt
before insert or update on public.custody_attempt_table
for each row
execute function public.validate_custody_attempt();

drop trigger if exists trg_validate_qr_code_session on public.qr_code_session_table;
create trigger trg_validate_qr_code_session
before insert or update on public.qr_code_session_table
for each row
execute function public.validate_qr_code_session();

drop trigger if exists trg_validate_custody_record on public.custody_record_table;
create trigger trg_validate_custody_record
before insert or update on public.custody_record_table
for each row
execute function public.validate_custody_record();

drop trigger if exists trg_sync_item_custody_status_from_attempt on public.custody_attempt_table;
create trigger trg_sync_item_custody_status_from_attempt
after insert or update or delete on public.custody_attempt_table
for each row
execute function public.sync_item_custody_status_from_attempt();

drop trigger if exists trg_sync_item_custody_status_from_record on public.custody_record_table;
create trigger trg_sync_item_custody_status_from_record
after insert or update or delete on public.custody_record_table
for each row
execute function public.sync_item_custody_status_from_record();

alter table public.guard_post_table enable row level security;
alter table public.custody_attempt_table enable row level security;
alter table public.qr_code_session_table enable row level security;
alter table public.custody_record_table enable row level security;

create policy guard_post_select_authenticated
on public.guard_post_table
for select
to authenticated
using (true);

create policy guard_post_insert_staff_admin
on public.guard_post_table
for insert
to authenticated
with check (public.is_staff_or_admin());

create policy guard_post_update_staff_admin
on public.guard_post_table
for update
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

create policy guard_post_delete_staff_admin
on public.guard_post_table
for delete
to authenticated
using (public.is_staff_or_admin());

create policy custody_attempt_select_relevant_users
on public.custody_attempt_table
for select
to authenticated
using (
  public.is_staff_or_admin()
  or (public.is_guard() and (status = 'open'::public.custody_attempt_status_enum or decision_by_guard_id = auth.uid()))
  or poster_id = auth.uid()
);

create policy custody_attempt_insert_poster_or_staff_admin
on public.custody_attempt_table
for insert
to authenticated
with check (
  poster_id = auth.uid()
  or public.is_staff_or_admin()
);

create policy custody_attempt_update_guard_or_staff_admin
on public.custody_attempt_table
for update
to authenticated
using (
  public.is_staff_or_admin()
  or public.is_guard()
)
with check (
  public.is_staff_or_admin()
  or public.is_guard()
);

create policy qr_code_session_select_relevant_users
on public.qr_code_session_table
for select
to authenticated
using (
  public.is_staff_or_admin()
  or (public.is_guard() and (status = 'active'::public.qr_code_session_status_enum or scanned_by_guard_id = auth.uid()))
  or exists (
    select 1
    from public.custody_attempt_table ca
    where ca.custody_attempt_id = qr_code_session_table.custody_attempt_id
      and ca.poster_id = auth.uid()
  )
);

create policy qr_code_session_insert_poster_or_staff_admin
on public.qr_code_session_table
for insert
to authenticated
with check (
  public.is_staff_or_admin()
  or exists (
    select 1
    from public.custody_attempt_table ca
    where ca.custody_attempt_id = qr_code_session_table.custody_attempt_id
      and ca.poster_id = auth.uid()
  )
);

create policy qr_code_session_update_guard_or_staff_admin
on public.qr_code_session_table
for update
to authenticated
using (
  public.is_staff_or_admin()
  or public.is_guard()
)
with check (
  public.is_staff_or_admin()
  or public.is_guard()
);

create policy custody_record_select_relevant_users
on public.custody_record_table
for select
to authenticated
using (
  public.is_staff_or_admin()
  or public.is_guard()
  or (
    visible_to_poster
    and exists (
      select 1
      from public.post_table p
      where p.post_id = custody_record_table.post_id
        and p.poster_id = auth.uid()
    )
  )
);

create policy custody_record_insert_relevant_users
on public.custody_record_table
for insert
to authenticated
with check (
  public.is_staff_or_admin()
  or public.is_guard()
  or exists (
    select 1
    from public.post_table p
    where p.post_id = custody_record_table.post_id
      and p.poster_id = auth.uid()
  )
);

create or replace view public.post_public_view
with (security_invoker='on')
as
select
  pt.post_id,
  u.user_name as poster_name,
  u.user_id as poster_id,
  u.profile_picture_url,
  it.item_id,
  it.item_name,
  it.item_description,
  it.type as item_type,
  iim.image_link as item_image_url,
  nullif(it.category, ''::text) as category,
  case
    when (dl.date is not null and tl.time_id is not null)
      then (dl.date::timestamp without time zone + make_interval(hours => tl.hours, mins => tl.minutes))
    when dl.date is not null
      then dl.date::timestamp without time zone
    else null::timestamp without time zone
  end as last_seen_at,
  ll.full_location_name as last_seen_location,
  staff.user_name as accepted_by_staff_name,
  staff.email as accepted_by_staff_email,
  pt.submitted_on_date_local as submission_date,
  pt.status as post_status,
  it.status as item_status,
  pt.is_anonymous,
  cl.claim_id,
  cl.claimer_name as claimed_by_name,
  cl.claimer_school_email as claimed_by_email,
  cl.claimer_contact_num as claimed_by_contact,
  cl.claimed_at,
  cl.processed_by_staff_id as claim_processed_by_staff_id,
  pt.accepted_on_date_local as accepted_on_date,
  it.custody_status
from public.post_table pt
join public.item_table it on it.item_id = pt.item_id
left join public.item_image_table iim on iim.item_image_id = it.image_id
left join public.user_table u on u.user_id = pt.poster_id
left join public.date_lookup dl on dl.date_id = pt.last_seen_date_id
left join public.time_lookup tl on tl.time_id = pt.last_seen_time_id
left join public.location_lookup ll on ll.location_id = pt.last_seen_location_id
left join public.user_table staff on staff.user_id = pt.accepted_by_staff_id
left join public.claim_table cl on cl.item_id = it.item_id;

create or replace view public.v_post_records_details
with (security_invoker='on')
as
select
  p.post_id,
  p.poster_id,
  p.status as post_status,
  p.item_id,
  p.is_anonymous,
  p.submitted_on_date_local,
  p.accepted_on_date_local,
  p.rejection_reason,
  dl.date as last_seen_date,
  make_time(coalesce(tl.hours, 0), coalesce(tl.minutes, 0), 0::double precision) as last_seen_time,
  case
    when (dl.date is not null and (tl.hours is not null or tl.minutes is not null))
      then (dl.date::timestamp without time zone + make_interval(hours => coalesce(tl.hours, 0), mins => coalesce(tl.minutes, 0)))
    when dl.date is not null
      then dl.date::timestamp without time zone
    else null::timestamp without time zone
  end as last_seen_at,
  ll.full_location_name as last_seen_location,
  i.item_name,
  i.item_description,
  i.image_id,
  iim.image_link as item_image_url,
  i.status as item_status,
  i.type as item_type,
  i.category,
  i.search_vector,
  i.returned_at_local,
  up.user_name as poster_name,
  up.email as poster_email,
  up.profile_picture_url as poster_profile_picture_url,
  c.claimer_name,
  c.claimer_school_email,
  c.claimer_contact_num,
  c.claimed_at,
  c.linked_lost_item_id,
  uc.user_name as claim_processed_by_name,
  uc.email as claim_processed_by_email,
  uc.profile_picture_url as claim_processed_by_profile_picture_url,
  i.custody_status
from public.post_table p
left join public.item_table i on i.item_id = p.item_id
left join public.item_image_table iim on iim.item_image_id = i.image_id
left join public.date_lookup dl on dl.date_id = p.last_seen_date_id
left join public.time_lookup tl on tl.time_id = p.last_seen_time_id
left join public.location_lookup ll on ll.location_id = p.last_seen_location_id
left join public.claim_table c on c.item_id = i.item_id
left join public.user_table uc on uc.user_id = c.processed_by_staff_id
left join public.user_table up on up.user_id = p.poster_id;
