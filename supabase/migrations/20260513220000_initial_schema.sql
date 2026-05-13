
-- Generated from `sql/schema-only.sql`.
-- Keeps app-owned schema objects while excluding Supabase-managed internal schemas.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS extensions;


CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;



CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;



CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;



CREATE TYPE public.fraud_report_status_enum AS ENUM (
    'under_review',
    'verified',
    'rejected',
    'resolved',
    'open'
);



CREATE TYPE public.item_status_enum AS ENUM (
    'claimed',
    'unclaimed',
    'discarded',
    'returned',
    'lost'
);



CREATE TYPE public.item_type_enum AS ENUM (
    'found',
    'lost',
    'missing'
);



CREATE TYPE public.location_level_enum AS ENUM (
    'level1',
    'level2',
    'level3'
);



CREATE TYPE public.location_type_enum AS ENUM (
    'level1',
    'level2',
    'level3'
);



CREATE TYPE public.post_status_enum AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'archived',
    'deleted',
    'reported',
    'fraud'
);



CREATE TYPE public.user_type_enum AS ENUM (
    'User',
    'Staff',
    'Admin'
);



CREATE FUNCTION public.cleanup_old_audit_logs() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM admin_action_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;



CREATE FUNCTION public.cleanup_rate_limits() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM search_rate_limit 
  WHERE window_start < NOW() - INTERVAL '1 minute';
END;
$$;



CREATE FUNCTION public.create_or_get_fraud_report(p_post_id integer, p_reason text, p_proof_image_url text DEFAULT NULL::text, p_claim_id uuid DEFAULT NULL::uuid, p_claimer_name text DEFAULT NULL::text, p_claimer_school_email text DEFAULT NULL::text, p_claimer_contact_num text DEFAULT NULL::text, p_claimed_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_claim_processed_by_staff_id uuid DEFAULT NULL::uuid, p_reported_by uuid DEFAULT NULL::uuid) RETURNS TABLE(report_id uuid, report_status public.fraud_report_status_enum)
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF p_post_id IS NULL THEN
    RAISE EXCEPTION 'post_id is required';
  END IF;

  -- Mark the post as reported
  UPDATE post_table
  SET status = 'reported'
  WHERE post_id = p_post_id;

  RETURN QUERY
  INSERT INTO public.fraud_reports_table AS fr (
    post_id,
    report_status,
    reason_for_reporting,
    proof_image_url,
    claim_id,
    claimer_name,
    claimer_school_email,
    claimer_contact_num,
    claimed_at,
    claim_processed_by_staff_id,
    reported_by
  )
  VALUES (
    p_post_id,
    'under_review',
    p_reason,
    p_proof_image_url,
    p_claim_id,
    p_claimer_name,
    p_claimer_school_email,
    p_claimer_contact_num,
    p_claimed_at,
    p_claim_processed_by_staff_id,
    p_reported_by
  )
  ON CONFLICT (
    post_id,
    (md5(coalesce(btrim(lower(reason_for_reporting)), ''))),
    (coalesce(proof_image_url, ''))
  )
  DO UPDATE
     SET report_status = 'under_review',
         claim_id = EXCLUDED.claim_id,
         claimer_name = EXCLUDED.claimer_name,
         claimer_school_email = EXCLUDED.claimer_school_email,
         claimer_contact_num = EXCLUDED.claimer_contact_num,
         claimed_at = EXCLUDED.claimed_at,
         claim_processed_by_staff_id = EXCLUDED.claim_processed_by_staff_id,
         reported_by = EXCLUDED.reported_by
  RETURNING fr.report_id, fr.report_status;
END;
$$;



CREATE FUNCTION public.create_post_with_item_date_time_location(p_poster_id uuid, p_item_name text, p_item_description text, p_item_type public.item_type_enum, p_image_link text, p_last_seen_date date, p_last_seen_hours integer, p_last_seen_minutes integer, p_location_path jsonb, p_image_hash text DEFAULT NULL::text, p_item_status public.item_status_enum DEFAULT 'unclaimed'::public.item_status_enum, p_category text DEFAULT NULL::text, p_post_status public.post_status_enum DEFAULT 'pending'::public.post_status_enum, p_is_anonymous boolean DEFAULT false) RETURNS TABLE(out_post_id integer, out_item_id uuid, out_submitted_on_date_id integer, out_last_seen_date_id integer, out_last_seen_time_id integer, out_last_seen_location_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_tmp_bool BOOLEAN;
BEGIN
  -- Validations
  IF p_poster_id IS NULL THEN RAISE EXCEPTION 'p_poster_id is required'; END IF;
  IF p_item_name IS NULL OR trim(p_item_name) = '' THEN RAISE EXCEPTION 'p_item_name is required'; END IF;
  IF p_image_hash IS NULL OR trim(p_image_hash) = '' THEN RAISE EXCEPTION 'p_image_hash is required'; END IF;
  IF p_last_seen_date IS NULL THEN RAISE EXCEPTION 'p_last_seen_date is required'; END IF;
  IF p_last_seen_hours IS NULL OR p_last_seen_minutes IS NULL THEN
    RAISE EXCEPTION 'p_last_seen_hours and p_last_seen_minutes are required';
  END IF;
  IF p_last_seen_hours < 0 OR p_last_seen_hours > 23 OR p_last_seen_minutes < 0 OR p_last_seen_minutes > 59 THEN
    RAISE EXCEPTION 'Invalid time: %:%', p_last_seen_hours, p_last_seen_minutes;
  END IF;
  IF p_location_path IS NULL OR jsonb_typeof(p_location_path) <> 'array' THEN
    RAISE EXCEPTION 'p_location_path must be a JSON array of {name,type} objects';
  END IF;

  -- 1) Item + image
  out_item_id := find_or_insert_item_with_image(
    p_item_name        => p_item_name,
    p_item_description => p_item_description,
    p_item_type        => p_item_type,
    p_image_hash       => p_image_hash,
    p_image_link       => p_image_link,
    p_status           => p_item_status,
    p_category         => COALESCE(p_category, '')
  );

  -- 2) Date lookups
  SELECT out_date_id, out_inserted
    INTO out_last_seen_date_id, v_tmp_bool
  FROM find_or_insert_date_id(p_last_seen_date);

  -- 3) Time lookup (now using INT hh/mm)
  SELECT out_time_id, out_inserted
    INTO out_last_seen_time_id, v_tmp_bool
  FROM find_or_insert_time_id(p_last_seen_hours, p_last_seen_minutes);

  -- 4) Location lookup
  SELECT find_or_insert_location_by_path(p_location_path)
  INTO out_last_seen_location_id;

  -- 5) Insert post
  INSERT INTO post_table (
    poster_id,
    status,
    item_id,
    last_seen_date_id,
    last_seen_time_id,
    last_seen_location_id,
    is_anonymous
  )
  VALUES (
    p_poster_id,
    p_post_status,
    out_item_id,
    out_last_seen_date_id,
    out_last_seen_time_id,
    out_last_seen_location_id,
    p_is_anonymous
  )
  RETURNING post_id INTO out_post_id;

  RETURN NEXT;  -- emit the single row for RETURNS TABLE
  RETURN;
END;
$$;



