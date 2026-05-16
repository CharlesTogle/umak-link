alter type public.custody_record_type_enum
add value if not exists 'claimed_by_student';

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
