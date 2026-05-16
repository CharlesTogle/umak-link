create or replace function public.recompute_item_custody_status(p_post_id integer, p_item_id uuid)
returns public.custody_status_enum
language plpgsql
set search_path to 'public'
as $$
declare
  v_item_type public.item_type_enum;
  v_next_status public.custody_status_enum;
begin
  select i.type
  into v_item_type
  from public.item_table i
  where i.item_id = p_item_id;

  if not found then
    raise exception 'item_id % does not exist', p_item_id;
  end if;

  if v_item_type <> 'found'::public.item_type_enum then
    v_next_status := 'untracked'::public.custody_status_enum;
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
