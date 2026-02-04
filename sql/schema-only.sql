--
-- PostgreSQL database dump
--

\restrict S9l7ryERkV0BtOKcFQFpN6VcfXkhuG8Gq8zQUp85ycoL6TLVK9AoBU5fnVs9SiO

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: pg_cron; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION pg_cron; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: fraud_report_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fraud_report_status_enum AS ENUM (
    'under_review',
    'verified',
    'rejected',
    'resolved',
    'open'
);


--
-- Name: item_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.item_status_enum AS ENUM (
    'claimed',
    'unclaimed',
    'discarded',
    'returned',
    'lost'
);


--
-- Name: item_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.item_type_enum AS ENUM (
    'found',
    'lost',
    'missing'
);


--
-- Name: location_level_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.location_level_enum AS ENUM (
    'level1',
    'level2',
    'level3'
);


--
-- Name: location_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.location_type_enum AS ENUM (
    'level1',
    'level2',
    'level3'
);


--
-- Name: post_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.post_status_enum AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'archived',
    'deleted',
    'reported',
    'fraud'
);


--
-- Name: user_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_type_enum AS ENUM (
    'User',
    'Staff',
    'Admin'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: cleanup_old_audit_logs(); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: cleanup_rate_limits(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_rate_limits() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM search_rate_limit 
  WHERE window_start < NOW() - INTERVAL '1 minute';
END;
$$;


--
-- Name: create_or_get_fraud_report(integer, text, text, uuid, text, text, text, timestamp with time zone, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: create_post_with_item_date_time_location(uuid, text, text, public.item_type_enum, text, date, integer, integer, jsonb, text, public.item_status_enum, text, public.post_status_enum, boolean); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: delete_post_by_id(integer); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: edit_post_with_item_date_time_location(integer, text, text, public.item_type_enum, text, date, integer, integer, jsonb, text, public.item_status_enum, text, public.post_status_enum, boolean); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: find_or_insert_date_id(date); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: find_or_insert_item_with_image(text, text, public.item_type_enum, text, text, public.item_status_enum, text); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: find_or_insert_location_by_path(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: find_or_insert_time_id(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: fn_set_audit_local_time(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_set_audit_local_time() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.timestamp_local := (NOW() AT TIME ZONE 'Asia/Manila');
  RETURN NEW;
END;
$$;


--
-- Name: get_dashboard_stats(text); Type: FUNCTION; Schema: public; Owner: -
--

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

--
-- Name: claim_table; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: date_lookup; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: fraud_reports_table; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: COLUMN fraud_reports_table.processed_by_staff_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fraud_reports_table.processed_by_staff_id IS 'Staff who processed the report';


--
-- Name: item_image_table; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_image_table (
    item_image_id integer NOT NULL,
    image_hash text,
    image_link text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.item_image_table FORCE ROW LEVEL SECURITY;


--
-- Name: item_table; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: location_lookup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_lookup (
    location_id integer NOT NULL,
    parent_location_id integer,
    location_name text,
    full_location_name text,
    location_level public.location_level_enum
);


--
-- Name: post_table; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: time_lookup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_lookup (
    time_id integer NOT NULL,
    hours integer,
    minutes integer
);


--
-- Name: user_table; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: fraud_reports_public_v; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: get_fraud_reports(integer, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: insert_audit_log(uuid, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: insert_audit_log(uuid, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: is_staff(); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: is_staff_or_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_staff_or_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.is_staff() OR public.is_admin();
$$;


--
-- Name: post_accepted_on_local_fill(); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: post_submitted_on_local_fill(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.post_submitted_on_local_fill() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.submitted_on_date := COALESCE(NEW.submitted_on_date, now());
  NEW.submitted_on_date_local := (NEW.submitted_on_date AT TIME ZONE 'Asia/Manila');
  RETURN NEW;
END $$;


--
-- Name: process_claim(integer, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: resolve_fraud_report(uuid, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: search_items_fts(text, integer, date, text[], text, date, date, text[], integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: search_items_fts_staff(text, integer, date, text[], text, date, date, text[], integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: search_users_secure(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: search_users_secure_staff(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: set_returned_at(); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: to_location_level(text); Type: FUNCTION; Schema: public; Owner: -
--

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


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: audit_table; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_table (
    log_id uuid NOT NULL,
    user_id uuid,
    action_type text,
    details jsonb,
    "timestamp" timestamp with time zone DEFAULT now(),
    timestamp_local timestamp without time zone
);

ALTER TABLE ONLY public.audit_table FORCE ROW LEVEL SECURITY;


--
-- Name: date_lookup_date_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.date_lookup_date_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: date_lookup_date_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.date_lookup_date_id_seq OWNED BY public.date_lookup.date_id;


--
-- Name: global_announcements_table; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: notification_image_table; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_image_table (
    image_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text
);

ALTER TABLE ONLY public.notification_image_table FORCE ROW LEVEL SECURITY;


--
-- Name: global_announcement_view; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: global_announcements_table_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.global_announcements_table ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.global_announcements_table_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: item_image_table_item_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_image_table_item_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_image_table_item_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_image_table_item_image_id_seq OWNED BY public.item_image_table.item_image_id;


--
-- Name: items_pending_metadata; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: location_lookup_location_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.location_lookup_location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: location_lookup_location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.location_lookup_location_id_seq OWNED BY public.location_lookup.location_id;


--
-- Name: notification_image_table_image_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.notification_image_table ALTER COLUMN image_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notification_image_table_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notification_table; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: notification_view; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: pending_match; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: pending_match_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pending_match ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.pending_match_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pending_match_v; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: post_public_view; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: post_table_post_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_table_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_table_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_table_post_id_seq OWNED BY public.post_table.post_id;


--
-- Name: search_rate_limit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_rate_limit (
    user_id uuid NOT NULL,
    search_count integer DEFAULT 0,
    window_start timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.search_rate_limit FORCE ROW LEVEL SECURITY;


--
-- Name: searchable_post_view; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: searchable_posts_view; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: searchable_posts_view_staff; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: time_lookup_time_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.time_lookup_time_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: time_lookup_time_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.time_lookup_time_id_seq OWNED BY public.time_lookup.time_id;


--
-- Name: v_post_records_details; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: view_audit_logs_with_user_details; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2025_12_01; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_12_01 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_12_02; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_12_02 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_12_03; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_12_03 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_12_04; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_12_04 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_12_05; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_12_05 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_12_06; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_12_06 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_12_07; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_12_07 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: messages_2025_12_01; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_01 FOR VALUES FROM ('2025-12-01 00:00:00') TO ('2025-12-02 00:00:00');


--
-- Name: messages_2025_12_02; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_02 FOR VALUES FROM ('2025-12-02 00:00:00') TO ('2025-12-03 00:00:00');


--
-- Name: messages_2025_12_03; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_03 FOR VALUES FROM ('2025-12-03 00:00:00') TO ('2025-12-04 00:00:00');


--
-- Name: messages_2025_12_04; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_04 FOR VALUES FROM ('2025-12-04 00:00:00') TO ('2025-12-05 00:00:00');


--
-- Name: messages_2025_12_05; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_05 FOR VALUES FROM ('2025-12-05 00:00:00') TO ('2025-12-06 00:00:00');


--
-- Name: messages_2025_12_06; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_06 FOR VALUES FROM ('2025-12-06 00:00:00') TO ('2025-12-07 00:00:00');


--
-- Name: messages_2025_12_07; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_12_07 FOR VALUES FROM ('2025-12-07 00:00:00') TO ('2025-12-08 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: date_lookup date_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.date_lookup ALTER COLUMN date_id SET DEFAULT nextval('public.date_lookup_date_id_seq'::regclass);


--
-- Name: item_image_table item_image_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_image_table ALTER COLUMN item_image_id SET DEFAULT nextval('public.item_image_table_item_image_id_seq'::regclass);


--
-- Name: location_lookup location_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_lookup ALTER COLUMN location_id SET DEFAULT nextval('public.location_lookup_location_id_seq'::regclass);


--
-- Name: post_table post_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table ALTER COLUMN post_id SET DEFAULT nextval('public.post_table_post_id_seq'::regclass);


--
-- Name: time_lookup time_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_lookup ALTER COLUMN time_id SET DEFAULT nextval('public.time_lookup_time_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_table audit_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_table
    ADD CONSTRAINT audit_table_pkey PRIMARY KEY (log_id);


--
-- Name: claim_table claim_table_item_id_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT claim_table_item_id_uniq UNIQUE (item_id);


--
-- Name: claim_table claim_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT claim_table_pkey PRIMARY KEY (claim_id);


--
-- Name: date_lookup date_lookup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.date_lookup
    ADD CONSTRAINT date_lookup_pkey PRIMARY KEY (date_id);


--
-- Name: fraud_reports_table fraud_reports_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fraud_reports_table_pkey PRIMARY KEY (report_id);


--
-- Name: global_announcements_table global_announcements_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_announcements_table
    ADD CONSTRAINT global_announcements_table_pkey PRIMARY KEY (id);


--
-- Name: item_image_table item_image_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_image_table
    ADD CONSTRAINT item_image_table_pkey PRIMARY KEY (item_image_id);


--
-- Name: item_table item_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_table
    ADD CONSTRAINT item_table_pkey PRIMARY KEY (item_id);


--
-- Name: location_lookup location_lookup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_lookup
    ADD CONSTRAINT location_lookup_pkey PRIMARY KEY (location_id);


--
-- Name: notification_image_table notification_image_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_image_table
    ADD CONSTRAINT notification_image_table_pkey PRIMARY KEY (image_id);


--
-- Name: notification_table notification_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT notification_table_pkey PRIMARY KEY (notification_id);


--
-- Name: pending_match pending_match_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_match
    ADD CONSTRAINT pending_match_pkey PRIMARY KEY (id);


--
-- Name: post_table post_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT post_table_pkey PRIMARY KEY (post_id);


--
-- Name: search_rate_limit search_rate_limit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_rate_limit
    ADD CONSTRAINT search_rate_limit_pkey PRIMARY KEY (user_id);


--
-- Name: time_lookup time_lookup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_lookup
    ADD CONSTRAINT time_lookup_pkey PRIMARY KEY (time_id);


--
-- Name: user_table user_table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_table
    ADD CONSTRAINT user_table_pkey PRIMARY KEY (user_id);


--
-- Name: claim_table ux_claim_item_claimid; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT ux_claim_item_claimid UNIQUE (item_id, claim_id);


--
-- Name: post_table ux_post_unique_combination; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT ux_post_unique_combination UNIQUE (poster_id, item_id, last_seen_time_id, last_seen_location_id, is_anonymous);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_01 messages_2025_12_01_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_12_01
    ADD CONSTRAINT messages_2025_12_01_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_02 messages_2025_12_02_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_12_02
    ADD CONSTRAINT messages_2025_12_02_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_03 messages_2025_12_03_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_12_03
    ADD CONSTRAINT messages_2025_12_03_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_04 messages_2025_12_04_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_12_04
    ADD CONSTRAINT messages_2025_12_04_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_05 messages_2025_12_05_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_12_05
    ADD CONSTRAINT messages_2025_12_05_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_06 messages_2025_12_06_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_12_06
    ADD CONSTRAINT messages_2025_12_06_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_12_07 messages_2025_12_07_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_12_07
    ADD CONSTRAINT messages_2025_12_07_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_audit_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_action_type ON public.audit_table USING btree (action_type);


--
-- Name: idx_audit_timestamp_local; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_timestamp_local ON public.audit_table USING btree (timestamp_local DESC);


--
-- Name: idx_audit_timestamp_utc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_timestamp_utc ON public.audit_table USING btree ("timestamp" DESC);


--
-- Name: idx_audit_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_user_id ON public.audit_table USING btree (user_id);


--
-- Name: idx_claim_claimer_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claim_claimer_email ON public.claim_table USING btree (claimer_school_email);


--
-- Name: idx_claim_item_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_claim_item_email_unique ON public.claim_table USING btree (item_id, claimer_school_email);


--
-- Name: idx_claim_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_claim_item_id ON public.claim_table USING btree (item_id);


--
-- Name: idx_date_lookup_date_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_date_lookup_date_unique ON public.date_lookup USING btree (date);


--
-- Name: idx_fraud_reports_date_reported; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_reports_date_reported ON public.fraud_reports_table USING btree (date_reported DESC);


--
-- Name: idx_fraud_reports_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_reports_post_id ON public.fraud_reports_table USING btree (post_id);


--
-- Name: idx_fraud_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fraud_reports_status ON public.fraud_reports_table USING btree (report_status);


--
-- Name: idx_image_hash_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_image_hash_unique ON public.item_image_table USING btree (image_hash);


--
-- Name: idx_item_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_name ON public.item_table USING btree (item_name);


--
-- Name: idx_item_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_search_vector ON public.item_table USING gin (search_vector);


--
-- Name: idx_item_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_status ON public.item_table USING btree (status);


--
-- Name: idx_item_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_type ON public.item_table USING btree (type);


--
-- Name: idx_location_full_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_location_full_name_unique ON public.location_lookup USING btree (full_location_name);


--
-- Name: idx_location_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_location_name ON public.location_lookup USING btree (location_name);


--
-- Name: idx_notification_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_is_read ON public.notification_table USING btree (is_read);


--
-- Name: idx_notification_sent_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_sent_to ON public.notification_table USING btree (sent_to);


--
-- Name: idx_post_accepted_on_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_accepted_on_date ON public.post_table USING btree (accepted_on_date);


--
-- Name: idx_post_accepted_on_date_local; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_accepted_on_date_local ON public.post_table USING btree (accepted_on_date_local);


--
-- Name: idx_post_is_anonymous; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_is_anonymous ON public.post_table USING btree (is_anonymous, status);


--
-- Name: idx_post_last_seen_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_last_seen_location_id ON public.post_table USING btree (last_seen_location_id);


--
-- Name: idx_post_poster_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_poster_id ON public.post_table USING btree (poster_id);


--
-- Name: idx_post_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_status ON public.post_table USING btree (status);


--
-- Name: idx_post_status_accepted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_status_accepted ON public.post_table USING btree (status, accepted_on_date) WHERE (status = 'accepted'::public.post_status_enum);


--
-- Name: idx_post_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_submitted_at ON public.post_table USING btree (submitted_on_date);


--
-- Name: idx_post_submitted_at_local; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_submitted_at_local ON public.post_table USING btree (submitted_on_date_local);


--
-- Name: idx_post_submitted_on_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_submitted_on_date ON public.post_table USING btree (submitted_on_date);


--
-- Name: idx_post_submitted_on_date_local; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_submitted_on_date_local ON public.post_table USING btree (submitted_on_date_local);


--
-- Name: idx_rate_limit_window; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_limit_window ON public.search_rate_limit USING btree (window_start);


--
-- Name: idx_time_lookup_hours_minutes_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_time_lookup_hours_minutes_unique ON public.time_lookup USING btree (hours, minutes);


--
-- Name: idx_user_email_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_email_trgm ON public.user_table USING gin (email public.gin_trgm_ops);


--
-- Name: idx_user_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_email_unique ON public.user_table USING btree (email);


--
-- Name: idx_user_last_login; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_last_login ON public.user_table USING btree (last_login DESC);


--
-- Name: idx_user_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_name ON public.user_table USING btree (user_name);


--
-- Name: idx_user_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_name_trgm ON public.user_table USING gin (user_name public.gin_trgm_ops);


--
-- Name: idx_user_search_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_search_fts ON public.user_table USING gin (to_tsvector('english'::regconfig, ((COALESCE(user_name, ''::text) || ' '::text) || COALESCE(email, ''::text))));


--
-- Name: idx_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_type ON public.user_table USING btree (user_type);


--
-- Name: idx_user_type_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_type_name ON public.user_table USING btree (user_type, user_name);


--
-- Name: ux_fraud_reports_dedup; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_fraud_reports_dedup ON public.fraud_reports_table USING btree (post_id, md5(COALESCE(btrim(lower(reason_for_reporting)), ''::text)), COALESCE(proof_image_url, ''::text));


--
-- Name: ux_item_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_item_lookup ON public.item_table USING btree (lower(item_name), image_id, type);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_01_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2025_12_01_inserted_at_topic_idx ON realtime.messages_2025_12_01 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_02_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2025_12_02_inserted_at_topic_idx ON realtime.messages_2025_12_02 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_03_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2025_12_03_inserted_at_topic_idx ON realtime.messages_2025_12_03 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_04_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2025_12_04_inserted_at_topic_idx ON realtime.messages_2025_12_04 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_05_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2025_12_05_inserted_at_topic_idx ON realtime.messages_2025_12_05 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_06_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2025_12_06_inserted_at_topic_idx ON realtime.messages_2025_12_06 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_12_07_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_2025_12_07_inserted_at_topic_idx ON realtime.messages_2025_12_07 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: messages_2025_12_01_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_01_inserted_at_topic_idx;


--
-- Name: messages_2025_12_01_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_01_pkey;


--
-- Name: messages_2025_12_02_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_02_inserted_at_topic_idx;


--
-- Name: messages_2025_12_02_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_02_pkey;


--
-- Name: messages_2025_12_03_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_03_inserted_at_topic_idx;


--
-- Name: messages_2025_12_03_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_03_pkey;


--
-- Name: messages_2025_12_04_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_04_inserted_at_topic_idx;


--
-- Name: messages_2025_12_04_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_04_pkey;


--
-- Name: messages_2025_12_05_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_05_inserted_at_topic_idx;


--
-- Name: messages_2025_12_05_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_05_pkey;


--
-- Name: messages_2025_12_06_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_06_inserted_at_topic_idx;


--
-- Name: messages_2025_12_06_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_06_pkey;


--
-- Name: messages_2025_12_07_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_12_07_inserted_at_topic_idx;


--
-- Name: messages_2025_12_07_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_12_07_pkey;


--
-- Name: post_table trg_post_accepted_on_local; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_post_accepted_on_local BEFORE INSERT OR UPDATE OF accepted_on_date ON public.post_table FOR EACH ROW EXECUTE FUNCTION public.post_accepted_on_local_fill();


--
-- Name: post_table trg_post_submitted_on_local; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_post_submitted_on_local BEFORE INSERT OR UPDATE OF submitted_on_date ON public.post_table FOR EACH ROW EXECUTE FUNCTION public.post_submitted_on_local_fill();


--
-- Name: audit_table trg_set_audit_local_time; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_audit_local_time BEFORE INSERT ON public.audit_table FOR EACH ROW EXECUTE FUNCTION public.fn_set_audit_local_time();


--
-- Name: item_table trg_set_returned_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_returned_at BEFORE UPDATE ON public.item_table FOR EACH ROW EXECUTE FUNCTION public.set_returned_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: audit_table FK_audit_table_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_table
    ADD CONSTRAINT "FK_audit_table_user_id" FOREIGN KEY (user_id) REFERENCES public.user_table(user_id);


--
-- Name: claim_table FK_claim_table_processed_by_staff_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT "FK_claim_table_processed_by_staff_id" FOREIGN KEY (processed_by_staff_id) REFERENCES public.user_table(user_id);


--
-- Name: item_table FK_item_table_image_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_table
    ADD CONSTRAINT "FK_item_table_image_id" FOREIGN KEY (image_id) REFERENCES public.item_image_table(item_image_id);


--
-- Name: location_lookup FK_location_lookup_parent_location_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_lookup
    ADD CONSTRAINT "FK_location_lookup_parent_location_id" FOREIGN KEY (parent_location_id) REFERENCES public.location_lookup(location_id);


--
-- Name: notification_table FK_notification_table_sent_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT "FK_notification_table_sent_by" FOREIGN KEY (sent_by) REFERENCES public.user_table(user_id);


--
-- Name: notification_table FK_notification_table_sent_to; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT "FK_notification_table_sent_to" FOREIGN KEY (sent_to) REFERENCES public.user_table(user_id);


--
-- Name: post_table FK_post_table_accepted_by_staff_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_accepted_by_staff_id" FOREIGN KEY (accepted_by_staff_id) REFERENCES public.user_table(user_id);


--
-- Name: post_table FK_post_table_item_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_item_id" FOREIGN KEY (item_id) REFERENCES public.item_table(item_id);


--
-- Name: post_table FK_post_table_last_seen_date_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_last_seen_date_id" FOREIGN KEY (last_seen_date_id) REFERENCES public.date_lookup(date_id);


--
-- Name: post_table FK_post_table_last_seen_location_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_last_seen_location_id" FOREIGN KEY (last_seen_location_id) REFERENCES public.location_lookup(location_id);


--
-- Name: post_table FK_post_table_last_seen_time_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_last_seen_time_id" FOREIGN KEY (last_seen_time_id) REFERENCES public.time_lookup(time_id);


--
-- Name: post_table FK_post_table_poster_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_table
    ADD CONSTRAINT "FK_post_table_poster_id" FOREIGN KEY (poster_id) REFERENCES public.user_table(user_id);


--
-- Name: claim_table claim_table_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT claim_table_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.item_table(item_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: claim_table claim_table_linked_lost_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.claim_table
    ADD CONSTRAINT claim_table_linked_lost_item_id_fkey FOREIGN KEY (linked_lost_item_id) REFERENCES public.item_table(item_id);


--
-- Name: fraud_reports_table fk_fraud_reports_claim_staff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fk_fraud_reports_claim_staff FOREIGN KEY (claim_processed_by_staff_id) REFERENCES public.user_table(user_id);


--
-- Name: fraud_reports_table fk_fraud_reports_post; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fk_fraud_reports_post FOREIGN KEY (post_id) REFERENCES public.post_table(post_id) ON DELETE CASCADE;


--
-- Name: fraud_reports_table fraud_reports_table_processed_by_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fraud_reports_table_processed_by_staff_id_fkey FOREIGN KEY (processed_by_staff_id) REFERENCES public.user_table(user_id);


--
-- Name: fraud_reports_table fraud_reports_table_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fraud_reports_table
    ADD CONSTRAINT fraud_reports_table_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.user_table(user_id);


--
-- Name: global_announcements_table global_announcements_table_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_announcements_table
    ADD CONSTRAINT global_announcements_table_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.notification_image_table(image_id);


--
-- Name: global_announcements_table global_announcements_table_sent_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.global_announcements_table
    ADD CONSTRAINT global_announcements_table_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.user_table(user_id);


--
-- Name: notification_table notification_table_global_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT notification_table_global_announcement_id_fkey FOREIGN KEY (global_announcement_id) REFERENCES public.global_announcements_table(id);


--
-- Name: notification_table notification_table_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_table
    ADD CONSTRAINT notification_table_image_id_fkey FOREIGN KEY (image_id) REFERENCES public.notification_image_table(image_id);


--
-- Name: pending_match pending_match_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_match
    ADD CONSTRAINT pending_match_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post_table(post_id);


--
-- Name: pending_match pending_match_poster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_match
    ADD CONSTRAINT pending_match_poster_id_fkey FOREIGN KEY (poster_id) REFERENCES public.user_table(user_id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: global_announcements_table admin_insert_global_announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_insert_global_announcements ON public.global_announcements_table FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: notification_image_table admin_insert_notification_images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_insert_notification_images ON public.notification_image_table FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: notification_table admin_insert_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_insert_notifications ON public.notification_table FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: audit_table admin_select_all_audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_all_audit_logs ON public.audit_table FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: fraud_reports_table admin_select_all_fraud_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_all_fraud_reports ON public.fraud_reports_table FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: item_table admin_select_all_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_all_items ON public.item_table FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: post_table admin_select_all_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_all_posts ON public.post_table FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: user_table admin_select_all_users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_all_users ON public.user_table FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: claim_table admin_select_claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_claims ON public.claim_table FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: global_announcements_table admin_select_global_announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_global_announcements ON public.global_announcements_table FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: notification_image_table admin_select_notification_images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_notification_images ON public.notification_image_table FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: pending_match admin_select_pending_match; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_select_pending_match ON public.pending_match FOR SELECT TO authenticated USING (public.is_admin());


--
-- Name: user_table admin_update_all_users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_update_all_users ON public.user_table FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: user_table all_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY all_select_own ON public.user_table FOR SELECT TO authenticated USING (true);


--
-- Name: audit_table any_insert_audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY any_insert_audit_logs ON public.audit_table FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: audit_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_table ENABLE ROW LEVEL SECURITY;

--
-- Name: search_rate_limit authenticated_all_search_rate_limit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_all_search_rate_limit ON public.search_rate_limit TO authenticated USING (true) WITH CHECK (true);


--
-- Name: user_table authenticated_insert_own_account; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_insert_own_account ON public.user_table FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: claim_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.claim_table ENABLE ROW LEVEL SECURITY;

--
-- Name: fraud_reports_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fraud_reports_table ENABLE ROW LEVEL SECURITY;

--
-- Name: global_announcements_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.global_announcements_table ENABLE ROW LEVEL SECURITY;

--
-- Name: item_table item_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_delete_auth ON public.item_table FOR DELETE TO authenticated USING (true);


--
-- Name: item_image_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.item_image_table ENABLE ROW LEVEL SECURITY;

--
-- Name: item_image_table item_images_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_images_delete_auth ON public.item_image_table FOR DELETE TO authenticated USING (true);


--
-- Name: item_image_table item_images_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_images_insert_auth ON public.item_image_table FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: item_image_table item_images_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_images_select_auth ON public.item_image_table FOR SELECT TO authenticated USING (true);


--
-- Name: item_image_table item_images_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_images_update_auth ON public.item_image_table FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: item_table item_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_insert_auth ON public.item_table FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: item_table item_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_select_auth ON public.item_table FOR SELECT TO authenticated USING (true);


--
-- Name: item_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.item_table ENABLE ROW LEVEL SECURITY;

--
-- Name: item_table item_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_update_auth ON public.item_table FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: notification_image_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_image_table ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_table ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_match; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pending_match ENABLE ROW LEVEL SECURITY;

--
-- Name: post_table post_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY post_delete_auth ON public.post_table FOR DELETE TO authenticated USING (true);


--
-- Name: post_table post_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY post_insert_auth ON public.post_table FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: post_table post_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY post_select_auth ON public.post_table FOR SELECT TO authenticated USING (true);


--
-- Name: post_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_table ENABLE ROW LEVEL SECURITY;

--
-- Name: post_table post_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY post_update_auth ON public.post_table FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: search_rate_limit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_rate_limit ENABLE ROW LEVEL SECURITY;

--
-- Name: search_rate_limit staff_admin_select_search_rate_limit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_admin_select_search_rate_limit ON public.search_rate_limit FOR SELECT TO authenticated USING (public.is_staff_or_admin());


--
-- Name: search_rate_limit staff_admin_update_search_rate_limit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_admin_update_search_rate_limit ON public.search_rate_limit FOR UPDATE TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());


--
-- Name: post_table staff_delete_all_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_delete_all_posts ON public.post_table FOR DELETE TO authenticated USING (public.is_staff());


--
-- Name: claim_table staff_delete_claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_delete_claims ON public.claim_table FOR DELETE TO authenticated USING (public.is_staff());


--
-- Name: claim_table staff_insert_claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_insert_claims ON public.claim_table FOR INSERT TO authenticated WITH CHECK (public.is_staff());


--
-- Name: item_table staff_insert_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_insert_items ON public.item_table FOR INSERT TO authenticated WITH CHECK (public.is_staff());


--
-- Name: notification_table staff_insert_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_insert_notifications ON public.notification_table FOR INSERT TO authenticated WITH CHECK (public.is_staff());


--
-- Name: pending_match staff_insert_pending_match; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_insert_pending_match ON public.pending_match FOR INSERT TO authenticated WITH CHECK (public.is_staff());


--
-- Name: fraud_reports_table staff_select_all_fraud_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_all_fraud_reports ON public.fraud_reports_table FOR SELECT TO authenticated USING (public.is_staff());


--
-- Name: item_table staff_select_all_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_all_items ON public.item_table FOR SELECT TO authenticated USING (public.is_staff());


--
-- Name: post_table staff_select_all_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_all_posts ON public.post_table FOR SELECT TO authenticated USING (public.is_staff());


--
-- Name: user_table staff_select_all_users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_all_users ON public.user_table FOR SELECT TO authenticated USING (public.is_staff());


--
-- Name: claim_table staff_select_claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_claims ON public.claim_table FOR SELECT TO authenticated USING (public.is_staff());


--
-- Name: global_announcements_table staff_select_global_announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_global_announcements ON public.global_announcements_table FOR SELECT TO authenticated USING (public.is_staff());


--
-- Name: notification_image_table staff_select_notification_images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_notification_images ON public.notification_image_table FOR SELECT TO authenticated USING (public.is_staff());


--
-- Name: pending_match staff_select_pending_match; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_select_pending_match ON public.pending_match FOR SELECT TO authenticated USING (public.is_staff());


--
-- Name: fraud_reports_table staff_update_all_fraud_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_update_all_fraud_reports ON public.fraud_reports_table FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());


--
-- Name: item_table staff_update_all_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_update_all_items ON public.item_table FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());


--
-- Name: post_table staff_update_all_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_update_all_posts ON public.post_table FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());


--
-- Name: claim_table staff_update_claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_update_claims ON public.claim_table FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());


--
-- Name: item_table user_delete_own_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_delete_own_items ON public.item_table FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.item_id = item_table.item_id) AND (p.poster_id = auth.uid())))));


--
-- Name: notification_table user_delete_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_delete_own_notifications ON public.notification_table FOR DELETE TO authenticated USING ((sent_to = auth.uid()));


--
-- Name: post_table user_delete_own_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_delete_own_posts ON public.post_table FOR DELETE TO authenticated USING ((poster_id = auth.uid()));


--
-- Name: item_table user_insert_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_insert_items ON public.item_table FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fraud_reports_table user_insert_own_fraud_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_insert_own_fraud_reports ON public.fraud_reports_table FOR INSERT TO authenticated WITH CHECK ((reported_by = auth.uid()));


--
-- Name: notification_table user_insert_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_insert_own_notifications ON public.notification_table FOR INSERT TO authenticated WITH CHECK ((sent_to = auth.uid()));


--
-- Name: post_table user_insert_own_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_insert_own_posts ON public.post_table FOR INSERT TO authenticated WITH CHECK ((poster_id = auth.uid()));


--
-- Name: claim_table user_select_claims_for_own_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_claims_for_own_posts ON public.claim_table FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.poster_id = auth.uid()) AND (p.item_id = claim_table.item_id)))));


--
-- Name: global_announcements_table user_select_global_announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_global_announcements ON public.global_announcements_table FOR SELECT TO authenticated USING (true);


--
-- Name: item_table user_select_items_visible_items_or_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_items_visible_items_or_own ON public.item_table FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.item_id = item_table.item_id) AND ((p.status = ANY (ARRAY['accepted'::public.post_status_enum, 'reported'::public.post_status_enum])) OR (p.poster_id = auth.uid()))))));


--
-- Name: notification_image_table user_select_notification_images_for_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_notification_images_for_own_notifications ON public.notification_image_table FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.notification_table n
  WHERE ((n.image_id = notification_image_table.image_id) AND (n.sent_to = auth.uid())))));


