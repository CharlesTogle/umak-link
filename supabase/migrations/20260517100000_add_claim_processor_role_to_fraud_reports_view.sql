create or replace view public.fraud_reports_public_v
with (security_invoker='on')
as
select
  fr.report_id,
  fr.post_id,
  fr.report_status,
  fr.reason_for_reporting,
  fr.date_reported,
  fr.proof_image_url,
  fr.claim_id,
  ct.linked_lost_item_id,
  p.poster_id,
  p.status as post_status,
  p.item_id,
  p.is_anonymous,
  p.submitted_on_date_local,
  p.accepted_on_date_local,
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
  fr.claimer_name,
  fr.claimer_school_email,
  fr.claimer_contact_num,
  fr.claimed_at,
  uc.user_name as claim_processed_by_name,
  uc.email as claim_processed_by_email,
  ur.user_id as reporter_id,
  ur.user_name as reporter_name,
  ur.email as reporter_email,
  ur.profile_picture_url as reporter_profile_picture_url,
  up.user_name as poster_name,
  up.email as poster_email,
  up.profile_picture_url as poster_profile_picture_url,
  uf.user_id as fraud_reviewer_id,
  uf.user_name as fraud_reviewer_name,
  uf.email as fraud_reviewer_email,
  uc.user_type as claim_processed_by_user_type
from public.fraud_reports_table fr
join public.post_table p on p.post_id = fr.post_id
left join public.claim_table ct on ct.claim_id = fr.claim_id
left join public.item_table i on i.item_id = p.item_id
left join public.item_image_table iim on iim.item_image_id = i.image_id
left join public.date_lookup dl on dl.date_id = p.last_seen_date_id
left join public.time_lookup tl on tl.time_id = p.last_seen_time_id
left join public.location_lookup ll on ll.location_id = p.last_seen_location_id
left join public.user_table uc on uc.user_id = fr.claim_processed_by_staff_id
left join public.user_table up on up.user_id = p.poster_id
left join public.user_table ur on ur.user_id = fr.reported_by
left join public.user_table uf on uf.user_id = fr.processed_by_staff_id;
