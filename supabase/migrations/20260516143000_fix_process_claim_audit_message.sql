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
      'message', v_staff_name || ' completed the handover of ' ||
                 coalesce(v_returned_item_name, v_claimed_item_name) || ' to ' || v_claimer_name,
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