CREATE FUNCTION public.delete_post_by_id(p_post_id integer) RETURNS TABLE(out_post_id integer, out_deleted boolean, out_item_id uuid, out_item_deleted boolean, out_image_deleted boolean, out_image_path text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_item_id UUID;
  v_item_reference_count INT;
  v_image_id INT;
  v_image_link TEXT;
  v_image_reference_count INT;
  v_request_id BIGINT;
BEGIN
  -- Validation
  IF p_post_id IS NULL THEN
    RAISE EXCEPTION 'p_post_id is required';
  END IF;

  -- Get the item_id and image_id before deleting the post
  SELECT pt.item_id, it.image_id 
  INTO v_item_id, v_image_id
  FROM post_table pt
  LEFT JOIN item_table it ON pt.item_id = it.item_id
  WHERE pt.post_id = p_post_id;

  IF v_item_id IS NULL THEN
    -- Post doesn't exist
    out_post_id := p_post_id;
    out_deleted := false;
    out_item_id := NULL;
    out_item_deleted := false;
    out_image_deleted := false;
    out_image_path := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Get image link if image exists
  IF v_image_id IS NOT NULL THEN
    SELECT image_link INTO v_image_link
    FROM item_image_table
    WHERE item_image_id = v_image_id;
  END IF;

  -- Delete the post
  DELETE FROM post_table WHERE post_id = p_post_id;

  -- Check if the item is now orphaned (not referenced by any other post)
  SELECT COUNT(*) INTO v_item_reference_count
  FROM post_table
  WHERE item_id = v_item_id;

  -- If no other posts reference this item, delete it and check image
  out_item_deleted := false;
  out_image_deleted := false;
  out_image_path := NULL;
  
  IF v_item_reference_count = 0 THEN
    -- Delete the item
    DELETE FROM item_table WHERE item_id = v_item_id;
    out_item_deleted := true;

    -- If item had an image, check if it's orphaned
    IF v_image_id IS NOT NULL THEN
      -- Check if any other items reference this image
      SELECT COUNT(*) INTO v_image_reference_count
      FROM item_table
      WHERE image_id = v_image_id;

      -- If no other items reference this image, delete it from storage and table
      IF v_image_reference_count = 0 AND v_image_link IS NOT NULL THEN
        -- Call edge function to delete from Supabase storage using pg_net
        BEGIN
          SELECT net.http_post(
            url := 'https://uhpcewmjeigrddvauzce.supabase.co/functions/v1/delete-item-in-bucket',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocGNld21qZWlncmRkdmF1emNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDExMTM0NSwiZXhwIjoyMDc1Njg3MzQ1fQ.jhZAM9_BNLk2Z8Y60QIEzmgGPqJIRhniWcO-UAR7O1s'
            ),
            body := jsonb_build_object('imageLink', v_image_link)
          ) INTO v_request_id;

          -- Mark as deleted (pg_net is async, so we can't check the response immediately)
          out_image_deleted := true;
          out_image_path := v_image_link;
        EXCEPTION
          WHEN OTHERS THEN
            -- Log error but continue with database cleanup
            RAISE WARNING 'Error calling edge function for image deletion: %', SQLERRM;
        END;

        -- Delete from item_image_table regardless of storage deletion result
        DELETE FROM item_image_table WHERE item_image_id = v_image_id;
      END IF;
    END IF;
  END IF;

  -- Set output values
  out_post_id := p_post_id;
  out_deleted := true;
  out_item_id := v_item_id;

  RETURN NEXT;
  RETURN;
END;
$$;



CREATE FUNCTION public.edit_post_with_item_date_time_location(p_post_id integer, p_item_name text, p_item_description text, p_item_type public.item_type_enum, p_image_link text, p_last_seen_date date, p_last_seen_hours integer, p_last_seen_minutes integer, p_location_path jsonb, p_image_hash text DEFAULT NULL::text, p_item_status public.item_status_enum DEFAULT 'unclaimed'::public.item_status_enum, p_category text DEFAULT NULL::text, p_post_status public.post_status_enum DEFAULT 'pending'::public.post_status_enum, p_is_anonymous boolean DEFAULT false) RETURNS TABLE(out_post_id integer, out_item_id uuid, out_old_item_id uuid, out_last_seen_date_id integer, out_last_seen_time_id integer, out_last_seen_location_id integer, out_item_reused boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_tmp_bool BOOLEAN;
  v_old_item_id UUID;
  v_new_item_id UUID;
  v_item_reference_count INT;
BEGIN
  -- Validations
  IF p_post_id IS NULL THEN RAISE EXCEPTION 'p_post_id is required'; END IF;
  IF p_item_name IS NULL OR trim(p_item_name) = '' THEN RAISE EXCEPTION 'p_item_name is required'; END IF;
  IF p_last_seen_date IS NULL THEN RAISE EXCEPTION 'p_last_seen_date is required'; END IF;
  IF p_last_seen_hours IS NULL OR p_last_seen_minutes IS NULL THEN
    RAISE EXCEPTION 'p_last_seen_hours and p_last_seen_minutes are required';
  END IF;
  IF p_last_seen_hours < 0 OR p_last_seen_hours > 23 OR p_last_seen_minutes < 0 OR p_last_seen_minutes > 59 THEN
    RAISE EXCEPTION 'Invalid time: %:%', p_last_seen_hours, p_last_seen_minutes;
  END IF;
  IF p_location_path IS NULL OR jsonb_typeof(p_location_path) <> 'array' THEN
    RAISE EXCEPTION 'p_location_path must be a JSON array of {name,type} objects';
  END IF;

  -- Get the current item_id for this post
  SELECT item_id INTO v_old_item_id
  FROM post_table
  WHERE post_id = p_post_id;

  IF v_old_item_id IS NULL THEN
    RAISE EXCEPTION 'Post with id % does not exist', p_post_id;
  END IF;

  -- 1) Find or insert item with image (this handles deduplication)
  v_new_item_id := find_or_insert_item_with_image(
    p_item_name        => p_item_name,
    p_item_description => p_item_description,
    p_item_type        => p_item_type,
    p_image_hash       => p_image_hash,
    p_image_link       => p_image_link,
    p_status           => p_item_status,
    p_category         => COALESCE(p_category, '')
  );

  -- Check if we're reusing an existing item or creating/updating
  out_item_reused := (v_new_item_id != v_old_item_id);

  -- 2) Date lookups
  SELECT out_date_id, out_inserted
    INTO out_last_seen_date_id, v_tmp_bool
  FROM find_or_insert_date_id(p_last_seen_date);

  -- 3) Time lookup (using INT hh/mm)
  SELECT out_time_id, out_inserted
    INTO out_last_seen_time_id, v_tmp_bool
  FROM find_or_insert_time_id(p_last_seen_hours, p_last_seen_minutes);

  -- 4) Location lookup
  SELECT find_or_insert_location_by_path(p_location_path)
  INTO out_last_seen_location_id;

  -- 5) Update the post
  UPDATE post_table
  SET
    status = p_post_status,
    item_id = v_new_item_id,
    last_seen_date_id = out_last_seen_date_id,
    last_seen_time_id = out_last_seen_time_id,
    last_seen_location_id = out_last_seen_location_id,
    is_anonymous = p_is_anonymous
    WHERE post_id = p_post_id;

  -- 6) Cleanup: If old item is no longer referenced by any post, delete it
  IF v_old_item_id != v_new_item_id THEN
    SELECT COUNT(*) INTO v_item_reference_count
    FROM post_table
    WHERE item_id = v_old_item_id;

    IF v_item_reference_count = 0 THEN
      -- Delete the orphaned item (cascade will handle image_table if needed)
      DELETE FROM item_table WHERE item_id = v_old_item_id;
    END IF;
  END IF;

  -- Set output values
  out_post_id := p_post_id;
  out_item_id := v_new_item_id;
  out_old_item_id := v_old_item_id;

  RETURN NEXT;
  RETURN;
END;
$$;



CREATE FUNCTION public.find_or_insert_date_id(p_date date, OUT out_date_id integer, OUT out_inserted boolean) RETURNS record
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_dow TEXT;
  v_month_name TEXT;
  v_quarter TEXT;
  v_week_number INT;
BEGIN
  SELECT dl.date_id INTO out_date_id
  FROM date_lookup dl
  WHERE dl."date" = p_date;

  IF out_date_id IS NOT NULL THEN
    out_inserted := FALSE;
    RETURN;  -- returns the single row with OUT params
  END IF;

  v_dow := to_char(p_date, 'Day');
  v_month_name := to_char(p_date, 'Month');
  v_quarter := 'Q' || to_char(p_date, 'Q');
  v_week_number := CAST(to_char(p_date, 'IW') AS INT);

  INSERT INTO date_lookup ("date","year","quarter","month","month_name","week_number","day_of_week","is_weekend")
  VALUES (
    p_date,
    EXTRACT(YEAR FROM p_date)::INT,
    v_quarter,
    EXTRACT(MONTH FROM p_date)::INT,
    trim(v_month_name),
    v_week_number,
    trim(v_dow),
    (EXTRACT(DOW FROM p_date) IN (0,6))
  )
  ON CONFLICT ("date") DO NOTHING
  RETURNING date_id INTO out_date_id;

  IF out_date_id IS NULL THEN
    SELECT dl.date_id INTO out_date_id
    FROM date_lookup dl
    WHERE dl."date" = p_date;
    out_inserted := FALSE;
  ELSE
    out_inserted := TRUE;
  END IF;

  RETURN; 
END;
$$;