--
-- Name: post_table user_select_own_and_visible_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_own_and_visible_posts ON public.post_table FOR SELECT TO authenticated USING (((poster_id = auth.uid()) OR (status = ANY (ARRAY['accepted'::public.post_status_enum, 'reported'::public.post_status_enum]))));


--
-- Name: audit_table user_select_own_audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_own_audit_logs ON public.audit_table FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: fraud_reports_table user_select_own_fraud_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_own_fraud_reports ON public.fraud_reports_table FOR SELECT TO authenticated USING ((reported_by = auth.uid()));


--
-- Name: notification_table user_select_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_own_notifications ON public.notification_table FOR SELECT TO authenticated USING ((sent_to = auth.uid()));


--
-- Name: search_rate_limit user_select_own_search_rate_limit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_select_own_search_rate_limit ON public.search_rate_limit FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: user_table; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_table ENABLE ROW LEVEL SECURITY;

--
-- Name: user_table user_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_update_own ON public.user_table FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: item_table user_update_own_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_update_own_items ON public.item_table FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.item_id = item_table.item_id) AND (p.poster_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.post_table p
  WHERE ((p.item_id = item_table.item_id) AND (p.poster_id = auth.uid())))));


--
-- Name: notification_table user_update_own_notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_update_own_notifications ON public.notification_table FOR UPDATE TO authenticated USING ((sent_to = auth.uid())) WITH CHECK ((sent_to = auth.uid()));


