create or replace function public.process_claim(
  found_post_id integer,
  claim_details jsonb,
  missing_post_id integer default null::integer,
  claim_verification jsonb default null::jsonb
) returns uuid
language plpgsql
security definer
as $$
declare
  v_claim_id uuid := gen_random_uuid();
  v_custody_record_id uuid := gen_random_uuid();
  v_claim_verification_record_id uuid := gen_random_uuid();

  v_staff_id uuid;
  v_claimed_at timestamp with time zone := coalesce((claim_details->>'claimed_at')::timestamp with time zone, now());

  v_claimed_item_id uuid;
  v_returned_item_id uuid;

  v_verified_claimer_user_id uuid;
  v_claim_verification_session_id uuid;
  v_claim_qr_session_id uuid;
  v_verification_method public.claim_verification_method_enum := 'manual_staff'::public.claim_verification_method_enum;
begin
  v_staff_id := (claim_details->>'staff_id')::uuid;

  if claim_verification is not null then
    v_verification_method := coalesce(
      (claim_verification->>'verification_method')::public.claim_verification_method_enum,
      'manual_staff'::public.claim_verification_method_enum
    );
    v_verified_claimer_user_id := (claim_verification->>'verified_claimer_user_id')::uuid;
    v_claim_verification_session_id := (claim_verification->>'claim_verification_session_id')::uuid;
    v_claim_qr_session_id := (claim_verification->>'claim_qr_session_id')::uuid;
  end if;

  select item_id into v_claimed_item_id
  from post_table where post_id = found_post_id;

  if missing_post_id is not null then
    select item_id into v_returned_item_id
    from post_table where post_id = missing_post_id;
  end if;

  insert into claim_table(
    claim_id,
    item_id,
    claimer_name,
    claimer_school_email,
    claimer_contact_num,
    processed_by_staff_id,
    claimed_at,
    linked_lost_item_id,
    verified_claimer_user_id,
    claim_verification_session_id,
    verification_method
  )
  values(
    v_claim_id,
    v_claimed_item_id,
    claim_details->>'claimer_name',
    claim_details->>'claimer_school_email',
    claim_details->>'claimer_contact_num',
    v_staff_id,
    v_claimed_at,
    v_returned_item_id,
    v_verified_claimer_user_id,
    v_claim_verification_session_id,
    v_verification_method
  );

  update item_table
  set status = 'claimed'
  where item_id = v_claimed_item_id;

  update post_table
  set status = 'accepted'
  where post_id = found_post_id
    and status = 'pending';

  if missing_post_id is not null then
    update post_table
    set status = 'accepted'
    where post_id = missing_post_id
      and status = 'pending';
  end if;

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

  if v_claim_verification_session_id is not null then
    update public.claim_verification_session_table
    set status = 'completed',
        completed_at = v_claimed_at,
        closed_at = v_claimed_at,
        updated_at = v_claimed_at
    where claim_verification_session_id = v_claim_verification_session_id;

    if v_claim_qr_session_id is not null then
      update public.claim_qr_session_table
      set closed_at = v_claimed_at
      where claim_qr_session_id = v_claim_qr_session_id
        and closed_at is null;
    end if;

    insert into public.claim_verification_record_table (
      claim_verification_record_id,
      claim_verification_session_id,
      claim_qr_session_id,
      post_id,
      item_id,
      actor_user_id,
      record_type,
      details,
      occurred_at
    )
    values (
      v_claim_verification_record_id,
      v_claim_verification_session_id,
      v_claim_qr_session_id,
      found_post_id,
      v_claimed_item_id,
      v_staff_id,
      'claim_completed',
      jsonb_build_object(
        'claim_id', v_claim_id,
        'verification_method', v_verification_method
      ),
      v_claimed_at
    );
  end if;

  if v_returned_item_id is not null then
    update item_table
    set status = 'returned'
    where item_id = v_returned_item_id;
  end if;

  return v_claim_id;
end;
$$;

grant all on function public.process_claim(integer, jsonb, integer, jsonb) to anon;
grant all on function public.process_claim(integer, jsonb, integer, jsonb) to authenticated;
grant all on function public.process_claim(integer, jsonb, integer, jsonb) to service_role;
