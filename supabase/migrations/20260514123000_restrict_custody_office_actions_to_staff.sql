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

    if v_user_type <> 'Staff'::public.user_type_enum then
      raise exception 'office_received_by_staff_id must belong to a Staff user';
    end if;
  end if;

  if new.investigation_opened_by is not null then
    select u.user_type
    into v_user_type
    from public.user_table u
    where u.user_id = new.investigation_opened_by;

    if v_user_type <> 'Staff'::public.user_type_enum then
      raise exception 'investigation_opened_by must belong to a Staff user';
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
    ) and v_user_type <> 'Staff'::public.user_type_enum then
      raise exception 'actor_user_id must belong to a Staff user for record_type %', new.record_type;
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
