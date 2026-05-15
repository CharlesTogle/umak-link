create or replace function public.process_claim(
  found_post_id integer,
  claim_details jsonb,
  missing_post_id integer default null::integer
) returns void
language plpgsql
security definer
as $$
declare
  v_claim_id uuid := gen_random_uuid();
  v_log_id uuid := gen_random_uuid();
  v_custody_record_id uuid := gen_random_uuid();

  v_staff_id uuid;
  v_timestamp_local timestamp without time zone := (now() at time zone 'Asia/Manila');
  v_claimed_at timestamp with time zone := coalesce((claim_details->>'claimed_at')::timestamp with time zone, now());

  v_claimed_item_id uuid;
  v_returned_item_id uuid;

  v_claimed_item_name text;
  v_returned_item_name text;

  v_poster_name text;
  v_staff_name text;
  v_claimer_name text;
begin
  v_staff_id := claim_details->>'staff_id';
  v_claimer_name := claim_details->>'claimer_name';
  v_poster_name := claim_details->>'poster_name';
  v_staff_name := claim_details->>'staff_name';

  select item_id into v_claimed_item_id
  from post_table where post_id = found_post_id;

  if missing_post_id is not null then
    select item_id into v_returned_item_id
    from post_table where post_id = missing_post_id;
  end if;

  select item_name into v_claimed_item_name
  from item_table where item_id = v_claimed_item_id;

  if v_returned_item_id is not null then
    select item_name into v_returned_item_name
    from item_table where item_id = v_returned_item_id;
  end if;

  insert into claim_table(
    claim_id,
    item_id,
    claimer_name,
    claimer_school_email,
    claimer_contact_num,
    processed_by_staff_id,
    claimed_at,
    linked_lost_item_id
  )
  values(
    v_claim_id,
    v_claimed_item_id,
    claim_details->>'claimer_name',
    claim_details->>'claimer_school_email',
    claim_details->>'claimer_contact_num',
    v_staff_id,
    v_claimed_at,
    v_returned_item_id
  );

  update item_table
  set status = 'claimed'
  where item_id = v_claimed_item_id;

  update post_table
  set status = 'accepted'
  where post_id = found_post_id
    and status = 'pending';

  insert into public.custody_record_table (
    custody_record_id,
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
    v_custody_record_id,
    found_post_id,
    v_claimed_item_id,
    null,
    null,
    null,
    v_staff_id,
    'claimed_by_student'::public.custody_record_type_enum,
    true,
    jsonb_build_object(
      'claim_id', v_claim_id
    ),
    v_claimed_at
  );

  if v_returned_item_id is not null then
    update item_table
    set status = 'returned'
    where item_id = v_returned_item_id;
  end if;

  insert into audit_table(
    log_id, user_id, action_type, details, timestamp, timestamp_local
  )
  values(
    v_log_id,
    v_staff_id,
    'process_claiming_item',
    jsonb_build_object(
      'message', v_staff_name || ' has processed the claiming for item ' ||
                 coalesce(v_returned_item_name, v_claimed_item_name),
      'returned_item_name', v_returned_item_name,
      'claimed_item_name', v_claimed_item_name,
      'poster_name', v_poster_name,
      'claimer_name', v_claimer_name,
      'staff_name', v_staff_name,
      'timestamp', v_timestamp_local
    ),
    now(),
    v_timestamp_local
  );
end;
$$;

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
  i.custody_status,
  uc.user_type as claim_processed_by_user_type
from public.post_table p
left join public.item_table i on i.item_id = p.item_id
left join public.item_image_table iim on iim.item_image_id = i.image_id
left join public.date_lookup dl on dl.date_id = p.last_seen_date_id
left join public.time_lookup tl on tl.time_id = p.last_seen_time_id
left join public.location_lookup ll on ll.location_id = p.last_seen_location_id
left join public.claim_table c on c.item_id = i.item_id
left join public.user_table uc on uc.user_id = c.processed_by_staff_id
left join public.user_table up on up.user_id = p.poster_id;
