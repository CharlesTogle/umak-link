-- RPC function to resolve a fraud report
-- Handles both "Yes" (delete claim) and "No" (keep claim) scenarios
create or replace function public.resolve_fraud_report (
  p_report_id uuid,
  p_delete_claim boolean default false,
  p_processed_by_staff_id uuid default null
) 
returns table (
  success boolean,
  message text
) 
language plpgsql 
security definer
as $$
declare
  v_claim_id uuid;
  v_item_id uuid;
  v_post_id integer;
  v_linked_lost_item_id uuid;
begin
  -- Get the fraud report details
  select 
    fr.claim_id,
    fr.post_id
  into 
    v_claim_id,
    v_post_id
  from fraud_reports_table fr
  where fr.report_id = p_report_id;

  -- Check if report exists
  if v_post_id is null then
    return query select false, 'Fraud report not found';
    return;
  end if;

  -- Update report status to resolved
  update fraud_reports_table
  set 
    report_status = 'resolved',
    processed_by_staff_id = p_processed_by_staff_id
  where report_id = p_report_id;

  -- Update post status back to accepted (from reported)
  update post_table
  set status = 'accepted'
  where post_id = v_post_id;

  -- If delete_claim is true, handle claim deletion and cleanup
  if p_delete_claim and v_claim_id is not null then
    -- Get item_id and linked_lost_item_id from claim
    select 
      c.item_id,
      c.linked_lost_item_id
    into 
      v_item_id,
      v_linked_lost_item_id
    from claim_table c
    where c.claim_id = v_claim_id;

    -- If there's a linked missing item, reset it to 'lost' status
    if v_linked_lost_item_id is not null then
      update item_table
      set 
        status = 'lost',
        returned_at = null,
        returned_at_local = null
      where item_id = v_linked_lost_item_id;
    end if;

    -- Update found item status back to unclaimed
    if v_item_id is not null then
      update item_table
      set status = 'unclaimed'
      where item_id = v_item_id;
    end if;

    -- Delete the claim record
    delete from claim_table
    where claim_id = v_claim_id;

    return query select true, 'Report resolved and claim deleted successfully';
  else
    -- Just resolve the report without deleting claim
    return query select true, 'Report resolved successfully';
  end if;

exception
  when others then
    return query select false, 'Error resolving fraud report: ' || SQLERRM;
end;
$$;
