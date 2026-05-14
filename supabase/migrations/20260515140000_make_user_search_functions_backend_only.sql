create or replace function public.search_users_secure(
  search_query text,
  search_limit integer default 10
) returns table(
  out_user_id uuid,
  out_user_name text,
  out_email text,
  out_profile_picture_url text,
  out_user_type text
)
language plpgsql
security definer
as $$
begin
  -- Authorization is enforced in the backend route before this helper is called.
  if search_query is null or length(trim(search_query)) < 2 then
    return;
  end if;

  if search_limit is null or search_limit > 50 then
    search_limit := 50;
  end if;

  return query
  select
    ut.user_id as out_user_id,
    ut.user_name as out_user_name,
    ut.email as out_email,
    ut.profile_picture_url as out_profile_picture_url,
    ut.user_type::text as out_user_type
  from public.user_table ut
  where
    ut.user_type = 'User'
    and (
      to_tsvector('english',
        coalesce(ut.user_name, '') || ' ' ||
        coalesce(ut.email, '')
      ) @@ plainto_tsquery('english', search_query)
      or ut.user_name ilike '%' || search_query || '%'
      or ut.email ilike '%' || search_query || '%'
    )
  order by
    case
      when lower(ut.email) = lower(search_query) then 1
      when lower(ut.user_name) = lower(search_query) then 2
      when lower(ut.email) like lower(search_query) || '%' then 3
      when lower(ut.user_name) like lower(search_query) || '%' then 4
      else 5
    end,
    ut.user_name asc
  limit search_limit;
exception
  when others then
    raise notice 'Search error in search_users_secure: %', sqlerrm;
    raise;
end;
$$;

create or replace function public.search_users_secure_staff(
  search_query text,
  search_limit integer default 10
) returns table(
  out_user_id uuid,
  out_user_name text,
  out_email text,
  out_profile_picture_url text,
  out_user_type text
)
language plpgsql
security definer
as $$
begin
  -- Authorization is enforced in the backend route before this helper is called.
  if search_query is null or length(trim(search_query)) < 2 then
    return;
  end if;

  if search_limit is null or search_limit > 50 then
    search_limit := 50;
  end if;

  return query
  select
    ut.user_id as out_user_id,
    ut.user_name as out_user_name,
    ut.email as out_email,
    ut.profile_picture_url as out_profile_picture_url,
    ut.user_type::text as out_user_type
  from public.user_table ut
  where
    ut.user_type = 'User'
    and (
      to_tsvector('english',
        coalesce(ut.user_name, '') || ' ' ||
        coalesce(ut.email, '')
      ) @@ plainto_tsquery('english', search_query)
      or ut.user_name ilike '%' || search_query || '%'
      or ut.email ilike '%' || search_query || '%'
    )
  order by
    case
      when lower(ut.email) = lower(search_query) then 1
      when lower(ut.user_name) = lower(search_query) then 2
      when lower(ut.email) like lower(search_query) || '%' then 3
      when lower(ut.user_name) like lower(search_query) || '%' then 4
      else 5
    end,
    ut.user_name asc
  limit search_limit;
exception
  when others then
    raise notice 'Search error in search_users_secure_staff: %', sqlerrm;
    raise;
end;
$$;

revoke all on function public.search_users_secure(text, integer) from public;
revoke all on function public.search_users_secure(text, integer) from anon;
revoke all on function public.search_users_secure(text, integer) from authenticated;
grant execute on function public.search_users_secure(text, integer) to service_role;

revoke all on function public.search_users_secure_staff(text, integer) from public;
revoke all on function public.search_users_secure_staff(text, integer) from anon;
revoke all on function public.search_users_secure_staff(text, integer) from authenticated;
grant execute on function public.search_users_secure_staff(text, integer) to service_role;