CREATE FUNCTION public.find_or_insert_item_with_image(p_item_name text, p_item_description text, p_item_type public.item_type_enum, p_image_link text, p_image_hash text DEFAULT NULL::text, p_status public.item_status_enum DEFAULT 'unclaimed'::public.item_status_enum, p_category text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_image_id  INT;
  v_item_id   UUID;
  v_link      TEXT;
  v_category  TEXT := COALESCE(p_category, '');
BEGIN
  IF p_item_name IS NULL OR trim(p_item_name) = '' THEN
    RAISE EXCEPTION 'p_item_name is required';
  END IF;

  -- Upsert image by image_hash
IF p_image_link IS NOT NULL THEN
  INSERT INTO item_image_table (image_hash, image_link)
  VALUES (p_image_hash, p_image_link)
  RETURNING item_image_id, image_link
  INTO v_image_id, v_link;
END IF;

  -- Try existing item by (lower(name), image_id, type)
  SELECT item_id
    INTO v_item_id
  FROM item_table
  WHERE lower(item_name) = lower(p_item_name)
    AND image_id = v_image_id
    AND type = p_item_type
  LIMIT 1;

  -- Insert if not found
  IF v_item_id IS NULL THEN
    INSERT INTO item_table (
      item_id,
      item_name,
      item_description,
      image_id,
      status,
      type,
      category
    )
    VALUES (
      gen_random_uuid(),
      p_item_name,
      p_item_description,
      v_image_id,
      p_status,
      p_item_type,
      v_category
    )
    RETURNING item_id INTO v_item_id;
  END IF;

  RETURN v_item_id;
END;
$$;



CREATE FUNCTION public.find_or_insert_location_by_path(p_nodes jsonb) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_parent_id INT;
  v_current_id INT;
  v_full_name TEXT := '';
  v_idx INT := 0;
  v_count INT := COALESCE(jsonb_array_length(p_nodes), 0);
  v_name TEXT;
  v_type_enum location_level_enum;
  v_best_id INT := NULL;
  v_best_depth INT := 0;
  v_depth INT;
BEGIN
  IF v_count = 0 THEN
    RAISE EXCEPTION 'p_nodes must be a non-empty JSON array of {name,type} objects';
  END IF;

  v_parent_id := NULL;

  WHILE v_idx < v_count LOOP
    v_name := trim((p_nodes->v_idx->>'name'));
    v_type_enum := to_location_level(p_nodes->v_idx->>'type');

    IF v_name IS NULL OR v_name = '' THEN
      RAISE EXCEPTION 'Location name at index % is empty', v_idx;
    END IF;

    v_full_name := CASE WHEN v_full_name = '' THEN v_name ELSE v_full_name || ' > ' || v_name END;

    SELECT location_id
      INTO v_current_id
    FROM location_lookup
    WHERE full_location_name = v_full_name;

    IF v_current_id IS NULL THEN
      INSERT INTO location_lookup (parent_location_id, location_name, location_level, full_location_name)
      VALUES (v_parent_id, v_name, v_type_enum, v_full_name)
      ON CONFLICT (full_location_name) DO UPDATE
        SET location_name = EXCLUDED.location_name,
            location_level = EXCLUDED.location_level
      RETURNING location_id INTO v_current_id;
    END IF;

    -- Track deepest; if same depth appears later, prefer the later node
    v_depth := CASE v_type_enum WHEN 'level1' THEN 1 WHEN 'level2' THEN 2 ELSE 3 END;
    IF v_depth >= v_best_depth THEN
      v_best_depth := v_depth;
      v_best_id := v_current_id;
    END IF;

    v_parent_id := v_current_id;
    v_idx := v_idx + 1;
  END LOOP;

  IF v_best_id IS NULL THEN
    RAISE EXCEPTION 'No valid location nodes could be resolved';
  END IF;

  RETURN v_best_id;
END;
$$;



CREATE FUNCTION public.find_or_insert_time_id(p_hours integer, p_minutes integer) RETURNS TABLE(out_time_id integer, out_inserted boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF p_hours < 0 OR p_hours > 23 OR p_minutes < 0 OR p_minutes > 59 THEN
    RAISE EXCEPTION 'Invalid time: %:%', p_hours, p_minutes;
  END IF;

  -- Try existing
  SELECT tl.time_id
    INTO out_time_id
  FROM time_lookup tl
  WHERE tl.hours = p_hours
    AND tl.minutes = p_minutes;

  IF out_time_id IS NOT NULL THEN
    out_inserted := FALSE;
    RETURN NEXT;  -- emit the single row
    RETURN;       -- end the function
  END IF;

  -- Insert or fetch on conflict
  INSERT INTO time_lookup (hours, minutes)
  VALUES (p_hours, p_minutes)
  ON CONFLICT (hours, minutes) DO NOTHING
  RETURNING time_id INTO out_time_id;

  IF out_time_id IS NULL THEN
    SELECT tl.time_id
      INTO out_time_id
    FROM time_lookup tl
    WHERE tl.hours = p_hours
      AND tl.minutes = p_minutes;
    out_inserted := FALSE;
  ELSE
    out_inserted := TRUE;
  END IF;

  RETURN NEXT;    -- emit the row
  RETURN;
END;
$$;



CREATE FUNCTION public.fn_set_audit_local_time() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.timestamp_local := (NOW() AT TIME ZONE 'Asia/Manila');
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.get_dashboard_stats(date_range text DEFAULT 'all'::text) RETURNS TABLE(pending_verifications integer, pending_fraud_reports integer, claimed_count integer, unclaimed_count integer, to_review_count integer, lost_count integer, returned_count integer, reported_count integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  WITH
    date_filter AS (
      SELECT
        CASE date_range
          WHEN 'today' THEN CURRENT_DATE
          WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
          WHEN 'month' THEN CURRENT_DATE - INTERVAL '1 month'
          WHEN 'year' THEN CURRENT_DATE - INTERVAL '1 year'
          ELSE NULL  -- 'all' or any other value = no filter
        END AS start_date
    ),

    post_counts AS (
      SELECT
        COUNT(*) FILTER (WHERE post_status = 'pending')  AS pending_count
      FROM v_post_records_details
      WHERE ((SELECT start_date FROM date_filter) IS NULL 
             OR submitted_on_date_local >= (SELECT start_date FROM date_filter))
    ),

    item_counts AS (
      SELECT
        -- For claimed items: use the EARLIER of submission or claim date
        -- This ensures items are counted if they were in the system during the date range
        COUNT(*) FILTER (
          WHERE item_status = 'claimed' 
          AND ((SELECT start_date FROM date_filter) IS NULL 
               OR submitted_on_date_local >= (SELECT start_date FROM date_filter))
        ) AS claimed_count,
        
        COUNT(*) FILTER (
          WHERE item_status = 'unclaimed'
          AND ((SELECT start_date FROM date_filter) IS NULL 
               OR submitted_on_date_local >= (SELECT start_date FROM date_filter))
        ) AS unclaimed_count,
        
        COUNT(*) FILTER (
          WHERE item_status = 'lost'
          AND ((SELECT start_date FROM date_filter) IS NULL 
               OR submitted_on_date_local >= (SELECT start_date FROM date_filter))
        ) AS lost_count,
        
        -- For returned items: use submission date for consistency
        COUNT(*) FILTER (
          WHERE item_status = 'returned'
          AND ((SELECT start_date FROM date_filter) IS NULL 
               OR submitted_on_date_local >= (SELECT start_date FROM date_filter))
        ) AS returned_count
      FROM v_post_records_details
    ),

    fraud_counts AS (
      SELECT
        COUNT(*) FILTER (WHERE report_status = 'under_review') AS pending_fraud_reports
      FROM fraud_reports_table
      WHERE ((SELECT start_date FROM date_filter) IS NULL 
             OR date_reported >= (SELECT start_date FROM date_filter))
    )

  SELECT
    post_counts.pending_count      AS pending_verifications,
    fraud_counts.pending_fraud_reports,
    item_counts.claimed_count,
    item_counts.unclaimed_count,
    post_counts.pending_count      AS to_review_count,
    item_counts.lost_count,
    item_counts.returned_count,
    fraud_counts.pending_fraud_reports AS reported_count
  FROM
    post_counts, item_counts, fraud_counts;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;


CREATE TABLE public.claim_table (
    claim_id uuid NOT NULL,
    item_id uuid,
    claimer_name text,
    claimer_school_email text,
    claimer_contact_num text,
    processed_by_staff_id uuid,
    claimed_at timestamp with time zone DEFAULT now(),
    linked_lost_item_id uuid
);

ALTER TABLE ONLY public.claim_table FORCE ROW LEVEL SECURITY;



CREATE TABLE public.date_lookup (
    date_id integer NOT NULL,
    date date NOT NULL,
    year integer,
    quarter text,
    month integer,
    month_name text,
    week_number integer,
    day_of_week text,
    is_weekend boolean
);



CREATE TABLE public.fraud_reports_table (
    report_id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id integer NOT NULL,
    report_status public.fraud_report_status_enum DEFAULT 'under_review'::public.fraud_report_status_enum NOT NULL,
    reason_for_reporting text,
    date_reported timestamp with time zone DEFAULT now() NOT NULL,
    proof_image_url text,
    reported_by uuid,
    processed_by_staff_id uuid,
    claimer_name text,
    claimer_school_email text,
    claimer_contact_num text,
    claimed_at timestamp with time zone,
    claim_processed_by_staff_id uuid,
    claim_id uuid
);

ALTER TABLE ONLY public.fraud_reports_table FORCE ROW LEVEL SECURITY;



COMMENT ON COLUMN public.fraud_reports_table.processed_by_staff_id IS 'Staff who processed the report';



CREATE TABLE public.item_image_table (
    item_image_id integer NOT NULL,
    image_hash text,
    image_link text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.item_image_table FORCE ROW LEVEL SECURITY;



CREATE TABLE public.item_table (
    item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_name text,
    item_description text,
    image_id integer,
    status public.item_status_enum DEFAULT 'unclaimed'::public.item_status_enum,
    type public.item_type_enum,
    created_at timestamp with time zone DEFAULT now(),
    category text,
    item_metadata jsonb,
    search_vector tsvector GENERATED ALWAYS AS ((((((((setweight(to_tsvector('english'::regconfig, COALESCE(item_name, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(item_description, ''::text)), 'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE((item_metadata ->> 'caption'::text), ''::text)), 'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(((item_metadata -> 'main_objects'::text))::text, '[]'::text)), 'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(((item_metadata -> 'synonyms'::text))::text, '[]'::text)), 'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(category, ''::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(((item_metadata -> 'descriptive_words'::text))::text, '[]'::text)), 'B'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(((item_metadata -> 'potential_brands'::text))::text, '[]'::text)), 'B'::"char"))) STORED,
    returned_at_local timestamp without time zone
);

ALTER TABLE ONLY public.item_table FORCE ROW LEVEL SECURITY;



CREATE TABLE public.location_lookup (
    location_id integer NOT NULL,
    parent_location_id integer,
    location_name text,
    full_location_name text,
    location_level public.location_level_enum
);



CREATE TABLE public.post_table (
    post_id integer NOT NULL,
    poster_id uuid,
    status public.post_status_enum DEFAULT 'pending'::public.post_status_enum,
    item_id uuid,
    accepted_by_staff_id uuid,
    submitted_on_date_id integer,
    last_seen_date_id integer,
    last_seen_time_id integer,
    last_seen_location_id integer,
    is_anonymous boolean DEFAULT false NOT NULL,
    submitted_on_date timestamp with time zone DEFAULT now() NOT NULL,
    submitted_on_date_local timestamp without time zone NOT NULL,
    accepted_on_date timestamp with time zone DEFAULT now(),
    accepted_on_date_local timestamp without time zone,
    rejection_reason text
);

ALTER TABLE ONLY public.post_table FORCE ROW LEVEL SECURITY;



CREATE TABLE public.time_lookup (
    time_id integer NOT NULL,
    hours integer,
    minutes integer
);



CREATE TABLE public.user_table (
    user_id uuid NOT NULL,
    user_name text,
    email text,
    profile_picture_url text,
    user_type public.user_type_enum DEFAULT 'User'::public.user_type_enum,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone,
    notification_token text
);

ALTER TABLE ONLY public.user_table FORCE ROW LEVEL SECURITY;



CREATE VIEW public.fraud_reports_public_v WITH (security_invoker='on') AS
 SELECT fr.report_id,
    fr.post_id,
    fr.report_status,
    fr.reason_for_reporting,
    fr.date_reported,
    fr.proof_image_url,
    fr.claim_id,
    ct.linked_lost_item_id,
    p.poster_id,
    p.status AS post_status,
    p.item_id,
    p.is_anonymous,
    p.submitted_on_date_local,
    p.accepted_on_date_local,
    dl.date AS last_seen_date,
    make_time(COALESCE(tl.hours, 0), COALESCE(tl.minutes, 0), (0)::double precision) AS last_seen_time,
        CASE
            WHEN ((dl.date IS NOT NULL) AND ((tl.hours IS NOT NULL) OR (tl.minutes IS NOT NULL))) THEN ((dl.date)::timestamp without time zone + make_interval(hours => COALESCE(tl.hours, 0), mins => COALESCE(tl.minutes, 0)))
            WHEN (dl.date IS NOT NULL) THEN (dl.date)::timestamp without time zone
            ELSE NULL::timestamp without time zone
        END AS last_seen_at,
    ll.full_location_name AS last_seen_location,
    i.item_name,
    i.item_description,
    i.image_id,
    iim.image_link AS item_image_url,
    i.status AS item_status,
    i.type AS item_type,
    i.category,
    fr.claimer_name,
    fr.claimer_school_email,
    fr.claimer_contact_num,
    fr.claimed_at,
    uc.user_name AS claim_processed_by_name,
    uc.email AS claim_processed_by_email,
    ur.user_id AS reporter_id,
    ur.user_name AS reporter_name,
    ur.email AS reporter_email,
    ur.profile_picture_url AS reporter_profile_picture_url,
    up.user_name AS poster_name,
    up.email AS poster_email,
    up.profile_picture_url AS poster_profile_picture_url,
    uf.user_id AS fraud_reviewer_id,
    uf.user_name AS fraud_reviewer_name,
    uf.email AS fraud_reviewer_email
   FROM (((((((((((public.fraud_reports_table fr
     JOIN public.post_table p ON ((p.post_id = fr.post_id)))
     LEFT JOIN public.claim_table ct ON ((ct.claim_id = fr.claim_id)))
     LEFT JOIN public.item_table i ON ((i.item_id = p.item_id)))
     LEFT JOIN public.item_image_table iim ON ((iim.item_image_id = i.image_id)))
     LEFT JOIN public.date_lookup dl ON ((dl.date_id = p.last_seen_date_id)))
     LEFT JOIN public.time_lookup tl ON ((tl.time_id = p.last_seen_time_id)))
     LEFT JOIN public.location_lookup ll ON ((ll.location_id = p.last_seen_location_id)))
     LEFT JOIN public.user_table uc ON ((uc.user_id = fr.claim_processed_by_staff_id)))
     LEFT JOIN public.user_table up ON ((up.user_id = p.poster_id)))
     LEFT JOIN public.user_table ur ON ((ur.user_id = fr.reported_by)))
     LEFT JOIN public.user_table uf ON ((uf.user_id = fr.processed_by_staff_id)));



CREATE FUNCTION public.get_fraud_reports(p_limit integer, p_to_include uuid[]) RETURNS SETOF public.fraud_reports_public_v
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM fraud_reports_public_v
  WHERE report_id = ANY(p_to_include)
  ORDER BY
    CASE report_status
      WHEN 'under_review' THEN 1
      WHEN 'open'         THEN 2
      WHEN 'resolved'     THEN 3
      WHEN 'rejected'     THEN 4
      ELSE 99
    END
  LIMIT p_limit;
END;
$$;



CREATE FUNCTION public.insert_audit_log(p_user_id uuid, p_action_type text, p_details jsonb DEFAULT NULL::jsonb) RETURNS TABLE(log_id uuid, user_id uuid, action_type text, details jsonb, timestamp_utc timestamp with time zone, timestamp_local timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.audit_table (
    log_id,
    user_id,
    action_type,
    details,
    "timestamp"
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    p_action_type,
    p_details,
    NOW()
  )
  RETURNING
    audit_table.log_id,
    audit_table.user_id,
    audit_table.action_type,
    audit_table.details,
    audit_table."timestamp",
    audit_table.timestamp_local
  INTO
    log_id, user_id, action_type, details, timestamp_utc, timestamp_local;
END;
$$;



CREATE FUNCTION public.insert_audit_log(p_user_id uuid, p_action_type text, p_target_entity_type text, p_target_entity_id text, p_details jsonb DEFAULT NULL::jsonb) RETURNS TABLE(log_id uuid, user_id uuid, action_type text, target_entity_type text, target_entity_id text, details jsonb, timestamp_utc timestamp with time zone, timestamp_local timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.audit_table (
    log_id,
    user_id,
    action_type,
    target_entity_type,
    target_entity_id,
    details,
    "timestamp"
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    p_action_type,
    p_target_entity_type,
    p_target_entity_id,
    p_details,
    NOW()
  )
  RETURNING
    audit_table.log_id,
    audit_table.user_id,
    audit_table.action_type,
    audit_table.target_entity_type,
    audit_table.target_entity_id,
    audit_table.details,
    audit_table."timestamp",
    audit_table.timestamp_local
  INTO
    log_id, user_id, action_type, target_entity_type, target_entity_id, details, timestamp_utc, timestamp_local;
END;
$$;



CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_table u
    WHERE u.user_id = auth.uid()
      AND u.user_type = 'Admin'
  );
$$;



CREATE FUNCTION public.is_staff() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_table u
    WHERE u.user_id = auth.uid()
      AND u.user_type = 'Staff'
  );
$$;



CREATE FUNCTION public.is_staff_or_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.is_staff() OR public.is_admin();
$$;



CREATE FUNCTION public.post_accepted_on_local_fill() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.accepted_on_date IS NULL THEN
    NEW.accepted_on_date := now();
  END IF;
  NEW.accepted_on_date_local := (NEW.accepted_on_date AT TIME ZONE 'Asia/Manila');
  RETURN NEW;
END $$;



CREATE FUNCTION public.post_submitted_on_local_fill() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.submitted_on_date := COALESCE(NEW.submitted_on_date, now());
  NEW.submitted_on_date_local := (NEW.submitted_on_date AT TIME ZONE 'Asia/Manila');
  RETURN NEW;
END $$;



CREATE FUNCTION public.process_claim(found_post_id integer, claim_details jsonb, missing_post_id integer DEFAULT NULL::integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_claim_id uuid := gen_random_uuid();
  v_log_id uuid := gen_random_uuid();

  v_staff_id uuid;
  v_timestamp_local timestamp without time zone := (now() at time zone 'Asia/Manila');

  v_claimed_item_id uuid;
  v_returned_item_id uuid;

  v_claimed_item_name text;
  v_returned_item_name text;

  v_poster_name text;
  v_staff_name text;
  v_claimer_name text;
begin
  -- extract actor data
  v_staff_id := claim_details->>'staff_id';
  v_claimer_name := claim_details->>'claimer_name';
  v_poster_name := claim_details->>'poster_name';
  v_staff_name := claim_details->>'staff_name';

  -- fetch item IDs from post_table
  select item_id into v_claimed_item_id
  from post_table where post_id = found_post_id;

  if missing_post_id is not null then
    select item_id into v_returned_item_id
    from post_table where post_id = missing_post_id;
  end if;

  -- fetch item names
  select item_name into v_claimed_item_name
  from item_table where item_id = v_claimed_item_id;

  if v_returned_item_id is not null then
    select item_name into v_returned_item_name
    from item_table where item_id = v_returned_item_id;
  end if;

  -- insert to claim_table
  insert into claim_table(
    claim_id, item_id, claimer_name, claimer_school_email,
    claimer_contact_num, processed_by_staff_id, claimed_at
  )
  values(
    v_claim_id,
    v_claimed_item_id,
    claim_details->>'claimer_name',
    claim_details->>'claimer_school_email',
    claim_details->>'claimer_contact_num',
    v_staff_id,
    now()
  );

  -- update item_table status for claimed item
  update item_table
  set status = 'claimed'
  where item_id = v_claimed_item_id;

  -- update item_table status for returned item (if applicable)
  if v_returned_item_id is not null then
    update item_table
    set status = 'returned'
    where item_id = v_returned_item_id;
  end if;

  -- audit log
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



CREATE FUNCTION public.resolve_fraud_report(p_report_id uuid, p_delete_claim boolean DEFAULT false, p_processed_by_staff_id uuid DEFAULT NULL::uuid) RETURNS TABLE(success boolean, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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



CREATE FUNCTION public.search_items_fts(search_term text, limit_count integer DEFAULT 10, p_date date DEFAULT NULL::date, p_category text[] DEFAULT NULL::text[], p_location_last_seen text DEFAULT NULL::text, p_claim_from date DEFAULT NULL::date, p_claim_to date DEFAULT NULL::date, p_item_status text[] DEFAULT NULL::text[], p_limit integer DEFAULT 10, p_sort text DEFAULT 'submission_date'::text, p_sort_direction text DEFAULT 'desc'::text) RETURNS TABLE(post_id integer, item_id uuid, item_name text, item_description text, category text, post_status text, item_status text, last_seen_location text, last_seen_at timestamp without time zone, claimed_at timestamp without time zone, submission_date timestamp without time zone, rank real)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    v.post_id,
    v.item_id,
    v.item_name,
    v.item_description,
    v.category,
    v.post_status,
    v.item_status,
    v.last_seen_location,
    v.last_seen_at,
    v.claimed_at,
    v.submission_date,
    CASE 
      WHEN search_term IS NOT NULL THEN ts_rank_cd(v.search_vector, websearch_to_tsquery('english', search_term))
      ELSE 0
    END AS rank
  FROM
    public.searchable_posts_view v
  WHERE
    (
      search_term IS NULL
      OR v.search_vector @@ websearch_to_tsquery('english', search_term)
    )
    AND (
      p_date IS NULL
      OR v.last_seen_at::date BETWEEN p_date - INTERVAL '5 days' AND p_date + INTERVAL '5 days'
    )
    AND (
      p_category IS NULL
      OR v.category = ANY(p_category)
    )
    AND (
      p_location_last_seen IS NULL
      OR v.last_seen_location ILIKE p_location_last_seen || '%'
    )
    AND (
      p_item_status IS NULL
      OR v.item_status = ANY(p_item_status::item_status_enum[])
    )
    AND (
      p_claim_from IS NULL
      OR v.claimed_at::date >= p_claim_from
    )
    AND (
      p_claim_to IS NULL
      OR v.claimed_at::date <= p_claim_to
    )
  ORDER BY
    CASE 
      WHEN p_sort = 'submission_date' AND p_sort_direction = 'asc' THEN v.submission_date
    END ASC,
    CASE 
      WHEN p_sort = 'submission_date' AND p_sort_direction = 'desc' THEN v.submission_date
    END DESC,
    rank DESC
  LIMIT p_limit;
$$;



CREATE FUNCTION public.search_items_fts_staff(search_term text, limit_count integer DEFAULT 10, p_date date DEFAULT NULL::date, p_category text[] DEFAULT NULL::text[], p_location_last_seen text DEFAULT NULL::text, p_claim_from date DEFAULT NULL::date, p_claim_to date DEFAULT NULL::date, p_item_status text[] DEFAULT NULL::text[], p_limit integer DEFAULT 10, p_sort text DEFAULT 'accepted_on_date'::text, p_sort_direction text DEFAULT 'desc'::text) RETURNS TABLE(post_id integer, item_id uuid, item_name text, item_description text, category text, post_status text, item_status text, last_seen_location text, last_seen_at timestamp without time zone, claimed_at timestamp without time zone, accepted_on_date timestamp without time zone, rank real)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    v.post_id,
    v.item_id,
    v.item_name,
    v.item_description,
    v.category,
    v.post_status,
    v.item_status,
    v.last_seen_location,
    v.last_seen_at,
    v.claimed_at,
    v.accepted_on_date,
    CASE 
      WHEN search_term IS NOT NULL THEN ts_rank_cd(v.search_vector, websearch_to_tsquery('english', search_term))
      ELSE 0
    END AS rank
  FROM
    public.searchable_posts_view_staff v
  WHERE
    (
      search_term IS NULL
      OR v.search_vector @@ websearch_to_tsquery('english', search_term)
    )
    AND (
      p_date IS NULL
      OR v.last_seen_at::date BETWEEN p_date - INTERVAL '5 days'
                                 AND p_date + INTERVAL '5 days'
    )
    AND (
      p_category IS NULL
      OR v.category = ANY(p_category)
    )
    AND (
      p_location_last_seen IS NULL
      OR v.last_seen_location ILIKE p_location_last_seen || '%'
    )
    AND (
      p_item_status IS NULL
      OR v.item_status = ANY(p_item_status::item_status_enum[])
    )
    AND (
      p_claim_from IS NULL
      OR v.claimed_at::date >= p_claim_from
    )
    AND (
      p_claim_to IS NULL
      OR v.claimed_at::date <= p_claim_to
    )
  ORDER BY
    CASE 
      WHEN p_sort = 'accepted_on_date' AND p_sort_direction = 'asc' THEN v.accepted_on_date
    END ASC,
    CASE 
      WHEN p_sort = 'accepted_on_date' AND p_sort_direction = 'desc' THEN v.accepted_on_date
    END DESC,
    CASE 
      WHEN p_sort = 'submission_date' AND p_sort_direction = 'asc' THEN v.submit_date
    END ASC,
    CASE 
      WHEN p_sort = 'submission_date' AND p_sort_direction = 'desc' THEN v.submit_date
    END DESC,
    rank DESC
  LIMIT p_limit;
$$;



CREATE FUNCTION public.search_users_secure(search_query text, search_limit integer DEFAULT 10) RETURNS TABLE(out_user_id uuid, out_user_name text, out_email text, out_profile_picture_url text, out_user_type text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  requester_type TEXT;
  current_count INTEGER;
BEGIN
  -- ⚠️ TODO: Add system lockdown check here when implemented
  -- IF is_system_locked THEN RAISE EXCEPTION 'System is in lockdown mode' USING ERRCODE = 'P0003'; END IF;

  -- Verify requester is admin
  SELECT ut.user_type INTO requester_type
  FROM user_table ut
  WHERE ut.user_id = auth.uid();

  IF requester_type IS NULL OR requester_type != 'Admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can search users'
      USING ERRCODE = 'P0001';
  END IF;

  -- Rate limiting check (100 searches per minute per admin)
  INSERT INTO search_rate_limit (user_id, search_count, window_start)
  VALUES (auth.uid(), 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    search_count = CASE
      WHEN search_rate_limit.window_start < NOW() - INTERVAL '1 minute'
      THEN 1
      ELSE search_rate_limit.search_count + 1
    END,
    window_start = CASE
      WHEN search_rate_limit.window_start < NOW() - INTERVAL '1 minute'
      THEN NOW()
      ELSE search_rate_limit.window_start
    END
  RETURNING search_rate_limit.search_count INTO current_count;

  IF current_count > 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many searches (max 100 per minute)'
      USING ERRCODE = 'P0002';
  END IF;

  -- Validate and sanitize input
  IF search_query IS NULL OR LENGTH(TRIM(search_query)) < 2 THEN
    RETURN; -- Return empty result for short queries
  END IF;

  -- Limit the search_limit parameter
  IF search_limit IS NULL OR search_limit > 50 THEN
    search_limit := 50;
  END IF;

  -- ⚠️ TODO: Log the search action using your custom audit log function
  -- PERFORM log_admin_action(
  --   'search',
  --   NULL,
  --   jsonb_build_object(
  --     'query', search_query, 
  --     'limit', search_limit,
  --     'timestamp', NOW()
  --   )
  -- );

  -- Execute search with full-text search and fuzzy matching
  RETURN QUERY
  SELECT 
    ut.user_id AS out_user_id,
    ut.user_name AS out_user_name,
    ut.email AS out_email,
    ut.profile_picture_url AS out_profile_picture_url,
    ut.user_type::TEXT AS out_user_type
  FROM user_table ut
  WHERE 
    -- Exclude already Admin/Staff users (only show regular users)
    ut.user_type = 'User'
    AND (
      -- Full-text search for better performance on large datasets
      to_tsvector('english', 
        COALESCE(ut.user_name, '') || ' ' || 
        COALESCE(ut.email, '')
      ) @@ plainto_tsquery('english', search_query)
      OR
      -- Trigram similarity for fuzzy matching (typo tolerance)
      ut.user_name ILIKE '%' || search_query || '%'
      OR
      ut.email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    -- Prioritize exact matches first
    CASE 
      WHEN LOWER(ut.email) = LOWER(search_query) THEN 1
      WHEN LOWER(ut.user_name) = LOWER(search_query) THEN 2
      WHEN LOWER(ut.email) LIKE LOWER(search_query) || '%' THEN 3
      WHEN LOWER(ut.user_name) LIKE LOWER(search_query) || '%' THEN 4
      ELSE 5
    END,
    ut.user_name ASC
  LIMIT search_limit;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE NOTICE 'Search error for admin %: %', auth.uid(), SQLERRM;
    RAISE;
END;
$$;



CREATE FUNCTION public.search_users_secure_staff(search_query text, search_limit integer DEFAULT 10) RETURNS TABLE(out_user_id uuid, out_user_name text, out_email text, out_profile_picture_url text, out_user_type text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  requester_type TEXT;
  current_count INTEGER;
BEGIN

  -- Verify requester is admin
  SELECT ut.user_type INTO requester_type
  FROM user_table ut
  WHERE ut.user_id = auth.uid();

  IF requester_type IS NULL OR requester_type != 'Staff' THEN
    RAISE EXCEPTION 'Unauthorized: Only Staff can use this'
      USING ERRCODE = 'P0001';
  END IF;

  -- Rate limiting check (100 searches per minute per admin)
  INSERT INTO search_rate_limit (user_id, search_count, window_start)
  VALUES (auth.uid(), 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    search_count = CASE
      WHEN search_rate_limit.window_start < NOW() - INTERVAL '1 minute'
      THEN 1
      ELSE search_rate_limit.search_count + 1
    END,
    window_start = CASE
      WHEN search_rate_limit.window_start < NOW() - INTERVAL '1 minute'
      THEN NOW()
      ELSE search_rate_limit.window_start
    END
  RETURNING search_rate_limit.search_count INTO current_count;

  IF current_count > 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many searches (max 100 per minute)'
      USING ERRCODE = 'P0002';
  END IF;

  -- Validate and sanitize input
  IF search_query IS NULL OR LENGTH(TRIM(search_query)) < 2 THEN
    RETURN; -- Return empty result for short queries
  END IF;

  -- Limit the search_limit parameter
  IF search_limit IS NULL OR search_limit > 50 THEN
    search_limit := 50;
  END IF;

  -- Execute search with full-text search and fuzzy matching
  RETURN QUERY
  SELECT 
    ut.user_id AS out_user_id,
    ut.user_name AS out_user_name,
    ut.email AS out_email,
    ut.profile_picture_url AS out_profile_picture_url,
    ut.user_type::TEXT AS out_user_type
  FROM user_table ut
  WHERE 
    -- Exclude already Admin/Staff users (only show regular users)
    ut.user_type = 'User'
    AND (
      -- Full-text search for better performance on large datasets
      to_tsvector('english', 
        COALESCE(ut.user_name, '') || ' ' || 
        COALESCE(ut.email, '')
      ) @@ plainto_tsquery('english', search_query)
      OR
      -- Trigram similarity for fuzzy matching (typo tolerance)
      ut.user_name ILIKE '%' || search_query || '%'
      OR
      ut.email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    -- Prioritize exact matches first
    CASE 
      WHEN LOWER(ut.email) = LOWER(search_query) THEN 1
      WHEN LOWER(ut.user_name) = LOWER(search_query) THEN 2
      WHEN LOWER(ut.email) LIKE LOWER(search_query) || '%' THEN 3
      WHEN LOWER(ut.user_name) LIKE LOWER(search_query) || '%' THEN 4
      ELSE 5
    END,
    ut.user_name ASC
  LIMIT search_limit;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE NOTICE 'Search error for admin %: %', auth.uid(), SQLERRM;
    RAISE;
END;
$$;



CREATE FUNCTION public.set_returned_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'returned' AND OLD.status IS DISTINCT FROM 'returned' THEN
    NEW.returned_at_local := (now() AT TIME ZONE 'Asia/Manila');
  END IF;
  RETURN NEW;
END;
$$;



CREATE FUNCTION public.to_location_level(p_text text) RETURNS public.location_level_enum
    LANGUAGE plpgsql
    AS $$
DECLARE v TEXT := trim(lower(p_text));
BEGIN
  IF v IS NULL OR v = '' THEN RETURN 'level3'::location_level_enum; END IF;
  IF v IN ('building','bldg','tower','hall') THEN RETURN 'level1'::location_level_enum; END IF;
  IF v IN ('floor','storey','level') THEN RETURN 'level2'::location_level_enum; END IF;
  RETURN 'level3'::location_level_enum; -- room/place/area/etc default
END;
$$;



CREATE TABLE public.audit_table (
    log_id uuid NOT NULL,
    user_id uuid,
    action_type text,
    details jsonb,
    "timestamp" timestamp with time zone DEFAULT now(),
    timestamp_local timestamp without time zone
);

ALTER TABLE ONLY public.audit_table FORCE ROW LEVEL SECURITY;



CREATE SEQUENCE public.date_lookup_date_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.date_lookup_date_id_seq OWNED BY public.date_lookup.date_id;



CREATE TABLE public.global_announcements_table (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_by uuid,
    scheduled_on timestamp with time zone,
    message text,
    failed_user_ids jsonb,
    description text,
    image_id bigint
);

ALTER TABLE ONLY public.global_announcements_table FORCE ROW LEVEL SECURITY;



CREATE TABLE public.notification_image_table (
    image_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text
);

ALTER TABLE ONLY public.notification_image_table FORCE ROW LEVEL SECURITY;



CREATE VIEW public.global_announcement_view WITH (security_invoker='on') AS
 SELECT ga.id,
    ga.created_at,
    ga.sent_by,
    ga.scheduled_on,
    ga.message,
    ga.failed_user_ids,
    ga.description,
    ga.image_id,
    ni.image_url
   FROM (public.global_announcements_table ga
     LEFT JOIN public.notification_image_table ni ON ((ga.image_id = ni.image_id)));



ALTER TABLE public.global_announcements_table ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.global_announcements_table_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE SEQUENCE public.item_image_table_item_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.item_image_table_item_image_id_seq OWNED BY public.item_image_table.item_image_id;



CREATE VIEW public.items_pending_metadata WITH (security_invoker='on') AS
 SELECT i.item_id,
    i.item_name,
    i.item_description,
    i.created_at,
    iim.image_link AS image_url,
    p.post_id,
    p.status AS post_status,
    p.accepted_on_date,
    (EXTRACT(epoch FROM (now() - COALESCE(p.accepted_on_date, i.created_at))) / (3600)::numeric) AS hours_waiting
   FROM ((public.item_table i
     JOIN public.post_table p ON ((i.item_id = p.item_id)))
     JOIN public.item_image_table iim ON ((i.image_id = iim.item_image_id)))
  WHERE ((i.item_metadata IS NULL) AND (p.status = 'accepted'::public.post_status_enum) AND (iim.image_link IS NOT NULL))
  ORDER BY COALESCE(p.accepted_on_date, i.created_at);



CREATE SEQUENCE public.location_lookup_location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.location_lookup_location_id_seq OWNED BY public.location_lookup.location_id;



ALTER TABLE public.notification_image_table ALTER COLUMN image_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notification_image_table_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE public.notification_table (
    notification_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    description text,
    sent_to uuid,
    sent_by uuid,
    is_read boolean DEFAULT false,
    type text,
    data jsonb,
    image_id bigint,
    global_announcement_id bigint,
    title text
);

ALTER TABLE ONLY public.notification_table FORCE ROW LEVEL SECURITY;



CREATE VIEW public.notification_view WITH (security_invoker='on') AS
 SELECT n.notification_id,
    n.title,
    n.created_at,
    n.description,
    n.sent_to,
    n.sent_by,
    n.is_read,
    n.type,
    n.data,
    n.image_id,
    ni.image_url
   FROM (public.notification_table n
     LEFT JOIN public.notification_image_table ni ON ((n.image_id = ni.image_id)));



CREATE TABLE public.pending_match (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    post_id integer,
    poster_id uuid,
    status text,
    is_retriable boolean,
    failed_reason text
);

ALTER TABLE ONLY public.pending_match FORCE ROW LEVEL SECURITY;



ALTER TABLE public.pending_match ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.pending_match_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE VIEW public.pending_match_v WITH (security_invoker='on') AS
 SELECT pm.id,
    pm.created_at,
    pm.post_id,
    pm.poster_id,
    pm.status,
    pm.is_retriable,
    pm.failed_reason,
    u.user_id,
    u.email,
    u.notification_token AS device_token,
    i.item_name,
    i.item_description,
    i.item_metadata,
    img.image_link
   FROM ((((public.pending_match pm
     LEFT JOIN public.post_table p ON ((p.post_id = pm.post_id)))
     LEFT JOIN public.user_table u ON ((u.user_id = pm.poster_id)))
     LEFT JOIN public.item_table i ON ((i.item_id = p.item_id)))
     LEFT JOIN public.item_image_table img ON ((img.item_image_id = i.image_id)));



CREATE VIEW public.post_public_view WITH (security_invoker='on') AS
 SELECT pt.post_id,
    u.user_name AS poster_name,
    u.user_id AS poster_id,
    u.profile_picture_url,
    it.item_id,
    it.item_name,
    it.item_description,
    it.type AS item_type,
    iim.image_link AS item_image_url,
    NULLIF(it.category, ''::text) AS category,
        CASE
            WHEN ((dl.date IS NOT NULL) AND (tl.time_id IS NOT NULL)) THEN ((dl.date)::timestamp without time zone + make_interval(hours => tl.hours, mins => tl.minutes))
            WHEN (dl.date IS NOT NULL) THEN (dl.date)::timestamp without time zone
            ELSE NULL::timestamp without time zone
        END AS last_seen_at,
    ll.full_location_name AS last_seen_location,
    staff.user_name AS accepted_by_staff_name,
    staff.email AS accepted_by_staff_email,
    pt.submitted_on_date_local AS submission_date,
    pt.status AS post_status,
    it.status AS item_status,
    pt.is_anonymous,
    cl.claim_id,
    cl.claimer_name AS claimed_by_name,
    cl.claimer_school_email AS claimed_by_email,
    cl.claimer_contact_num AS claimed_by_contact,
    cl.claimed_at,
    cl.processed_by_staff_id AS claim_processed_by_staff_id,
    pt.accepted_on_date_local AS accepted_on_date
   FROM ((((((((public.post_table pt
     JOIN public.item_table it ON ((it.item_id = pt.item_id)))
     LEFT JOIN public.item_image_table iim ON ((iim.item_image_id = it.image_id)))
     LEFT JOIN public.user_table u ON ((u.user_id = pt.poster_id)))
     LEFT JOIN public.date_lookup dl ON ((dl.date_id = pt.last_seen_date_id)))
     LEFT JOIN public.time_lookup tl ON ((tl.time_id = pt.last_seen_time_id)))
     LEFT JOIN public.location_lookup ll ON ((ll.location_id = pt.last_seen_location_id)))
     LEFT JOIN public.user_table staff ON ((staff.user_id = pt.accepted_by_staff_id)))
     LEFT JOIN public.claim_table cl ON ((cl.item_id = it.item_id)));



CREATE SEQUENCE public.post_table_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.post_table_post_id_seq OWNED BY public.post_table.post_id;



CREATE TABLE public.search_rate_limit (
    user_id uuid NOT NULL,
    search_count integer DEFAULT 0,
    window_start timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.search_rate_limit FORCE ROW LEVEL SECURITY;



CREATE VIEW public.searchable_post_view WITH (security_invoker='on') AS
 SELECT pt.post_id,
    it.item_id,
    it.item_name,
    it.item_description,
    NULLIF(it.category, ''::text) AS category,
    it.status AS item_status,
    pt.status AS post_status,
    ll.full_location_name AS last_seen_location,
        CASE
            WHEN ((dl.date IS NOT NULL) AND (tl.time_id IS NOT NULL)) THEN ((dl.date)::timestamp without time zone + make_interval(hours => tl.hours, mins => tl.minutes))
            WHEN (dl.date IS NOT NULL) THEN (dl.date)::timestamp without time zone
            ELSE NULL::timestamp without time zone
        END AS last_seen_at,
    cl.claimed_at,
    it.search_vector
   FROM (((((public.post_table pt
     JOIN public.item_table it ON ((it.item_id = pt.item_id)))
     LEFT JOIN public.date_lookup dl ON ((dl.date_id = pt.last_seen_date_id)))
     LEFT JOIN public.time_lookup tl ON ((tl.time_id = pt.last_seen_time_id)))
     LEFT JOIN public.location_lookup ll ON ((ll.location_id = pt.last_seen_location_id)))
     LEFT JOIN public.claim_table cl ON ((cl.item_id = it.item_id)));



CREATE VIEW public.searchable_posts_view WITH (security_invoker='on') AS
 SELECT pt.post_id,
    it.item_id,
    it.item_name,
    it.item_description,
    NULLIF(it.category, ''::text) AS category,
    it.status AS item_status,
    pt.status AS post_status,
    ll.full_location_name AS last_seen_location,
        CASE
            WHEN ((dl.date IS NOT NULL) AND (tl.time_id IS NOT NULL)) THEN ((dl.date)::timestamp without time zone + make_interval(hours => tl.hours, mins => tl.minutes))
            WHEN (dl.date IS NOT NULL) THEN (dl.date)::timestamp without time zone
            ELSE NULL::timestamp without time zone
        END AS last_seen_at,
    cl.claimed_at,
    pt.submitted_on_date_local AS submission_date,
    it.search_vector
   FROM (((((public.post_table pt
     JOIN public.item_table it ON ((it.item_id = pt.item_id)))
     LEFT JOIN public.date_lookup dl ON ((dl.date_id = pt.last_seen_date_id)))
     LEFT JOIN public.time_lookup tl ON ((tl.time_id = pt.last_seen_time_id)))
     LEFT JOIN public.location_lookup ll ON ((ll.location_id = pt.last_seen_location_id)))
     LEFT JOIN public.claim_table cl ON ((cl.item_id = it.item_id)))
  WHERE ((pt.status = 'accepted'::public.post_status_enum) OR (pt.status = 'reported'::public.post_status_enum));



CREATE VIEW public.searchable_posts_view_staff WITH (security_invoker='on') AS
 SELECT i.item_id,
    i.item_name,
    i.item_description,
    i.category,
    i.search_vector,
    i.status AS item_status,
    p.post_id,
    p.status AS post_status,
    p.accepted_on_date_local AS publish_date,
    p.submitted_on_date_local AS submit_date,
    p.accepted_on_date_local AS accepted_on_date,
        CASE
            WHEN ((d.date IS NOT NULL) AND (t.time_id IS NOT NULL)) THEN ((d.date)::timestamp without time zone + make_interval(hours => t.hours, mins => t.minutes))
            WHEN (d.date IS NOT NULL) THEN (d.date)::timestamp without time zone
            ELSE NULL::timestamp without time zone
        END AS last_seen_at,
    d.date AS last_seen_date,
    l.full_location_name AS last_seen_location,
    c.claimed_at
   FROM (((((public.item_table i
     JOIN public.post_table p ON ((i.item_id = p.item_id)))
     LEFT JOIN public.date_lookup d ON ((p.last_seen_date_id = d.date_id)))
     LEFT JOIN public.time_lookup t ON ((p.last_seen_time_id = t.time_id)))
     LEFT JOIN public.location_lookup l ON ((p.last_seen_location_id = l.location_id)))
     LEFT JOIN public.claim_table c ON ((c.item_id = i.item_id)));



CREATE SEQUENCE public.time_lookup_time_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.time_lookup_time_id_seq OWNED BY public.time_lookup.time_id;



CREATE VIEW public.v_post_records_details WITH (security_invoker='on') AS
 SELECT p.post_id,
    p.poster_id,
    p.status AS post_status,
    p.item_id,
    p.is_anonymous,
    p.submitted_on_date_local,
    p.accepted_on_date_local,
    p.rejection_reason,
    dl.date AS last_seen_date,
    make_time(COALESCE(tl.hours, 0), COALESCE(tl.minutes, 0), (0)::double precision) AS last_seen_time,
        CASE
            WHEN ((dl.date IS NOT NULL) AND ((tl.hours IS NOT NULL) OR (tl.minutes IS NOT NULL))) THEN ((dl.date)::timestamp without time zone + make_interval(hours => COALESCE(tl.hours, 0), mins => COALESCE(tl.minutes, 0)))
            WHEN (dl.date IS NOT NULL) THEN (dl.date)::timestamp without time zone
            ELSE NULL::timestamp without time zone
        END AS last_seen_at,
    ll.full_location_name AS last_seen_location,
    i.item_name,
    i.item_description,
    i.image_id,
    iim.image_link AS item_image_url,
    i.status AS item_status,
    i.type AS item_type,
    i.category,
    i.search_vector,
    i.returned_at_local,
    up.user_name AS poster_name,
    up.email AS poster_email,
    up.profile_picture_url AS poster_profile_picture_url,
    c.claimer_name,
    c.claimer_school_email,
    c.claimer_contact_num,
    c.claimed_at,
    c.linked_lost_item_id,
    uc.user_name AS claim_processed_by_name,
    uc.email AS claim_processed_by_email,
    uc.profile_picture_url AS claim_processed_by_profile_picture_url
   FROM ((((((((public.post_table p
     LEFT JOIN public.item_table i ON ((i.item_id = p.item_id)))
     LEFT JOIN public.item_image_table iim ON ((iim.item_image_id = i.image_id)))
     LEFT JOIN public.date_lookup dl ON ((dl.date_id = p.last_seen_date_id)))
     LEFT JOIN public.time_lookup tl ON ((tl.time_id = p.last_seen_time_id)))
     LEFT JOIN public.location_lookup ll ON ((ll.location_id = p.last_seen_location_id)))
     LEFT JOIN public.claim_table c ON ((c.item_id = i.item_id)))
     LEFT JOIN public.user_table uc ON ((uc.user_id = c.processed_by_staff_id)))
     LEFT JOIN public.user_table up ON ((up.user_id = p.poster_id)));



CREATE VIEW public.view_audit_logs_with_user_details WITH (security_invoker='on') AS
 SELECT al.log_id,
    al.user_id,
    u.user_name,
    u.email,
    u.profile_picture_url,
    al.action_type,
    al.details,
    (al."timestamp" AT TIME ZONE 'UTC'::text) AS "timestamp",
    ((al."timestamp" AT TIME ZONE 'UTC'::text) AT TIME ZONE 'Asia/Manila'::text) AS timestamp_local
   FROM (public.audit_table al
     LEFT JOIN public.user_table u ON ((al.user_id = u.user_id)))
  ORDER BY al."timestamp" DESC;



ALTER TABLE ONLY public.date_lookup ALTER COLUMN date_id SET DEFAULT nextval('public.date_lookup_date_id_seq'::regclass);



ALTER TABLE ONLY public.item_image_table ALTER COLUMN item_image_id SET DEFAULT nextval('public.item_image_table_item_image_id_seq'::regclass);



ALTER TABLE ONLY public.location_lookup ALTER COLUMN location_id SET DEFAULT nextval('public.location_lookup_location_id_seq'::regclass);



ALTER TABLE ONLY public.post_table ALTER COLUMN post_id SET DEFAULT nextval('public.post_table_post_id_seq'::regclass);



ALTER TABLE ONLY public.time_lookup ALTER COLUMN time_id SET DEFAULT nextval('public.time_lookup_time_id_seq'::regclass);



ALTER TABLE ONLY public.audit_table
    ADD CONSTRAINT audit_table_pkey PRIMARY KEY (log_id);



ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT claim_table_item_id_uniq UNIQUE (item_id);



ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT claim_table_pkey PRIMARY KEY (claim_id);



ALTER TABLE ONLY public.date_lookup
    ADD CONSTRAINT date_lookup_pkey PRIMARY KEY (date_id);



ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fraud_reports_table_pkey PRIMARY KEY (report_id);



ALTER TABLE ONLY public.global_announcements_table
    ADD CONSTRAINT global_announcements_table_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.item_image_table
    ADD CONSTRAINT item_image_table_pkey PRIMARY KEY (item_image_id);



ALTER TABLE ONLY public.item_table
    ADD CONSTRAINT item_table_pkey PRIMARY KEY (item_id);



ALTER TABLE ONLY public.location_lookup
    ADD CONSTRAINT location_lookup_pkey PRIMARY KEY (location_id);



ALTER TABLE ONLY public.notification_image_table
    ADD CONSTRAINT notification_image_table_pkey PRIMARY KEY (image_id);



ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT notification_table_pkey PRIMARY KEY (notification_id);



ALTER TABLE ONLY public.pending_match
    ADD CONSTRAINT pending_match_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT post_table_pkey PRIMARY KEY (post_id);



ALTER TABLE ONLY public.search_rate_limit
    ADD CONSTRAINT search_rate_limit_pkey PRIMARY KEY (user_id);



ALTER TABLE ONLY public.time_lookup
    ADD CONSTRAINT time_lookup_pkey PRIMARY KEY (time_id);



ALTER TABLE ONLY public.user_table
    ADD CONSTRAINT user_table_pkey PRIMARY KEY (user_id);



ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT ux_claim_item_claimid UNIQUE (item_id, claim_id);



ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT ux_post_unique_combination UNIQUE (poster_id, item_id, last_seen_time_id, last_seen_location_id, is_anonymous);



CREATE INDEX idx_audit_action_type ON public.audit_table USING btree (action_type);



CREATE INDEX idx_audit_timestamp_local ON public.audit_table USING btree (timestamp_local DESC);



CREATE INDEX idx_audit_timestamp_utc ON public.audit_table USING btree ("timestamp" DESC);



CREATE INDEX idx_audit_user_id ON public.audit_table USING btree (user_id);



CREATE INDEX idx_claim_claimer_email ON public.claim_table USING btree (claimer_school_email);



CREATE UNIQUE INDEX idx_claim_item_email_unique ON public.claim_table USING btree (item_id, claimer_school_email);



CREATE INDEX idx_claim_item_id ON public.claim_table USING btree (item_id);



CREATE UNIQUE INDEX idx_date_lookup_date_unique ON public.date_lookup USING btree (date);



CREATE INDEX idx_fraud_reports_date_reported ON public.fraud_reports_table USING btree (date_reported DESC);



CREATE INDEX idx_fraud_reports_post_id ON public.fraud_reports_table USING btree (post_id);



CREATE INDEX idx_fraud_reports_status ON public.fraud_reports_table USING btree (report_status);



CREATE UNIQUE INDEX idx_image_hash_unique ON public.item_image_table USING btree (image_hash);



CREATE INDEX idx_item_name ON public.item_table USING btree (item_name);



CREATE INDEX idx_item_search_vector ON public.item_table USING gin (search_vector);



CREATE INDEX idx_item_status ON public.item_table USING btree (status);



CREATE INDEX idx_item_type ON public.item_table USING btree (type);



CREATE UNIQUE INDEX idx_location_full_name_unique ON public.location_lookup USING btree (full_location_name);



CREATE INDEX idx_location_name ON public.location_lookup USING btree (location_name);



CREATE INDEX idx_notification_is_read ON public.notification_table USING btree (is_read);



CREATE INDEX idx_notification_sent_to ON public.notification_table USING btree (sent_to);



CREATE INDEX idx_post_accepted_on_date ON public.post_table USING btree (accepted_on_date);



CREATE INDEX idx_post_accepted_on_date_local ON public.post_table USING btree (accepted_on_date_local);



CREATE INDEX idx_post_is_anonymous ON public.post_table USING btree (is_anonymous, status);



CREATE INDEX idx_post_last_seen_location_id ON public.post_table USING btree (last_seen_location_id);



CREATE INDEX idx_post_poster_id ON public.post_table USING btree (poster_id);



CREATE INDEX idx_post_status ON public.post_table USING btree (status);



CREATE INDEX idx_post_status_accepted ON public.post_table USING btree (status, accepted_on_date) WHERE (status = 'accepted'::public.post_status_enum);



CREATE INDEX idx_post_submitted_at ON public.post_table USING btree (submitted_on_date);



CREATE INDEX idx_post_submitted_at_local ON public.post_table USING btree (submitted_on_date_local);



CREATE INDEX idx_post_submitted_on_date ON public.post_table USING btree (submitted_on_date);



CREATE INDEX idx_post_submitted_on_date_local ON public.post_table USING btree (submitted_on_date_local);



CREATE INDEX idx_rate_limit_window ON public.search_rate_limit USING btree (window_start);



CREATE UNIQUE INDEX idx_time_lookup_hours_minutes_unique ON public.time_lookup USING btree (hours, minutes);



CREATE INDEX idx_user_email_trgm ON public.user_table USING gin (email public.gin_trgm_ops);



CREATE UNIQUE INDEX idx_user_email_unique ON public.user_table USING btree (email);



CREATE INDEX idx_user_last_login ON public.user_table USING btree (last_login DESC);



CREATE INDEX idx_user_name ON public.user_table USING btree (user_name);



CREATE INDEX idx_user_name_trgm ON public.user_table USING gin (user_name public.gin_trgm_ops);



CREATE INDEX idx_user_search_fts ON public.user_table USING gin (to_tsvector('english'::regconfig, ((COALESCE(user_name, ''::text) || ' '::text) || COALESCE(email, ''::text))));



CREATE INDEX idx_user_type ON public.user_table USING btree (user_type);



CREATE INDEX idx_user_type_name ON public.user_table USING btree (user_type, user_name);



CREATE UNIQUE INDEX ux_fraud_reports_dedup ON public.fraud_reports_table USING btree (post_id, md5(COALESCE(btrim(lower(reason_for_reporting)), ''::text)), COALESCE(proof_image_url, ''::text));



CREATE UNIQUE INDEX ux_item_lookup ON public.item_table USING btree (lower(item_name), image_id, type);



CREATE TRIGGER trg_post_accepted_on_local BEFORE INSERT OR UPDATE OF accepted_on_date ON public.post_table FOR EACH ROW EXECUTE FUNCTION public.post_accepted_on_local_fill();



CREATE TRIGGER trg_post_submitted_on_local BEFORE INSERT OR UPDATE OF submitted_on_date ON public.post_table FOR EACH ROW EXECUTE FUNCTION public.post_submitted_on_local_fill();



CREATE TRIGGER trg_set_audit_local_time BEFORE INSERT ON public.audit_table FOR EACH ROW EXECUTE FUNCTION public.fn_set_audit_local_time();



CREATE TRIGGER trg_set_returned_at BEFORE UPDATE ON public.item_table FOR EACH ROW EXECUTE FUNCTION public.set_returned_at();



ALTER TABLE ONLY public.audit_table
    ADD CONSTRAINT "FK_audit_table_user_id" FOREIGN KEY (user_id) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT "FK_claim_table_processed_by_staff_id" FOREIGN KEY (processed_by_staff_id) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.item_table
    ADD CONSTRAINT "FK_item_table_image_id" FOREIGN KEY (image_id) REFERENCES public.item_image_table(item_image_id);



ALTER TABLE ONLY public.location_lookup
    ADD CONSTRAINT "FK_location_lookup_parent_location_id" FOREIGN KEY (parent_location_id) REFERENCES public.location_lookup(location_id);



ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT "FK_notification_table_sent_by" FOREIGN KEY (sent_by) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT "FK_notification_table_sent_to" FOREIGN KEY (sent_to) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_accepted_by_staff_id" FOREIGN KEY (accepted_by_staff_id) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_item_id" FOREIGN KEY (item_id) REFERENCES public.item_table(item_id);



ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_last_seen_date_id" FOREIGN KEY (last_seen_date_id) REFERENCES public.date_lookup(date_id);



ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_last_seen_location_id" FOREIGN KEY (last_seen_location_id) REFERENCES public.location_lookup(location_id);



ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_last_seen_time_id" FOREIGN KEY (last_seen_time_id) REFERENCES public.time_lookup(time_id);



ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_poster_id" FOREIGN KEY (poster_id) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT claim_table_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.item_table(item_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT claim_table_linked_lost_item_id_fkey FOREIGN KEY (linked_lost_item_id) REFERENCES public.item_table(item_id);



ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fk_fraud_reports_claim_staff FOREIGN KEY (claim_processed_by_staff_id) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fk_fraud_reports_post FOREIGN KEY (post_id) REFERENCES public.post_table(post_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fraud_reports_table_processed_by_staff_id_fkey FOREIGN KEY (processed_by_staff_id) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fraud_reports_table_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.global_announcements_table
    ADD CONSTRAINT global_announcements_table_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.notification_image_table(image_id);



ALTER TABLE ONLY public.global_announcements_table
    ADD CONSTRAINT global_announcements_table_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.user_table(user_id);



ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT notification_table_global_announcement_id_fkey FOREIGN KEY (global_announcement_id) REFERENCES public.global_announcements_table(id);



ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT notification_table_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.notification_image_table(image_id);



ALTER TABLE ONLY public.pending_match
    ADD CONSTRAINT pending_match_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post_table(post_id);



ALTER TABLE ONLY public.pending_match
    ADD CONSTRAINT pending_match_poster_id_fkey FOREIGN KEY (poster_id) REFERENCES public.user_table(user_id);



CREATE POLICY admin_insert_global_announcements ON public.global_announcements_table FOR INSERT TO authenticated WITH CHECK (public.is_admin());



CREATE POLICY admin_insert_notification_images ON public.notification_image_table FOR INSERT TO authenticated WITH CHECK (public.is_admin());



CREATE POLICY admin_insert_notifications ON public.notification_table FOR INSERT TO authenticated WITH CHECK (public.is_admin());



CREATE POLICY admin_select_all_audit_logs ON public.audit_table FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_select_all_fraud_reports ON public.fraud_reports_table FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_select_all_items ON public.item_table FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_select_all_posts ON public.post_table FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_select_all_users ON public.user_table FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_select_claims ON public.claim_table FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_select_global_announcements ON public.global_announcements_table FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_select_notification_images ON public.notification_image_table FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_select_pending_match ON public.pending_match FOR SELECT TO authenticated USING (public.is_admin());



CREATE POLICY admin_update_all_users ON public.user_table FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());



CREATE POLICY all_select_own ON public.user_table FOR SELECT TO authenticated USING (true);



CREATE POLICY any_insert_audit_logs ON public.audit_table FOR INSERT TO authenticated WITH CHECK (true);



ALTER TABLE public.audit_table ENABLE ROW LEVEL SECURITY;


CREATE POLICY authenticated_all_search_rate_limit ON public.search_rate_limit TO authenticated USING (true) WITH CHECK (true);



CREATE POLICY authenticated_insert_own_account ON public.user_table FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));



ALTER TABLE public.claim_table ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.fraud_reports_table ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.global_announcements_table ENABLE ROW LEVEL SECURITY;


CREATE POLICY item_delete_auth ON public.item_table FOR DELETE TO authenticated USING (true);



ALTER TABLE public.item_image_table ENABLE ROW LEVEL SECURITY;


CREATE POLICY item_images_delete_auth ON public.item_image_table FOR DELETE TO authenticated USING (true);



CREATE POLICY item_images_insert_auth ON public.item_image_table FOR INSERT TO authenticated WITH CHECK (true);



CREATE POLICY item_images_select_auth ON public.item_image_table FOR SELECT TO authenticated USING (true);



CREATE POLICY item_images_update_auth ON public.item_image_table FOR UPDATE TO authenticated USING (true) WITH CHECK (true);



CREATE POLICY item_insert_auth ON public.item_table FOR INSERT TO authenticated WITH CHECK (true);



CREATE POLICY item_select_auth ON public.item_table FOR SELECT TO authenticated USING (true);



ALTER TABLE public.item_table ENABLE ROW LEVEL SECURITY;


CREATE POLICY item_update_auth ON public.item_table FOR UPDATE TO authenticated USING (true) WITH CHECK (true);



ALTER TABLE public.notification_image_table ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.notification_table ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.pending_match ENABLE ROW LEVEL SECURITY;


CREATE POLICY post_delete_auth ON public.post_table FOR DELETE TO authenticated USING (true);



CREATE POLICY post_insert_auth ON public.post_table FOR INSERT TO authenticated WITH CHECK (true);



CREATE POLICY post_select_auth ON public.post_table FOR SELECT TO authenticated USING (true);



ALTER TABLE public.post_table ENABLE ROW LEVEL SECURITY;


CREATE POLICY post_update_auth ON public.post_table FOR UPDATE TO authenticated USING (true) WITH CHECK (true);



ALTER TABLE public.search_rate_limit ENABLE ROW LEVEL SECURITY;


CREATE POLICY staff_admin_select_search_rate_limit ON public.search_rate_limit FOR SELECT TO authenticated USING (public.is_staff_or_admin());



CREATE POLICY staff_admin_update_search_rate_limit ON public.search_rate_limit FOR UPDATE TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());



CREATE POLICY staff_delete_all_posts ON public.post_table FOR DELETE TO authenticated USING (public.is_staff());



CREATE POLICY staff_delete_claims ON public.claim_table FOR DELETE TO authenticated USING (public.is_staff());



CREATE POLICY staff_insert_claims ON public.claim_table FOR INSERT TO authenticated WITH CHECK (public.is_staff());



CREATE POLICY staff_insert_items ON public.item_table FOR INSERT TO authenticated WITH CHECK (public.is_staff());



CREATE POLICY staff_insert_notifications ON public.notification_table FOR INSERT TO authenticated WITH CHECK (public.is_staff());



CREATE POLICY staff_insert_pending_match ON public.pending_match FOR INSERT TO authenticated WITH CHECK (public.is_staff());



CREATE POLICY staff_select_all_fraud_reports ON public.fraud_reports_table FOR SELECT TO authenticated USING (public.is_staff());



CREATE POLICY staff_select_all_items ON public.item_table FOR SELECT TO authenticated USING (public.is_staff());



CREATE POLICY staff_select_all_posts ON public.post_table FOR SELECT TO authenticated USING (public.is_staff());



CREATE POLICY staff_select_all_users ON public.user_table FOR SELECT TO authenticated USING (public.is_staff());



CREATE POLICY staff_select_claims ON public.claim_table FOR SELECT TO authenticated USING (public.is_staff());



CREATE POLICY staff_select_global_announcements ON public.global_announcements_table FOR SELECT TO authenticated USING (public.is_staff());



CREATE POLICY staff_select_notification_images ON public.notification_image_table FOR SELECT TO authenticated USING (public.is_staff());



CREATE POLICY staff_select_pending_match ON public.pending_match FOR SELECT TO authenticated USING (public.is_staff());



CREATE POLICY staff_update_all_fraud_reports ON public.fraud_reports_table FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());



CREATE POLICY staff_update_all_items ON public.item_table FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());



CREATE POLICY staff_update_all_posts ON public.post_table FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());



CREATE POLICY staff_update_claims ON public.claim_table FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());



CREATE POLICY user_delete_own_items ON public.item_table FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.item_id = item_table.item_id) AND (p.poster_id = auth.uid())))));



CREATE POLICY user_delete_own_notifications ON public.notification_table FOR DELETE TO authenticated USING ((sent_to = auth.uid()));



CREATE POLICY user_delete_own_posts ON public.post_table FOR DELETE TO authenticated USING ((poster_id = auth.uid()));



CREATE POLICY user_insert_items ON public.item_table FOR INSERT TO authenticated WITH CHECK (true);



CREATE POLICY user_insert_own_fraud_reports ON public.fraud_reports_table FOR INSERT TO authenticated WITH CHECK ((reported_by = auth.uid()));



CREATE POLICY user_insert_own_notifications ON public.notification_table FOR INSERT TO authenticated WITH CHECK ((sent_to = auth.uid()));



CREATE POLICY user_insert_own_posts ON public.post_table FOR INSERT TO authenticated WITH CHECK ((poster_id = auth.uid()));



CREATE POLICY user_select_claims_for_own_posts ON public.claim_table FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.poster_id = auth.uid()) AND (p.item_id = claim_table.item_id)))));



CREATE POLICY user_select_global_announcements ON public.global_announcements_table FOR SELECT TO authenticated USING (true);



CREATE POLICY user_select_items_visible_items_or_own ON public.item_table FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.item_id = item_table.item_id) AND ((p.status = ANY (ARRAY['accepted'::public.post_status_enum, 'reported'::public.post_status_enum])) OR (p.poster_id = auth.uid()))))));



