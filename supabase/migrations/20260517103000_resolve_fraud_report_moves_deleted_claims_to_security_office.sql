create or replace function public.resolve_fraud_report(
  p_report_id uuid,
  p_delete_claim boolean default false,
  p_processed_by_staff_id uuid default null::uuid
) returns table(success boolean, message text)
language plpgsql
security definer
as $$
declare
  v_claim_id uuid;
  v_item_id uuid;
  v_post_id integer;
  v_linked_lost_item_id uuid;
  v_previous_custody_status public.custody_status_enum;
  v_resolved_at timestamp with time zone := now();
begin
  select
    fr.claim_id,
    fr.post_id
  into
    v_claim_id,
    v_post_id
  from public.fraud_reports_table fr
  where fr.report_id = p_report_id;

  if v_post_id is null then
    return query select false, 'Fraud report not found';
    return;
  end if;

  update public.fraud_reports_table
  set
    report_status = 'resolved',
    processed_by_staff_id = p_processed_by_staff_id
  where report_id = p_report_id;

  update public.post_table
  set status = 'accepted'
  where post_id = v_post_id;

  if p_delete_claim and v_claim_id is not null then
    if p_processed_by_staff_id is null then
      raise exception 'p_processed_by_staff_id is required when deleting a claim during fraud report resolution';
    end if;

    select
      c.item_id,
      c.linked_lost_item_id,
      i.custody_status
    into
      v_item_id,
      v_linked_lost_item_id,
      v_previous_custody_status
    from public.claim_table c
    left join public.item_table i on i.item_id = c.item_id
    where c.claim_id = v_claim_id;

    if v_linked_lost_item_id is not null then
      update public.item_table
      set
        status = 'lost',
        returned_at = null,
        returned_at_local = null
      where item_id = v_linked_lost_item_id;
    end if;

    if v_item_id is not null then
      update public.item_table
      set status = 'unclaimed'
      where item_id = v_item_id;
    end if;

    delete from public.claim_table
    where claim_id = v_claim_id;

    if v_item_id is not null then
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
        v_item_id,
        null,
        null,
        null,
        p_processed_by_staff_id,
        'security_office_received'::public.custody_record_type_enum,
        true,
        jsonb_build_object(
          'source', 'fraud_report_resolution',
          'fraud_report_id', p_report_id,
          'claim_id', v_claim_id,
          'previous_custody_status', v_previous_custody_status,
          'next_custody_status', 'in_security_office'
        ),
        v_resolved_at
      );

      update public.item_table
      set custody_status = 'in_security_office'::public.custody_status_enum
      where item_id = v_item_id;
    end if;

    return query select true, 'Report resolved and claim deleted successfully';
  else
    return query select true, 'Report resolved successfully';
  end if;

exception
  when others then
    return query select false, 'Error resolving fraud report: ' || SQLERRM;
end;
$$;
