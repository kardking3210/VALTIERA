create extension if not exists pgcrypto;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 150),
  email text not null,
  country text not null,
  interest_category text not null check (interest_category in ('Platform User','Early Access / Platform User','Investor Interest','Research & Technology','Strategic Partnership','Quantitative Research & Technology','General Interest')),
  organisation text,
  professional_role text,
  linkedin_url text,
  message text,
  consent_privacy boolean not null check (consent_privacy = true),
  consent_marketing boolean not null default false,
  status text not null default 'New' check (status in ('New','Contacted','In Discussion','Qualified','Archived')),
  created_at timestamptz not null default now()
);
create unique index if not exists registrations_email_lower_idx on public.registrations (lower(email));
create index if not exists registrations_created_at_idx on public.registrations (created_at desc);
create index if not exists registrations_category_idx on public.registrations (interest_category);
alter table public.registrations enable row level security;
-- No anon/authenticated policies: only the server's service role accesses this table.

create table if not exists public.registration_rate_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1
);
alter table public.registration_rate_limits enable row level security;

create or replace function public.allow_registration(request_ip text)
returns boolean language plpgsql security definer set search_path = public as $$
declare hashed_ip text; allowed boolean;
begin
  hashed_ip := encode(digest(coalesce(request_ip,'unknown') || coalesce(current_setting('app.rate_limit_salt', true),'valtiera-rate-limit-v1'), 'sha256'),'hex');
  insert into registration_rate_limits(ip_hash,window_started_at,request_count) values(hashed_ip,now(),1)
    on conflict(ip_hash) do update set
      window_started_at=case when registration_rate_limits.window_started_at < now()-interval '1 hour' then now() else registration_rate_limits.window_started_at end,
      request_count=case when registration_rate_limits.window_started_at < now()-interval '1 hour' then 1 else registration_rate_limits.request_count+1 end;
  select request_count <= 10 into allowed from registration_rate_limits where ip_hash=hashed_ip;
  return allowed;
end; $$;
revoke all on function public.allow_registration(text) from public, anon, authenticated;
grant execute on function public.allow_registration(text) to service_role;

create table if not exists public.admin_login_attempts (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1
);
alter table public.admin_login_attempts enable row level security;
create or replace function public.allow_admin_login(request_ip text)
returns boolean language plpgsql security definer set search_path = public as $$
declare hashed_ip text; allowed boolean;
begin
  hashed_ip := encode(digest(coalesce(request_ip,'unknown') || coalesce(current_setting('app.rate_limit_salt', true),'valtiera-rate-limit-v1'), 'sha256'),'hex');
  insert into admin_login_attempts(ip_hash,window_started_at,request_count) values(hashed_ip,now(),1)
    on conflict(ip_hash) do update set
      window_started_at=case when admin_login_attempts.window_started_at < now()-interval '15 minutes' then now() else admin_login_attempts.window_started_at end,
      request_count=case when admin_login_attempts.window_started_at < now()-interval '15 minutes' then 1 else admin_login_attempts.request_count+1 end;
  select request_count <= 8 into allowed from admin_login_attempts where ip_hash=hashed_ip;
  return allowed;
end; $$;
revoke all on function public.allow_admin_login(text) from public, anon, authenticated;
grant execute on function public.allow_admin_login(text) to service_role;

