alter type public.custody_status_enum
add value if not exists 'discarded';

alter type public.custody_record_type_enum
add value if not exists 'item_discarded';

create table if not exists public.item_discard_table (
  item_discard_id uuid default gen_random_uuid() not null,
  item_id uuid not null,
  post_id integer not null,
  previous_item_status public.item_status_enum not null,
  previous_custody_status public.custody_status_enum not null,
  discarded_reason text not null,
  discarded_by_user_id uuid not null,
  discarded_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  constraint item_discard_table_pkey primary key (item_discard_id),
  constraint item_discard_table_item_id_fkey foreign key (item_id)
    references public.item_table(item_id) on delete cascade,
  constraint item_discard_table_post_id_fkey foreign key (post_id)
    references public.post_table(post_id) on delete cascade,
  constraint item_discard_table_discarded_by_user_id_fkey foreign key (discarded_by_user_id)
    references public.user_table(user_id) on delete restrict,
  constraint item_discard_table_discarded_reason_check
    check (length(btrim(discarded_reason)) > 0)
);

alter table only public.item_discard_table force row level security;

comment on table public.item_discard_table is
  'Append-only log of found-item discard transitions and their recorded disposition.';

comment on column public.item_discard_table.discarded_reason is
  'Staff-entered disposition explaining what happened to the discarded item.';

create index if not exists idx_item_discard_item_id_discarded_at
  on public.item_discard_table using btree (item_id, discarded_at desc);

create index if not exists idx_item_discard_post_id_discarded_at
  on public.item_discard_table using btree (post_id, discarded_at desc);

alter table public.item_discard_table enable row level security;

create policy item_discard_select_staff_admin
on public.item_discard_table
for select
to authenticated
using (public.is_staff_or_admin());

