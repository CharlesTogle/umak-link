do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'claim_verification_session_status_enum'
  ) then
    create type public.claim_verification_session_status_enum as enum (
      'awaiting_claimer',
      'qr_active',
      'scanned',
      'completed',
      'expired',
      'cancelled'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'claim_qr_session_status_enum'
  ) then
    create type public.claim_qr_session_status_enum as enum (
      'active',
      'scanned',
      'expired',
      'cancelled'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'claim_verification_method_enum'
  ) then
    create type public.claim_verification_method_enum as enum (
      'manual_staff',
      'staff_qr',
      'guard_qr'
    );
  end if;
end $$;

create table if not exists public.claim_verification_session_table (
  claim_verification_session_id uuid default gen_random_uuid() not null,
  post_id integer not null,
  item_id uuid not null,
  processor_user_id uuid not null,
  processor_user_type public.user_type_enum not null,
  claimer_user_id uuid null,
  join_code text not null,
  status public.claim_verification_session_status_enum not null default 'awaiting_claimer',
  number_of_attempts integer not null default 1,
  expires_at timestamptz not null,
  scanned_at timestamptz null,
  completed_at timestamptz null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb,
  constraint claim_verification_session_table_pkey primary key (claim_verification_session_id),
  constraint claim_verification_session_table_post_id_fkey
    foreign key (post_id) references public.post_table(post_id) on update cascade on delete cascade,
  constraint claim_verification_session_table_item_id_fkey
    foreign key (item_id) references public.item_table(item_id) on update cascade on delete cascade,
  constraint claim_verification_session_table_processor_user_id_fkey
    foreign key (processor_user_id) references public.user_table(user_id),
  constraint claim_verification_session_table_claimer_user_id_fkey
    foreign key (claimer_user_id) references public.user_table(user_id),
  constraint claim_verification_session_table_join_code_key unique (join_code)
);

create index if not exists idx_claim_verification_session_processor
  on public.claim_verification_session_table using btree (processor_user_id);

create index if not exists idx_claim_verification_session_claimer
  on public.claim_verification_session_table using btree (claimer_user_id);

create index if not exists idx_claim_verification_session_status
  on public.claim_verification_session_table using btree (status);

create index if not exists idx_claim_verification_session_expires_at
  on public.claim_verification_session_table using btree (expires_at);

create unique index if not exists idx_claim_verification_one_active_session_per_post
  on public.claim_verification_session_table using btree (post_id)
  where status in (
    'awaiting_claimer'::public.claim_verification_session_status_enum,
    'qr_active'::public.claim_verification_session_status_enum,
    'scanned'::public.claim_verification_session_status_enum
  );

create table if not exists public.claim_qr_session_table (
  claim_qr_session_id uuid default gen_random_uuid() not null,
  claim_verification_session_id uuid not null,
  session_token_hash text not null,
  status public.claim_qr_session_status_enum not null default 'active',
  expires_at timestamptz not null,
  scanned_by_processor_id uuid null,
  scanned_at timestamptz null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint claim_qr_session_table_pkey primary key (claim_qr_session_id),
  constraint claim_qr_session_table_claim_verification_session_id_key
    unique (claim_verification_session_id),
  constraint claim_qr_session_table_session_token_hash_key unique (session_token_hash),
  constraint claim_qr_session_table_claim_verification_session_id_fkey
    foreign key (claim_verification_session_id)
    references public.claim_verification_session_table(claim_verification_session_id)
    on update cascade on delete cascade,
  constraint claim_qr_session_table_scanned_by_processor_id_fkey
    foreign key (scanned_by_processor_id) references public.user_table(user_id)
);

create index if not exists idx_claim_qr_session_status
  on public.claim_qr_session_table using btree (status);

create index if not exists idx_claim_qr_session_expires_at
  on public.claim_qr_session_table using btree (expires_at);

create table if not exists public.claim_verification_record_table (
  claim_verification_record_id uuid default gen_random_uuid() not null,
  claim_verification_session_id uuid not null,
  claim_qr_session_id uuid null,
  post_id integer not null,
  item_id uuid not null,
  actor_user_id uuid null,
  record_type text not null,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint claim_verification_record_table_pkey primary key (claim_verification_record_id),
  constraint claim_verification_record_table_session_id_fkey
    foreign key (claim_verification_session_id)
    references public.claim_verification_session_table(claim_verification_session_id)
    on update cascade on delete cascade,
  constraint claim_verification_record_table_qr_session_id_fkey
    foreign key (claim_qr_session_id)
    references public.claim_qr_session_table(claim_qr_session_id)
    on update cascade on delete set null,
  constraint claim_verification_record_table_post_id_fkey
    foreign key (post_id) references public.post_table(post_id) on update cascade on delete cascade,
  constraint claim_verification_record_table_item_id_fkey
    foreign key (item_id) references public.item_table(item_id) on update cascade on delete cascade,
  constraint claim_verification_record_table_actor_user_id_fkey
    foreign key (actor_user_id) references public.user_table(user_id)
);

create index if not exists idx_claim_verification_record_session
  on public.claim_verification_record_table using btree (claim_verification_session_id, occurred_at desc);

create index if not exists idx_claim_verification_record_post
  on public.claim_verification_record_table using btree (post_id, occurred_at desc);

create index if not exists idx_claim_verification_record_item
  on public.claim_verification_record_table using btree (item_id, occurred_at desc);

alter table public.claim_table
  add column if not exists verified_claimer_user_id uuid null references public.user_table(user_id);

alter table public.claim_table
  add column if not exists claim_verification_session_id uuid null
  references public.claim_verification_session_table(claim_verification_session_id);

alter table public.claim_table
  add column if not exists verification_method public.claim_verification_method_enum
  not null default 'manual_staff';

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
      'physical_take_reported'::public.custody_record_type_enum
    ) and v_user_type <> 'Staff'::public.user_type_enum then
      raise exception 'actor_user_id must belong to a Staff user for record_type %', new.record_type;
    end if;

    if new.record_type = 'claimed_by_student'::public.custody_record_type_enum
      and v_user_type not in (
        'Staff'::public.user_type_enum,
        'Admin'::public.user_type_enum,
        'Guard'::public.user_type_enum
      ) then
      raise exception 'actor_user_id must belong to a Staff, Admin, or Guard user for record_type %', new.record_type;
    end if;
  end if;

  if new.record_type in (
    'qr_scanned'::public.custody_record_type_enum,
    'guard_rejected'::public.custody_record_type_enum,
    'guard_accepted'::public.custody_record_type_enum,
    'security_office_received'::public.custody_record_type_enum,
    'investigation_opened'::public.custody_record_type_enum,
    'physical_take_reported'::public.custody_record_type_enum,
    'claimed_by_student'::public.custody_record_type_enum
  ) and new.actor_user_id is null then
    raise exception 'record_type % requires actor_user_id', new.record_type;
  end if;

  return new;
end;
$$;