CREATE POLICY user_select_notification_images_for_own_notifications ON public.notification_image_table FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.notification_table n
  WHERE ((n.image_id = notification_image_table.image_id) AND (n.sent_to = auth.uid())))));



CREATE POLICY user_select_own_and_visible_posts ON public.post_table FOR SELECT TO authenticated USING (((poster_id = auth.uid()) OR (status = ANY (ARRAY['accepted'::public.post_status_enum, 'reported'::public.post_status_enum]))));



CREATE POLICY user_select_own_audit_logs ON public.audit_table FOR SELECT TO authenticated USING ((user_id = auth.uid()));



CREATE POLICY user_select_own_fraud_reports ON public.fraud_reports_table FOR SELECT TO authenticated USING ((reported_by = auth.uid()));



CREATE POLICY user_select_own_notifications ON public.notification_table FOR SELECT TO authenticated USING ((sent_to = auth.uid()));



CREATE POLICY user_select_own_search_rate_limit ON public.search_rate_limit FOR SELECT TO authenticated USING ((user_id = auth.uid()));



ALTER TABLE public.user_table ENABLE ROW LEVEL SECURITY;


CREATE POLICY user_update_own ON public.user_table FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));



CREATE POLICY user_update_own_items ON public.item_table FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.item_id = item_table.item_id) AND (p.poster_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.item_id = item_table.item_id) AND (p.poster_id = auth.uid())))));



