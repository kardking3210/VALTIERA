-- Remove the virtual-credit product and preserve each user's YES/NO direction as a non-monetary research view.
create table if not exists public.prediction_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market_id text not null references public.prediction_markets(id) on delete cascade,
  side text not null check (side in ('YES','NO')),
  note text,
  created_at timestamptz not null default now()
);

insert into public.prediction_views(user_id,market_id,side,note,created_at)
select user_id,market_id,side,'Imported from the former virtual-credit prototype.',created_at
from public.prediction_positions
on conflict do nothing;

alter table public.prediction_views enable row level security;
revoke all on public.prediction_views from anon,authenticated;
grant select,insert,update,delete on public.prediction_views to authenticated;
drop policy if exists prediction_views_own on public.prediction_views;
create policy prediction_views_own on public.prediction_views for all to authenticated
using (user_id=auth.uid() or public.is_valtiera_admin())
with check (user_id=auth.uid() or public.is_valtiera_admin());

drop function if exists public.place_virtual_prediction(text,text,integer);

-- Keep account creation working without granting or recording any credits.
create or replace function public.handle_new_valtiera_user()
returns trigger language plpgsql security definer set search_path=public,auth as $$
begin
  insert into public.profiles(id,full_name)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict(id) do nothing;
  return new;
end; $$;

drop table if exists public.virtual_transactions;
drop table if exists public.prediction_positions;
drop table if exists public.virtual_portfolios;