create policy item_discard_insert_staff_admin
on public.item_discard_table
for insert
to authenticated
with check (public.is_staff_or_admin());

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
      'investigation_opened'::public.custody_record_type_enum,
      'physical_take_reported'::public.custody_record_type_enum,
      'claimed_by_student'::public.custody_record_type_enum
    ) and v_user_type <> 'Staff'::public.user_type_enum then
      raise exception 'actor_user_id must belong to a Staff user for record_type %', new.record_type;
    end if;

    if new.record_type = 'item_discarded'::public.custody_record_type_enum
      and v_user_type not in ('Staff'::public.user_type_enum, 'Admin'::public.user_type_enum) then
      raise exception 'actor_user_id must belong to a Staff or Admin user for record_type %', new.record_type;
    end if;
  end if;

  if new.record_type in (
    'qr_scanned'::public.custody_record_type_enum,
    'guard_rejected'::public.custody_record_type_enum,
    'guard_accepted'::public.custody_record_type_enum,
    'security_office_received'::public.custody_record_type_enum,
    'investigation_opened'::public.custody_record_type_enum,
    'physical_take_reported'::public.custody_record_type_enum,
    'claimed_by_student'::public.custody_record_type_enum,
    'item_discarded'::public.custody_record_type_enum
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
  v_item_status public.item_status_enum;
  v_next_status public.custody_status_enum;
begin
  select i.type, i.status
  into v_item_type, v_item_status
  from public.item_table i
  where i.item_id = p_item_id;

  if not found then
    raise exception 'item_id % does not exist', p_item_id;
  end if;

  if v_item_type <> 'found'::public.item_type_enum then
    v_next_status := 'untracked'::public.custody_status_enum;
  elsif v_item_status = 'discarded'::public.item_status_enum then
    v_next_status := 'discarded'::public.custody_status_enum;
  elsif v_item_status = 'claimed'::public.item_status_enum and exists (
    select 1
    from public.custody_record_table cr
    where cr.post_id = p_post_id
      and cr.item_id = p_item_id
      and cr.record_type = 'claimed_by_student'::public.custody_record_type_enum
  ) then
    v_next_status := 'claimed_by_student'::public.custody_status_enum;
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

create or replace function public.discard_found_item(
  p_item_id uuid,
  p_actor_user_id uuid,
  p_discarded_reason text,
  p_occurred_at timestamp with time zone default now()
)
returns table (
  post_id integer,
  item_id uuid,
  item_name text,
  previous_item_status public.item_status_enum,
  previous_custody_status public.custody_status_enum,
  discarded_reason text,
  discarded_at timestamp with time zone,
  item_discard_id uuid,
  custody_record_id uuid
)
language plpgsql
set search_path to 'public'
as $$
declare
  v_post_id integer;
  v_item_name text;
  v_item_type public.item_type_enum;
  v_previous_item_status public.item_status_enum;
  v_previous_custody_status public.custody_status_enum;
  v_actor_user_type public.user_type_enum;
begin
  p_discarded_reason := nullif(btrim(p_discarded_reason), '');
  discarded_at := coalesce(p_occurred_at, now());

  if p_item_id is null then
    raise exception 'p_item_id is required';
  end if;

  if p_actor_user_id is null then
    raise exception 'p_actor_user_id is required';
  end if;

  if p_discarded_reason is null then
    raise exception 'discarded reason is required';
  end if;

  select u.user_type
  into v_actor_user_type
  from public.user_table u
  where u.user_id = p_actor_user_id;

  if not found or v_actor_user_type not in ('Staff'::public.user_type_enum, 'Admin'::public.user_type_enum) then
    raise exception 'discard action requires a Staff or Admin actor';
  end if;

  select
    p.post_id,
    i.item_name,
    i.type,
    i.status,
    i.custody_status
  into
    v_post_id,
    v_item_name,
    v_item_type,
    v_previous_item_status,
    v_previous_custody_status
  from public.post_table p
  join public.item_table i on i.item_id = p.item_id
  where i.item_id = p_item_id
  order by p.post_id desc
  limit 1;

  if not found then
    raise exception 'item_id % does not exist', p_item_id;
  end if;

  if v_item_type <> 'found'::public.item_type_enum then
    raise exception 'only found items can be discarded';
  end if;

  if v_previous_item_status = 'discarded'::public.item_status_enum then
    raise exception 'item is already discarded';
  end if;

  update public.item_table
  set status = 'discarded'::public.item_status_enum
  where item_id = p_item_id;

  insert into public.item_discard_table (
    item_id,
    post_id,
    previous_item_status,
    previous_custody_status,
    discarded_reason,
    discarded_by_user_id,
    discarded_at
  )
  values (
    p_item_id,
    v_post_id,
    v_previous_item_status,
    v_previous_custody_status,
    p_discarded_reason,
    p_actor_user_id,
    discarded_at
  )
  returning public.item_discard_table.item_discard_id
  into item_discard_id;

  insert into public.custody_record_table (
    post_id,
    item_id,
    custody_attempt_id,
    qr_code_session_id,
    guard_post_id,
    actor_user_id,
    record_type,
    visible_to_poster,
    details,
    occurred_at
  )
  values (
    v_post_id,
    p_item_id,
    null,
    null,
    null,
    p_actor_user_id,
    'item_discarded'::public.custody_record_type_enum,
    true,
    jsonb_build_object(
      'discard_reason', p_discarded_reason,
      'previous_item_status', v_previous_item_status,
      'next_item_status', 'discarded',
      'previous_custody_status', v_previous_custody_status,
      'next_custody_status', 'discarded'
    ),
    discarded_at
  )
  returning public.custody_record_table.custody_record_id
  into custody_record_id;

  post_id := v_post_id;
  item_id := p_item_id;
  item_name := v_item_name;
  previous_item_status := v_previous_item_status;
  previous_custody_status := v_previous_custody_status;
  discarded_reason := p_discarded_reason;

  return next;
end;
$$;
