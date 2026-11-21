-- Restore the existing public.allow_registration(text) RPC used by both
-- /api/register and /api/waitlist. Safe to reapply: it creates/replaces the
-- same signature, never a second overload, and refreshes PostgREST's cache.
create extension if not exists pgcrypto;

create table if not exists public.registration_rate_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1
);
alter table public.registration_rate_limits enable row level security;

create or replace function public.allow_registration(request_ip text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  hashed_ip text;
  allowed boolean;
begin
  hashed_ip := encode(
    digest(
      coalesce(request_ip, 'unknown') || coalesce(current_setting('app.rate_limit_salt', true), 'valtiera-rate-limit-v1'),
      'sha256'
    ),
    'hex'
  );

  insert into public.registration_rate_limits as current_limit (ip_hash, window_started_at, request_count)
  values (hashed_ip, now(), 1)
  on conflict (ip_hash) do update set
    window_started_at = case
      when current_limit.window_started_at < now() - interval '1 hour' then now()
      else current_limit.window_started_at
    end,
    request_count = case
      when current_limit.window_started_at < now() - interval '1 hour' then 1
      else current_limit.request_count + 1
    end;

  select request_count <= 10 into allowed
  from public.registration_rate_limits
  where ip_hash = hashed_ip;

  return allowed;
end;
$$;

revoke all on function public.allow_registration(text) from public, anon, authenticated;
grant execute on function public.allow_registration(text) to service_role;

-- PostgREST caches RPC signatures; refresh it after this migration commits.
notify pgrst, 'reload schema';

