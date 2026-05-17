-- Reconcile claim-processing rows created before the old split flow finished
-- its verification and custody follow-up writes.

with claim_session_targets as (
  select
    c.claim_id,
    c.item_id,
    c.claim_verification_session_id,
    coalesce(c.claimed_at, now()) as reconciled_at,
    cvs.claimer_user_id,
    case
      when cvs.processor_user_type = 'Guard'::public.user_type_enum
        then 'guard_qr'::public.claim_verification_method_enum
      else 'staff_qr'::public.claim_verification_method_enum
    end as resolved_verification_method
  from public.claim_table c
  join public.claim_verification_session_table cvs
    on cvs.claim_verification_session_id = c.claim_verification_session_id
  join public.item_table i
    on i.item_id = c.item_id
  where i.type = 'found'::public.item_type_enum
    and cvs.claimer_user_id is not null
),
completed_sessions as (
  update public.claim_verification_session_table cvs
  set
    status = 'completed'::public.claim_verification_session_status_enum,
    completed_at = coalesce(cvs.completed_at, t.reconciled_at),
    closed_at = coalesce(cvs.closed_at, t.reconciled_at),
    updated_at = greatest(cvs.updated_at, t.reconciled_at)
  from claim_session_targets t
  where cvs.claim_verification_session_id = t.claim_verification_session_id
    and (
      cvs.status is distinct from 'completed'::public.claim_verification_session_status_enum
      or cvs.completed_at is null
      or cvs.closed_at is null
      or cvs.updated_at < t.reconciled_at
    )
  returning cvs.claim_verification_session_id
)
select count(*)
from completed_sessions;

with claim_session_targets as (
  select
    c.claim_id,
    c.claim_verification_session_id,
    coalesce(c.claimed_at, now()) as reconciled_at
  from public.claim_table c
  join public.claim_verification_session_table cvs
    on cvs.claim_verification_session_id = c.claim_verification_session_id
  join public.item_table i
    on i.item_id = c.item_id
  where i.type = 'found'::public.item_type_enum
    and cvs.claimer_user_id is not null
),
closed_qr_sessions as (
  update public.claim_qr_session_table qrs
  set closed_at = coalesce(qrs.closed_at, t.reconciled_at)
  from claim_session_targets t
  where qrs.claim_verification_session_id = t.claim_verification_session_id
    and qrs.closed_at is null
  returning qrs.claim_qr_session_id
)
select count(*)
from closed_qr_sessions;

with completed_claim_session_targets as (
  select
    c.claim_id,
    c.processed_by_staff_id,
    cvs.claim_verification_session_id,
    qrs.claim_qr_session_id,
    cvs.post_id,
    cvs.item_id,
    cvs.claimer_user_id,
    coalesce(cvs.completed_at, c.claimed_at, now()) as reconciled_at,
    case
      when cvs.processor_user_type = 'Guard'::public.user_type_enum
        then 'guard_qr'::public.claim_verification_method_enum
      else 'staff_qr'::public.claim_verification_method_enum
    end as resolved_verification_method
  from public.claim_table c
  join public.claim_verification_session_table cvs
    on cvs.claim_verification_session_id = c.claim_verification_session_id
  left join public.claim_qr_session_table qrs
    on qrs.claim_verification_session_id = cvs.claim_verification_session_id
  join public.item_table i
    on i.item_id = c.item_id
  where i.type = 'found'::public.item_type_enum
    and cvs.claimer_user_id is not null
    and cvs.status = 'completed'::public.claim_verification_session_status_enum
),
normalized_claims as (
  update public.claim_table c
  set
    verified_claimer_user_id = coalesce(c.verified_claimer_user_id, t.claimer_user_id),
    verification_method = case
      when c.verification_method = 'manual_staff'::public.claim_verification_method_enum
        then t.resolved_verification_method
      else c.verification_method
    end
  from completed_claim_session_targets t
  where c.claim_id = t.claim_id
    and (
      c.verified_claimer_user_id is null
      or (
        c.verification_method = 'manual_staff'::public.claim_verification_method_enum
        and c.verification_method is distinct from t.resolved_verification_method
      )
    )
  returning c.claim_id
)
select count(*)
from normalized_claims;

with completed_claim_session_targets as (
  select
    c.claim_id,
    c.processed_by_staff_id,
    cvs.claim_verification_session_id,
    qrs.claim_qr_session_id,
    cvs.post_id,
    cvs.item_id,
    coalesce(cvs.completed_at, c.claimed_at, now()) as reconciled_at,
    case
      when cvs.processor_user_type = 'Guard'::public.user_type_enum
        then 'guard_qr'::public.claim_verification_method_enum
      else 'staff_qr'::public.claim_verification_method_enum
    end as resolved_verification_method
  from public.claim_table c
  join public.claim_verification_session_table cvs
    on cvs.claim_verification_session_id = c.claim_verification_session_id
  left join public.claim_qr_session_table qrs
    on qrs.claim_verification_session_id = cvs.claim_verification_session_id
  join public.item_table i
    on i.item_id = c.item_id
  where i.type = 'found'::public.item_type_enum
    and cvs.claimer_user_id is not null
    and cvs.status = 'completed'::public.claim_verification_session_status_enum
),
inserted_claim_completed_records as (
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
  select
    gen_random_uuid(),
    t.claim_verification_session_id,
    t.claim_qr_session_id,
    t.post_id,
    t.item_id,
    t.processed_by_staff_id,
    'claim_completed',
    jsonb_build_object(
      'claim_id', t.claim_id,
      'verification_method', t.resolved_verification_method
    ),
    t.reconciled_at
  from completed_claim_session_targets t
  where not exists (
    select 1
    from public.claim_verification_record_table cvr
    where cvr.claim_verification_session_id = t.claim_verification_session_id
      and cvr.record_type = 'claim_completed'
      and cvr.details->>'claim_id' = t.claim_id::text
  )
  returning claim_verification_record_id
)
select count(*)
from inserted_claim_completed_records;

with claim_owned_custody_items as (
  select distinct cr.item_id
  from public.custody_record_table cr
  join public.claim_table c
    on c.claim_id::text = cr.details->>'claim_id'
   and c.item_id = cr.item_id
  join public.item_table i
    on i.item_id = cr.item_id
  where cr.record_type = 'claimed_by_student'::public.custody_record_type_enum
    and i.type = 'found'::public.item_type_enum
    and i.status = 'claimed'::public.item_status_enum
)
update public.item_table i
set custody_status = 'claimed_by_student'::public.custody_status_enum
from claim_owned_custody_items ci
where i.item_id = ci.item_id
  and i.custody_status is distinct from 'claimed_by_student'::public.custody_status_enum;