--
-- Name: post_table user_update_own_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_update_own_posts ON public.post_table FOR UPDATE TO authenticated USING ((poster_id = auth.uid())) WITH CHECK ((poster_id = auth.uid()));


--
-- Name: search_rate_limit user_update_own_search_rate_limit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_update_own_search_rate_limit ON public.search_rate_limit FOR UPDATE TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Select, Insert, Update for authenticated 1numdc_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Select, Insert, Update for authenticated 1numdc_0" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'items'::text));


--
-- Name: objects Select, Insert, Update for authenticated 1numdc_1; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Select, Insert, Update for authenticated 1numdc_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'items'::text));


--
-- Name: objects Select, Insert, Update for authenticated 1numdc_2; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Select, Insert, Update for authenticated 1numdc_2" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'items'::text));


--
-- Name: objects Select, Insert, Update for authenticated 1o29iim_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Select, Insert, Update for authenticated 1o29iim_0" ON storage.objects FOR SELECT USING ((bucket_id = 'profilePictures'::text));


--
-- Name: objects Select, Insert, Update for authenticated 1o29iim_1; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Select, Insert, Update for authenticated 1o29iim_1" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'profilePictures'::text));


--
-- Name: objects Select, Insert, Update for authenticated 1o29iim_2; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Select, Insert, Update for authenticated 1o29iim_2" ON storage.objects FOR UPDATE USING ((bucket_id = 'profilePictures'::text));


--
-- Name: objects Users can delete their own post images; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete their own post images" ON storage.objects FOR DELETE USING (((bucket_id = 'posts'::text) AND (auth.role() = 'authenticated'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: objects service role all 1numdc_0; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "service role all 1numdc_0" ON storage.objects FOR DELETE TO service_role USING ((bucket_id = 'items'::text));


--
-- Name: objects service role all 1numdc_1; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "service role all 1numdc_1" ON storage.objects FOR SELECT TO service_role USING ((bucket_id = 'items'::text));


--
-- Name: objects service role all 1numdc_2; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "service role all 1numdc_2" ON storage.objects FOR INSERT TO service_role WITH CHECK ((bucket_id = 'items'::text));


--
-- Name: objects service role all 1numdc_3; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "service role all 1numdc_3" ON storage.objects FOR UPDATE TO service_role USING ((bucket_id = 'items'::text));


--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime notification_table; Type: PUBLICATION TABLE; Schema: public; Owner: -
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.notification_table;


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict S9l7ryERkV0BtOKcFQFpN6VcfXkhuG8Gq8zQUp85ycoL6TLVK9AoBU5fnVs9SiO

