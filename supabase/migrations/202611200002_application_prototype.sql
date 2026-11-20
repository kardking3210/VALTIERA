-- VALTIERA application prototype: private user data is always scoped to auth.uid().
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'member' check(role in ('member','moderator','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.prediction_markets (
  id text primary key,
  question text not null,
  category text not null,
  yes_probability numeric(5,2) not null default 50 check(yes_probability between 0 and 100),
  virtual_activity bigint not null default 0 check(virtual_activity >= 0),
  closes_at timestamptz,
  description text not null default '',
  resolution_criteria text not null default '',
  resolution_source text not null default '',
  status text not null default 'open' check(status in ('draft','open','closed','resolved','archived')),
  is_illustrative boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.prediction_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market_id text not null references public.prediction_markets(id) on delete cascade,
  side text not null check(side in ('YES','NO')),
  virtual_credits integer not null check(virtual_credits > 0),
  created_at timestamptz not null default now()
);
create index if not exists prediction_positions_user_created_idx on public.prediction_positions(user_id,created_at desc);
create index if not exists prediction_positions_market_idx on public.prediction_positions(market_id);
create table if not exists public.prediction_resolutions (
  id uuid primary key default gen_random_uuid(),
  market_id text not null unique references public.prediction_markets(id) on delete cascade,
  outcome text not null check(outcome in ('YES','NO','VOID')),
  resolution_note text not null,
  source_url text not null default '',
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz not null default now()
);
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check(char_length(title) between 4 and 220),
  body text not null check(char_length(body) between 10 and 8000),
  sentiment text not null default 'Question' check(sentiment in ('Bullish','Bearish','Question')),
  status text not null default 'published' check(status in ('pending','published','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_created_idx on public.community_posts(created_at desc) where status='published';
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 3000),
  status text not null default 'published' check(status in ('published','hidden','removed')),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_created_idx on public.community_comments(post_id,created_at);
create table if not exists public.community_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null check(vote in ('agree','challenge')),
  created_at timestamptz not null default now(),
  unique(post_id,user_id)
);
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  asset_type text not null check(asset_type in ('stock','crypto','fund','index')),
  created_at timestamptz not null default now(),
  unique(user_id,symbol,asset_type)
);
create table if not exists public.virtual_portfolios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 10000 check(balance >= 0),
  starting_balance integer not null default 10000 check(starting_balance > 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.virtual_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check(transaction_type in ('initial_grant','prediction_allocation','prediction_return','correction')),
  amount integer not null check(amount > 0),
  market_id text references public.prediction_markets(id) on delete set null,
  position_id uuid references public.prediction_positions(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists virtual_transactions_user_created_idx on public.virtual_transactions(user_id,created_at desc);
create table if not exists public.research_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text not null default '',
  content text not null default '',
  status text not null default 'draft' check(status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);

create or replace function public.is_valtiera_admin()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator'));
$$;
revoke all on function public.is_valtiera_admin() from public,anon;
grant execute on function public.is_valtiera_admin() to authenticated,service_role;

create or replace function public.handle_new_valtiera_user()
returns trigger language plpgsql security definer set search_path=public,auth as $$
begin
  insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing;
  insert into public.virtual_portfolios(user_id,balance,starting_balance) values(new.id,10000,10000) on conflict(user_id) do nothing;
  insert into public.virtual_transactions(user_id,transaction_type,amount,note) values(new.id,'initial_grant',10000,'Non-transferable educational virtual-credit grant');
  return new;
end; $$;
drop trigger if exists on_valtiera_auth_user_created on auth.users;
create trigger on_valtiera_auth_user_created after insert on auth.users for each row execute function public.handle_new_valtiera_user();

-- A single atomic server-side allocation; credits cannot be bought, transferred or redeemed.
create or replace function public.place_virtual_prediction(p_market_id text,p_side text,p_amount integer)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare uid uuid; new_position public.prediction_positions; remaining integer;
begin
  uid:=auth.uid();
  if uid is null then raise exception 'Sign in is required.' using errcode='28000'; end if;
  if p_side not in ('YES','NO') or p_amount is null or p_amount<1 or p_amount>10000 then raise exception 'Invalid virtual allocation.' using errcode='22023'; end if;
  if not exists(select 1 from public.prediction_markets where id=p_market_id and status='open') then raise exception 'This sample market is not open.' using errcode='22023'; end if;
  update public.virtual_portfolios set balance=balance-p_amount,updated_at=now() where user_id=uid and balance>=p_amount returning balance into remaining;
  if remaining is null then raise exception 'Insufficient virtual credits.' using errcode='22023'; end if;
  insert into public.prediction_positions(user_id,market_id,side,virtual_credits) values(uid,p_market_id,p_side,p_amount) returning * into new_position;
  insert into public.virtual_transactions(user_id,transaction_type,amount,market_id,position_id,note) values(uid,'prediction_allocation',p_amount,p_market_id,new_position.id,'Virtual prediction practice allocation');
  return jsonb_build_object('position_id',new_position.id,'remaining_virtual_credits',remaining);
end; $$;
revoke all on function public.place_virtual_prediction(text,text,integer) from public,anon;
grant execute on function public.place_virtual_prediction(text,text,integer) to authenticated;

alter table public.profiles enable row level security;
alter table public.prediction_markets enable row level security;
alter table public.prediction_positions enable row level security;
alter table public.prediction_resolutions enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_votes enable row level security;
alter table public.watchlists enable row level security;
alter table public.virtual_portfolios enable row level security;
alter table public.virtual_transactions enable row level security;
alter table public.research_articles enable row level security;
alter table public.notifications enable row level security;

revoke all on public.profiles,public.prediction_markets,public.prediction_positions,public.prediction_resolutions,public.community_posts,public.community_comments,public.community_votes,public.watchlists,public.virtual_portfolios,public.virtual_transactions,public.research_articles,public.notifications from anon,authenticated;
grant select on public.prediction_markets,public.prediction_resolutions,public.research_articles to anon,authenticated;
grant select on public.prediction_positions to authenticated;
grant select,insert,update,delete on public.community_posts,public.community_comments,public.community_votes,public.watchlists to authenticated;
grant select on public.profiles to authenticated;
grant update(full_name) on public.profiles to authenticated;
grant select on public.virtual_portfolios,public.virtual_transactions,public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant insert,update,delete on public.prediction_markets,public.prediction_resolutions,public.research_articles to authenticated;

drop policy if exists profile_read_own on public.profiles;
create policy profile_read_own on public.profiles for select to authenticated using(id=auth.uid() or public.is_valtiera_admin());
drop policy if exists profile_update_own on public.profiles;
create policy profile_update_own on public.profiles for update to authenticated using(id=auth.uid() or public.is_valtiera_admin()) with check(id=auth.uid() or public.is_valtiera_admin());
drop policy if exists markets_read on public.prediction_markets;
create policy markets_read on public.prediction_markets for select to anon,authenticated using(status='open' or status='closed' or status='resolved' or public.is_valtiera_admin());
drop policy if exists markets_admin_write on public.prediction_markets;
create policy markets_admin_write on public.prediction_markets for all to authenticated using(public.is_valtiera_admin()) with check(public.is_valtiera_admin());
drop policy if exists positions_read_own on public.prediction_positions;
create policy positions_read_own on public.prediction_positions for select to authenticated using(user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists positions_create_own on public.prediction_positions;
create policy positions_create_own on public.prediction_positions for insert to authenticated with check(user_id=auth.uid());
drop policy if exists resolutions_read on public.prediction_resolutions;
create policy resolutions_read on public.prediction_resolutions for select to anon,authenticated using(true);
drop policy if exists resolutions_admin_write on public.prediction_resolutions;
create policy resolutions_admin_write on public.prediction_resolutions for all to authenticated using(public.is_valtiera_admin()) with check(public.is_valtiera_admin());

drop policy if exists posts_read_published on public.community_posts;
create policy posts_read_published on public.community_posts for select to anon,authenticated using(status='published' or user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists posts_create_own on public.community_posts;
create policy posts_create_own on public.community_posts for insert to authenticated with check(user_id=auth.uid() and status='published');
drop policy if exists posts_update_own on public.community_posts;
create policy posts_update_own on public.community_posts for update to authenticated using(user_id=auth.uid() or public.is_valtiera_admin()) with check(user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists posts_delete_own on public.community_posts;
create policy posts_delete_own on public.community_posts for delete to authenticated using(user_id=auth.uid() or public.is_valtiera_admin());

drop policy if exists comments_read_published on public.community_comments;
create policy comments_read_published on public.community_comments for select to anon,authenticated using(status='published' and exists(select 1 from public.community_posts p where p.id=post_id and p.status='published') or user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists comments_create_own on public.community_comments;
create policy comments_create_own on public.community_comments for insert to authenticated with check(user_id=auth.uid() and status='published' and exists(select 1 from public.community_posts p where p.id=post_id and p.status='published'));
drop policy if exists comments_update_own on public.community_comments;
create policy comments_update_own on public.community_comments for update to authenticated using(user_id=auth.uid() or public.is_valtiera_admin()) with check(user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists comments_delete_own on public.community_comments;
create policy comments_delete_own on public.community_comments for delete to authenticated using(user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists votes_read on public.community_votes;
create policy votes_read on public.community_votes for select to anon,authenticated using(true);
drop policy if exists votes_manage_own on public.community_votes;
create policy votes_manage_own on public.community_votes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

drop policy if exists watchlists_own on public.watchlists;
create policy watchlists_own on public.watchlists for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists portfolio_read_own on public.virtual_portfolios;
create policy portfolio_read_own on public.virtual_portfolios for select to authenticated using(user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists transactions_read_own on public.virtual_transactions;
create policy transactions_read_own on public.virtual_transactions for select to authenticated using(user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists articles_read_published on public.research_articles;
create policy articles_read_published on public.research_articles for select to anon,authenticated using(status='published' or public.is_valtiera_admin());
drop policy if exists articles_admin_manage on public.research_articles;
create policy articles_admin_manage on public.research_articles for all to authenticated using(public.is_valtiera_admin()) with check(public.is_valtiera_admin());
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications for select to authenticated using(user_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists notifications_read_own_update on public.notifications;
create policy notifications_read_own_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

insert into public.prediction_markets(id,question,category,yes_probability,virtual_activity,closes_at,description,resolution_criteria,resolution_source,status,is_illustrative) values
 ('btc-85','Will Bitcoin close above $85,000 on 31 December?','Crypto',58,12400,'2026-12-31T23:59:00Z','Illustrative virtual-credit question.','A verified UTC closing reference would be designated before launch.','A named market-data source would be required.','open',true),
 ('fed-cut','Will the Federal Reserve lower rates at its next meeting?','Macro',42,8900,'2026-12-18T23:59:00Z','Educational sample scenario.','An official Federal Reserve statement would determine the outcome.','Federal Reserve official release.','open',true),
 ('eth-btc','Will Ethereum outperform Bitcoin over the next 30 days?','Crypto',47,6100,'2026-12-20T23:59:00Z','Illustrative comparison only.','A pre-declared reference period and source would be required.','A named market-data source would be required.','open',true),
 ('nvda-200','Will NVDA trade above $200 before year-end?','Equities',36,4700,'2026-12-31T23:59:00Z','Sample equity scenario.','A pre-declared exchange and time window would be required.','A named market-data source would be required.','open',true)
on conflict(id) do nothing;

