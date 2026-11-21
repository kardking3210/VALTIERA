create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text null check (full_name is null or char_length(full_name) <= 150),
  email text not null,
  country text null check (country is null or char_length(country) <= 120),
  interest text null check (interest is null or interest in ('Cryptocurrency','Stocks and equities','Futures and options','Quantitative research','Prediction markets','DeFi','Institutional research','Other')) ,
  status text not null default 'confirmed' check (status in ('confirmed','pending')) ,
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_email_lower_idx on public.waitlist (lower(email));
create index if not exists waitlist_confirmed_created_at_idx on public.waitlist (created_at desc) where status = 'confirmed';
alter table public.waitlist enable row level security;
-- Waitlist records contain personal information. No anon/authenticated policies are granted.
-- Public registration and aggregate counts run through server routes using the service role.