CREATE POLICY user_update_own_notifications ON public.notification_table FOR UPDATE TO authenticated USING ((sent_to = auth.uid())) WITH CHECK ((sent_to = auth.uid()));



CREATE POLICY user_update_own_posts ON public.post_table FOR UPDATE TO authenticated USING ((poster_id = auth.uid())) WITH CHECK ((poster_id = auth.uid()));



CREATE POLICY user_update_own_search_rate_limit ON public.search_rate_limit FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));



CREATE POLICY "Select, Insert, Update for authenticated 1numdc_0" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'items'::text));



CREATE POLICY "Select, Insert, Update for authenticated 1numdc_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'items'::text));



CREATE POLICY "Select, Insert, Update for authenticated 1numdc_2" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'items'::text));



CREATE POLICY "Select, Insert, Update for authenticated 1o29iim_0" ON storage.objects FOR SELECT USING ((bucket_id = 'profilePictures'::text));



CREATE POLICY "Select, Insert, Update for authenticated 1o29iim_1" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'profilePictures'::text));



CREATE POLICY "Select, Insert, Update for authenticated 1o29iim_2" ON storage.objects FOR UPDATE USING ((bucket_id = 'profilePictures'::text));



CREATE POLICY "Users can delete their own post images" ON storage.objects FOR DELETE USING (((bucket_id = 'posts'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



CREATE POLICY "service role all 1numdc_0" ON storage.objects FOR DELETE TO service_role USING ((bucket_id = 'items'::text));



CREATE POLICY "service role all 1numdc_1" ON storage.objects FOR SELECT TO service_role USING ((bucket_id = 'items'::text));



CREATE POLICY "service role all 1numdc_2" ON storage.objects FOR INSERT TO service_role WITH CHECK ((bucket_id = 'items'::text));



CREATE POLICY "service role all 1numdc_3" ON storage.objects FOR UPDATE TO service_role USING ((bucket_id = 'items'::text));


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notification_table'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.notification_table';
  END IF;
END;
$$;
