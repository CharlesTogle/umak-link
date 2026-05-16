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

  update public.item_table as i
  set status = 'discarded'::public.item_status_enum
  where i.item_id = p_item_id;

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
