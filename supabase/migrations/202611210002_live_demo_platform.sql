-- VALTIERA demo-first social research platform.
-- Demo personas and their activity are isolated from real-member tables and metrics.
create extension if not exists pgcrypto;

create table if not exists public.demo_personas (
  id text primary key,
  username text not null unique,
  bio text not null,
  interests text[] not null default '{}',
  avatar_url text not null,
  sample_followers integer not null default 0 check(sample_followers>=0),
  sample_following integer not null default 0 check(sample_following>=0),
  created_at timestamptz not null default now()
);
create table if not exists public.demo_posts (
  id text primary key,
  persona_id text not null references public.demo_personas(id) on delete cascade,
  title text not null check(char_length(title) between 4 and 220),
  body text not null check(char_length(body) between 10 and 8000),
  category text not null,
  sentiment text not null check(sentiment in ('Bullish','Bearish','Question')),
  tags text[] not null default '{}',
  sample_agree integer not null default 0 check(sample_agree>=0),
  sample_challenge integer not null default 0 check(sample_challenge>=0),
  created_at timestamptz not null default now()
);
create table if not exists public.demo_comments (
  id text primary key,
  post_id text not null references public.demo_posts(id) on delete cascade,
  persona_id text not null references public.demo_personas(id) on delete cascade,
  parent_comment_id text references public.demo_comments(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);
create table if not exists public.demo_member_post_votes (
  post_id text not null references public.demo_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null check(vote in ('agree','challenge')),
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
create table if not exists public.demo_member_comments (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.demo_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_comment_id text references public.demo_comments(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);
create table if not exists public.demo_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id text not null references public.demo_personas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,persona_id)
);
create table if not exists public.demo_saved_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null references public.demo_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,post_id)
);
alter table public.demo_saved_posts enable row level security;
revoke all on public.demo_saved_posts from anon,authenticated;
grant select,insert,delete on public.demo_saved_posts to authenticated;
drop policy if exists demo_saved_posts_own on public.demo_saved_posts;
create policy demo_saved_posts_own on public.demo_saved_posts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create table if not exists public.demo_polls (
  id text primary key,
  persona_id text not null references public.demo_personas(id) on delete cascade,
  title text not null check(char_length(title) between 8 and 220),
  description text not null default '',
  category text not null,
  options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 8),
  sample_counts integer[] not null,
  bullish_reasoning text not null default '',
  bearish_reasoning text not null default '',
  closes_at timestamptz not null,
  allow_vote_change boolean not null default true,
  status text not null default 'open' check(status in ('open','closed')),
  created_at timestamptz not null default now(),
  check(cardinality(sample_counts)=jsonb_array_length(options))
);
create table if not exists public.demo_poll_votes (
  poll_id text not null references public.demo_polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index smallint not null check(option_index>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(poll_id,user_id)
);
create table if not exists public.demo_poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null references public.demo_polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 2000),
  sentiment text not null default 'Question' check(sentiment in ('Bullish','Bearish','Question')),
  created_at timestamptz not null default now()
);
create table if not exists public.demo_prediction_scores (
  persona_id text primary key references public.demo_personas(id) on delete cascade,
  accuracy numeric(5,2) not null check(accuracy between 0 and 100),
  score integer not null check(score>=0),
  quality_contributions integer not null check(quality_contributions>=0),
  resolved_predictions integer not null check(resolved_predictions>=0),
  methodology text not null default 'Demo-only historical sample; not verified real-user performance.'
);
create table if not exists public.demo_portfolio_snapshots (
  persona_id text primary key references public.demo_personas(id) on delete cascade,
  sample_balance integer not null check(sample_balance>=0),
  sample_open_positions integer not null check(sample_open_positions>=0),
  sample_resolved_predictions integer not null check(sample_resolved_predictions>=0),
  sample_last_side text not null check(sample_last_side in ('YES','NO'))
);
alter table public.profiles add column if not exists leaderboard_opt_in boolean not null default false;
create table if not exists public.research_quality_reviews (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  quality_score smallint not null check(quality_score between 1 and 5),
  note text not null default '',
  created_at timestamptz not null default now(),
  primary key(post_id,reviewer_id)
);
alter table public.research_quality_reviews enable row level security;
grant select,insert,update,delete on public.research_quality_reviews to authenticated;
drop policy if exists research_quality_admin on public.research_quality_reviews;
create policy research_quality_admin on public.research_quality_reviews for all to authenticated using(public.is_valtiera_admin()) with check(public.is_valtiera_admin());
grant update(leaderboard_opt_in) on public.profiles to authenticated;
create table if not exists public.community_polls (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check(char_length(title) between 8 and 220),
  description text not null default '',
  category text not null,
  options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 8),
  closes_at timestamptz not null,
  allow_vote_change boolean not null default true,
  status text not null default 'open' check(status in ('open','closed')),
  created_at timestamptz not null default now(),
  check(closes_at>created_at)
);
create table if not exists public.community_poll_votes (
  poll_id uuid not null references public.community_polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  option_index smallint not null check(option_index>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(poll_id,user_id)
);
create table if not exists public.community_poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.community_polls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 2000),
  sentiment text not null default 'Question' check(sentiment in ('Bullish','Bearish','Question')),
  created_at timestamptz not null default now()
);

alter table public.demo_member_post_votes enable row level security;
alter table public.demo_member_comments enable row level security;
alter table public.demo_member_comments drop constraint if exists demo_member_comments_parent_comment_id_fkey;
alter table public.demo_follows enable row level security;
alter table public.demo_poll_votes enable row level security;
alter table public.demo_poll_comments enable row level security;
alter table public.community_polls enable row level security;
alter table public.community_poll_votes enable row level security;
alter table public.community_poll_comments enable row level security;
grant select on public.demo_personas,public.demo_posts,public.demo_comments,public.demo_polls,public.demo_prediction_scores to anon,authenticated;
grant select on public.demo_portfolio_snapshots to anon,authenticated;
grant select,insert,update,delete on public.demo_member_post_votes,public.demo_member_comments,public.demo_follows,public.demo_poll_votes,public.demo_poll_comments to authenticated;
grant select,insert,update,delete on public.community_polls,public.community_poll_votes,public.community_poll_comments to authenticated;
grant select on public.community_polls,public.community_poll_comments to anon;
drop policy if exists demo_vote_read on public.demo_member_post_votes;
create policy demo_vote_read on public.demo_member_post_votes for select to authenticated using(user_id=auth.uid());
drop policy if exists demo_vote_own on public.demo_member_post_votes;
create policy demo_vote_own on public.demo_member_post_votes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists demo_comment_read on public.demo_member_comments;
create policy demo_comment_read on public.demo_member_comments for select to authenticated using(true);
drop policy if exists demo_comment_insert_own on public.demo_member_comments;
create policy demo_comment_insert_own on public.demo_member_comments for insert to authenticated with check(user_id=auth.uid());
drop policy if exists demo_follows_read on public.demo_follows;
create policy demo_follows_read on public.demo_follows for select to authenticated using(user_id=auth.uid());
drop policy if exists demo_follows_own on public.demo_follows;
create policy demo_follows_own on public.demo_follows for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists demo_poll_votes_read on public.demo_poll_votes;
create policy demo_poll_votes_read on public.demo_poll_votes for select to authenticated using(true);
drop policy if exists demo_poll_vote_own on public.demo_poll_votes;
create policy demo_poll_vote_own on public.demo_poll_votes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists demo_poll_comment_read on public.demo_poll_comments;
create policy demo_poll_comment_read on public.demo_poll_comments for select to authenticated using(true);
drop policy if exists demo_poll_comment_insert_own on public.demo_poll_comments;
create policy demo_poll_comment_insert_own on public.demo_poll_comments for insert to authenticated with check(user_id=auth.uid());
drop policy if exists community_polls_read on public.community_polls;
create policy community_polls_read on public.community_polls for select to anon,authenticated using(status='open' or created_by=auth.uid() or public.is_valtiera_admin());
drop policy if exists community_polls_insert_own on public.community_polls;
create policy community_polls_insert_own on public.community_polls for insert to authenticated with check(created_by=auth.uid());
drop policy if exists community_polls_update_own on public.community_polls;
create policy community_polls_update_own on public.community_polls for update to authenticated using(created_by=auth.uid() or public.is_valtiera_admin()) with check(created_by=auth.uid() or public.is_valtiera_admin());
drop policy if exists community_poll_votes_read_own on public.community_poll_votes;
create policy community_poll_votes_read_own on public.community_poll_votes for select to authenticated using(user_id=auth.uid());
drop policy if exists community_poll_comments_read on public.community_poll_comments;
create policy community_poll_comments_read on public.community_poll_comments for select to anon,authenticated using(exists(select 1 from public.community_polls p where p.id=poll_id and p.status='open'));
drop policy if exists community_poll_comments_insert_own on public.community_poll_comments;
create policy community_poll_comments_insert_own on public.community_poll_comments for insert to authenticated with check(user_id=auth.uid());

create or replace function public.cast_demo_poll_vote(p_poll_id text,p_option_index smallint)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare uid uuid:=auth.uid(); p public.demo_polls; old_option smallint;
begin
  if uid is null then raise exception 'Sign in to save a member poll vote.' using errcode='28000'; end if;
  select * into p from public.demo_polls where id=p_poll_id for update;
  if not found or p.status<>'open' or p.closes_at<=now() then raise exception 'This demo poll is closed.' using errcode='22023'; end if;
  if p_option_index<0 or p_option_index>=jsonb_array_length(p.options) then raise exception 'Choose a valid poll option.' using errcode='22023'; end if;
  select option_index into old_option from public.demo_poll_votes where poll_id=p_poll_id and user_id=uid;
  if old_option is not null and not p.allow_vote_change and old_option<>p_option_index then raise exception 'Vote changes are closed.' using errcode='22023'; end if;
  insert into public.demo_poll_votes(poll_id,user_id,option_index) values(p_poll_id,uid,p_option_index)
  on conflict(poll_id,user_id) do update set option_index=excluded.option_index,updated_at=now();
  return jsonb_build_object('poll_id',p_poll_id,'option_index',p_option_index);
end; $$;
revoke all on function public.cast_demo_poll_vote(text,smallint) from public,anon;
grant execute on function public.cast_demo_poll_vote(text,smallint) to authenticated;

create or replace function public.cast_community_poll_vote(p_poll_id uuid,p_option_index smallint)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare uid uuid:=auth.uid(); p public.community_polls; old_option smallint;
begin
  if uid is null then raise exception 'Sign in to vote in this poll.' using errcode='28000'; end if;
  select * into p from public.community_polls where id=p_poll_id and status='open' and closes_at>now() for update;
  if not found then raise exception 'This poll is closed.' using errcode='22023'; end if;
  if p_option_index<0 or p_option_index>=jsonb_array_length(p.options) then raise exception 'Choose a valid poll option.' using errcode='22023'; end if;
  select option_index into old_option from public.community_poll_votes where poll_id=p_poll_id and user_id=uid;
  if old_option is not null and not p.allow_vote_change and old_option<>p_option_index then raise exception 'Vote changes are not allowed for this poll.' using errcode='22023'; end if;
  insert into public.community_poll_votes(poll_id,user_id,option_index) values(p_poll_id,uid,p_option_index)
  on conflict(poll_id,user_id) do update set option_index=excluded.option_index,updated_at=now();
  return jsonb_build_object('poll_id',p_poll_id,'option_index',p_option_index);
end; $$;
revoke all on function public.cast_community_poll_vote(uuid,smallint) from public,anon;
grant execute on function public.cast_community_poll_vote(uuid,smallint) to authenticated;

create or replace function public.get_community_poll_results(p_poll_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare opts jsonb; counts integer[]; participants integer;
begin
  select options into opts from public.community_polls where id=p_poll_id and status='open';
  if opts is null then return null; end if;
  select array_agg(coalesce(v.n,0) order by o.i),coalesce(sum(v.n),0)::integer into counts,participants
  from jsonb_array_elements(opts) with ordinality o(value,i)
  left join (select option_index,count(*)::integer n from public.community_poll_votes where poll_id=p_poll_id group by option_index) v on v.option_index=o.i-1;
  return jsonb_build_object('counts',counts,'participants',participants);
end; $$;
revoke all on function public.get_community_poll_results(uuid) from public;
grant execute on function public.get_community_poll_results(uuid) to anon,authenticated;

create or replace function public.get_member_prediction_leaderboard()
returns table(username text,accuracy numeric,score integer,quality_contributions integer,resolved_predictions integer)
language sql stable security definer set search_path=public,auth as $$
  with settled as (
    select pp.user_id,count(*)::integer n,
      avg(case when pp.side=pr.outcome then 1.0 else 0.0 end)*100 accuracy,
      avg(power(pp.probability_at_entry/100.0-case when pp.side=pr.outcome then 1.0 else 0.0 end,2)) brier
    from public.prediction_positions pp join public.prediction_resolutions pr on pr.market_id=pp.market_id
    where pp.settled_at is not null and pr.outcome in ('YES','NO')
    group by pp.user_id having count(*)>=3
  ), reviews as (
    select p.user_id,sum(r.quality_score)::integer quality
    from public.research_quality_reviews r join public.community_posts p on p.id=r.post_id group by p.user_id
  )
  select pr.username,s.accuracy::numeric(5,2),least(1000,round((1-s.brier)*950+coalesce(rv.quality,0)*5)::integer),coalesce(rv.quality,0),s.n
  from settled s join public.profiles pr on pr.id=s.user_id left join reviews rv on rv.user_id=s.user_id
  where pr.leaderboard_opt_in and pr.username is not null
  order by 3 desc,s.accuracy desc limit 100;
$$;
revoke all on function public.get_member_prediction_leaderboard() from public;
grant execute on function public.get_member_prediction_leaderboard() to anon,authenticated;

insert into public.demo_personas(id,username,bio,interests,avatar_url,sample_followers,sample_following) values
('demo-quantwolf','QuantWolf','Tests ideas out of sample and watches for regime change.',array['Systematic strategies','Volatility','Equities'],'https://api.dicebear.com/9.x/notionists/svg?seed=QuantWolf&backgroundColor=e8eee8',842,188),
('demo-bulltrader','BullTrader','Momentum-focused; wants price and flow confirmation before adding risk.',array['Momentum','Technology','Bitcoin'],'https://api.dicebear.com/9.x/notionists/svg?seed=BullTrader&backgroundColor=e8eee8',1260,241),
('demo-bearmind','BearMind','Looks for crowded positioning, fragile funding, and overlooked downside.',array['Rates','Credit','Risk'],'https://api.dicebear.com/9.x/notionists/svg?seed=BearMind&backgroundColor=e8eee8',735,169),
('demo-cryptooracle','CryptoOracle','Tracks on-chain activity while questioning token value capture.',array['Bitcoin','Ethereum','On-chain data'],'https://api.dicebear.com/9.x/notionists/svg?seed=CryptoOracle&backgroundColor=e8eee8',1104,205),
('demo-macrovision','MacroVision','Connects inflation, labour data, and central-bank policy.',array['Central banks','FX','Rates'],'https://api.dicebear.com/9.x/notionists/svg?seed=MacroVision&backgroundColor=e8eee8',688,152),
('demo-optionsedge','OptionsEdge','Studies skew and term structure; prefers defined risk.',array['Options','Volatility','Index hedges'],'https://api.dicebear.com/9.x/notionists/svg?seed=OptionsEdge&backgroundColor=e8eee8',529,143),
('demo-chainanalyst','ChainAnalyst','Separates network usage from token price and protocol risk.',array['Ethereum','DeFi','Data'],'https://api.dicebear.com/9.x/notionists/svg?seed=ChainAnalyst&backgroundColor=e8eee8',471,127),
('demo-valuehunter','ValueHunter','Prefers durable cash flows, strong balance sheets, and a margin of safety.',array['Value','Quality','Industrials'],'https://api.dicebear.com/9.x/notionists/svg?seed=ValueHunter&backgroundColor=e8eee8',923,174),
('demo-riskfirst','RiskFirst','Starts with sizing, correlation, and thesis invalidation.',array['Risk','Portfolio design','Volatility'],'https://api.dicebear.com/9.x/notionists/svg?seed=RiskFirst&backgroundColor=e8eee8',612,166),
('demo-marketpulse','MarketPulse','Summarizes cross-asset moves and asks what changed.',array['Global markets','Commodities','News'],'https://api.dicebear.com/9.x/notionists/svg?seed=MarketPulse&backgroundColor=e8eee8',1503,304),
('demo-alphaseeker','AlphaSeeker','Looks for durable growth while treating valuation as part of the thesis.',array['Growth','Semiconductors','Software'],'https://api.dicebear.com/9.x/notionists/svg?seed=AlphaSeeker&backgroundColor=e8eee8',804,213),
('demo-defiexplorer','DeFiExplorer','Examines liquidity, incentives, and smart-contract risk.',array['DeFi','Ethereum','Liquidity'],'https://api.dicebear.com/9.x/notionists/svg?seed=DeFiExplorer&backgroundColor=e8eee8',396,110),
('demo-chartmaster','ChartMaster','Uses market structure as a framework, not a promise.',array['Price action','Futures','BTC'],'https://api.dicebear.com/9.x/notionists/svg?seed=ChartMaster&backgroundColor=e8eee8',961,198),
('demo-contrarianx','ContrarianX','Challenges consensus when evidence supports it, and changes view when it does not.',array['Sentiment','Small caps','Macro'],'https://api.dicebear.com/9.x/notionists/svg?seed=ContrarianX&backgroundColor=e8eee8',558,160),
('demo-newinvestor','NewInvestor','Learning the basics and prefers clear explanations over confident calls.',array['Index funds','Basics','Long-term investing'],'https://api.dicebear.com/9.x/notionists/svg?seed=NewInvestor&backgroundColor=e8eee8',203,86)
on conflict(id) do update set username=excluded.username,bio=excluded.bio,interests=excluded.interests,avatar_url=excluded.avatar_url,sample_followers=excluded.sample_followers,sample_following=excluded.sample_following;

insert into public.demo_posts(id,persona_id,title,body,category,sentiment,tags,sample_agree,sample_challenge,created_at) values
('demo-post-1','demo-quantwolf','Does BTC’s current strength survive a quieter ETF week?','Spot demand has mattered, but I would not extrapolate one week of flows. I’m watching whether price holds its prior breakout if inflows flatten. What would change your view?','Crypto','Question',array['BTC','flows','levels'],18,8,now()-interval '8 minutes'),
('demo-post-2','demo-bulltrader','NVIDIA: strong business, difficult entry point?','The demand story is real. The harder question is how much future growth is already in the price. I’m constructive on the company and much less certain about the next six months of returns.','Stocks','Bullish',array['NVDA','valuation','semiconductors'],25,12,now()-interval '12 minutes'),
('demo-post-3','demo-bearmind','The soft-landing trade has become crowded','A benign inflation print is not the same thing as a durable regime. Credit spreads and short-dated volatility look more relaxed than the uncertainty around fiscal and labour data suggests.','Macro','Bearish',array['rates','credit','positioning'],9,17,now()-interval '18 minutes'),
('demo-post-4','demo-cryptooracle','On-chain activity is not a price target','Active addresses and fees can tell us something about usage. They cannot, on their own, tell us what a token should be worth. I’d like to see a cleaner link between demand and value capture.','Crypto','Question',array['ETH','on-chain','fundamentals'],16,9,now()-interval '24 minutes'),
('demo-post-5','demo-macrovision','How are you separating policy expectations from the data?','I’m tracking the distribution of inflation surprises, not just the headline. A single CPI print can move the front end without changing the medium-term path.','Forex','Question',array['USD','inflation','central banks'],11,6,now()-interval '31 minutes'),
('demo-post-6','demo-optionsedge','Short-dated options are cheap until they aren’t','Implied volatility looks low against recent realized moves, but that does not make a long-vol trade automatically attractive. Carry, event timing, and skew all matter.','Futures & Options','Bullish',array['options','volatility','SPX'],20,14,now()-interval '38 minutes'),
('demo-post-7','demo-chainanalyst','Protocol growth needs a security discount','A jump in DeFi deposits is encouraging, but bridges and concentrated governance remain material risks. I would rather underwrite sustainable fee capture than TVL alone.','Crypto','Bearish',array['DeFi','security','ETH'],7,13,now()-interval '45 minutes'),
('demo-post-8','demo-valuehunter','Quality at a fair price beats a perfect story','I’m comparing free-cash-flow durability and reinvestment runway, not just the fastest-growing line item. A great business bought at any price can still be a poor investment.','Stocks','Bullish',array['quality','valuation','long-term'],19,7,now()-interval '52 minutes'),
('demo-post-9','demo-riskfirst','Correlation spikes are the portfolio event','Our single-asset risk numbers look normal. The stress case is that equity, credit, and crypto correlations rise together while liquidity thins. How are others sizing that tail?','Risk Management','Question',array['correlation','drawdown','liquidity'],13,18,now()-interval '1 hour'),
('demo-post-10','demo-marketpulse','Oil is reacting to supply headlines again','The first move is visible; the second-order effect on breakevens and freight is less clear. I’m waiting for confirmation in the curve instead of treating the spot print as a macro signal.','Futures & Options','Question',array['crude','curve','commodities'],10,11,now()-interval '2 hours'),
('demo-post-11','demo-alphaseeker','AI capex is broadening beyond chip designers','The opportunity may be spreading to networking and power, but the return on that investment is still uncertain. I want to see customer economics catch up with supplier guidance.','Stocks','Bullish',array['AI','capex','infrastructure'],22,10,now()-interval '2 hours'),
('demo-post-12','demo-defiexplorer','DeFi yields: how much is organic revenue?','Some headline rates still blend fees with token incentives. I separate recurring user-paid revenue from emissions, then haircut for contract and oracle risk.','Crypto','Question',array['DeFi','yield','protocol risk'],12,15,now()-interval '3 hours'),
('demo-post-13','demo-chartmaster','A breakout is a level, not a thesis','The range break matters if participation expands and the retest holds. If volume fades, I’m happy to call it a failed auction and step aside.','Futures & Options','Bullish',array['technical analysis','volume','NQ'],17,12,now()-interval '4 hours'),
('demo-post-14','demo-contrarianx','Consensus says “defensive” — what if duration is the risk?','Utilities can diversify earnings but not necessarily the duration embedded in a high multiple. The label is not a hedge; I’m checking rate sensitivity and balance sheets.','Stocks','Bearish',array['consensus','rates','sector'],8,20,now()-interval '5 hours'),
('demo-post-15','demo-newinvestor','What should a first-time investor learn before picking stocks?','I understand the basics of an index fund, but I’m not sure how to think about risk or fees. What’s one concept you wish you had learned earlier?','General Market Discussion','Question',array['beginner','diversification','fees'],6,3,now()-interval '6 hours')
on conflict(id) do update set title=excluded.title,body=excluded.body,category=excluded.category,sentiment=excluded.sentiment,tags=excluded.tags,sample_agree=excluded.sample_agree,sample_challenge=excluded.sample_challenge;

insert into public.demo_polls(id,persona_id,title,description,category,options,sample_counts,bullish_reasoning,bearish_reasoning,closes_at) values
('poll-btc-eth','demo-quantwolf','Bitcoin or Ethereum for a diversified digital-asset thesis?','Which has the stronger risk-adjusted case over the next quarter? Consider adoption, valuation, and downside risk.','Crypto','["Bitcoin","Ethereum","Neither / wait"]',array[84,61,29],'BTC has deeper liquidity and a simpler supply thesis; ETH has a broader application layer.','Both remain highly correlated to global liquidity and can draw down sharply.',now()+interval '7 days'),
('poll-nvda','demo-alphaseeker','Bullish or bearish on NVIDIA at current levels?','Separate the company outlook from the return implied by today’s valuation.','Stocks','["Bullish","Neutral","Bearish"]',array[58,49,42],'Demand and ecosystem depth can sustain a long runway.','Expectations, customer concentration, and capex returns leave little room for error.',now()+interval '5 days'),
('poll-sector','demo-macrovision','Which sector may hold up best next quarter?','Pick the sector whose fundamentals and valuation look most resilient across scenarios.','Macro','["Healthcare","Industrials","Technology","Energy"]',array[43,35,51,28],'Different sectors offer distinct earnings drivers; the case depends on the macro path.','Sector labels conceal company-level dispersion and can create false diversification.',now()+interval '10 days'),
('poll-gold','demo-riskfirst','Increase, hold, or reduce gold exposure?','Discuss the hedge thesis alongside real rates, the dollar, and portfolio concentration.','Commodities','["Increase","Hold","Reduce"]',array[47,62,21],'Gold can diversify policy and geopolitical risk when sized deliberately.','It has no cash flow and can struggle when real yields rise.',now()+interval '8 days'),
('poll-risk','demo-contrarianx','Which asset has the strongest risk-adjusted opportunity?','Choose a research starting point, not a trade recommendation.','Cross-asset','["Short-duration bonds","Broad equities","Gold","Cash"]',array[38,45,31,26],'There are plausible cases for all four under different inflation and growth paths.','Without horizon and liability context, a single cross-asset winner is misleading.',now()+interval '12 days')
on conflict(id) do update set title=excluded.title,description=excluded.description,options=excluded.options,sample_counts=excluded.sample_counts,bullish_reasoning=excluded.bullish_reasoning,bearish_reasoning=excluded.bearish_reasoning,closes_at=excluded.closes_at;

insert into public.demo_prediction_scores(persona_id,accuracy,score,quality_contributions,resolved_predictions) values
('demo-riskfirst',71,842,8,17),('demo-quantwolf',68,798,14,22),('demo-macrovision',65,744,10,20),('demo-contrarianx',63,701,7,19),('demo-optionsedge',61,665,9,18),('demo-valuehunter',60,629,8,16),('demo-marketpulse',58,608,6,17),('demo-chartmaster',57,584,11,21),('demo-alphaseeker',56,558,12,21),('demo-bearmind',55,531,9,16),('demo-chainanalyst',54,503,7,13),('demo-cryptooracle',53,479,6,15),('demo-defiexplorer',51,452,8,13),('demo-bulltrader',49,415,5,14),('demo-newinvestor',45,386,4,11)
on conflict(persona_id) do update set accuracy=excluded.accuracy,score=excluded.score,quality_contributions=excluded.quality_contributions,resolved_predictions=excluded.resolved_predictions;
insert into public.demo_portfolio_snapshots(persona_id,sample_balance,sample_open_positions,sample_resolved_predictions,sample_last_side) values
('demo-quantwolf',11620,3,27,'NO'),('demo-bulltrader',8950,2,12,'NO'),('demo-bearmind',9280,2,18,'NO'),('demo-cryptooracle',8150,2,12,'NO'),('demo-macrovision',9820,1,24,'YES'),('demo-optionsedge',9410,2,20,'YES'),('demo-chainanalyst',10260,1,13,'YES'),('demo-valuehunter',10120,2,19,'NO'),('demo-riskfirst',10480,2,30,'YES'),('demo-marketpulse',8760,2,17,'YES'),('demo-alphaseeker',10950,1,15,'NO'),('demo-defiexplorer',9660,2,14,'YES'),('demo-chartmaster',11300,1,16,'YES'),('demo-contrarianx',10875,2,22,'NO'),('demo-newinvestor',10430,1,8,'YES')
on conflict(persona_id) do update set sample_balance=excluded.sample_balance,sample_open_positions=excluded.sample_open_positions,sample_resolved_predictions=excluded.sample_resolved_predictions,sample_last_side=excluded.sample_last_side;

-- Restore an educational-only credit ledger for demo prediction mechanics. Credits have no cash value.
alter table public.prediction_markets add column if not exists is_demo boolean not null default false;
alter table public.prediction_markets add column if not exists participant_count integer not null default 0 check(participant_count>=0);
alter table public.prediction_markets add column if not exists probability_history jsonb not null default '[]';
update public.prediction_markets set is_demo=true where is_illustrative=true;
create table if not exists public.prediction_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market_id text not null references public.prediction_markets(id) on delete cascade,
  side text not null check(side in ('YES','NO')),
  virtual_credits integer not null check(virtual_credits>0),
  probability_at_entry numeric(5,2) not null default 50 check(probability_at_entry between 1 and 99),
  potential_payout integer not null default 0 check(potential_payout>=0),
  payout integer not null default 0 check(payout>=0),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index if not exists prediction_positions_user_created_idx on public.prediction_positions(user_id,created_at desc);
create index if not exists prediction_positions_market_idx on public.prediction_positions(market_id);
alter table public.prediction_positions enable row level security;
revoke all on public.prediction_positions from anon,authenticated;
grant select on public.prediction_positions to authenticated;
drop policy if exists prediction_positions_read_own on public.prediction_positions;
create policy prediction_positions_read_own on public.prediction_positions for select to authenticated using(user_id=auth.uid());
alter table public.prediction_positions add column if not exists probability_at_entry numeric(5,2) not null default 50 check(probability_at_entry between 1 and 99);
alter table public.prediction_positions add column if not exists potential_payout integer not null default 0 check(potential_payout>=0);
alter table public.prediction_positions add column if not exists payout integer not null default 0 check(payout>=0);
alter table public.prediction_positions add column if not exists settled_at timestamptz;

create table if not exists public.virtual_portfolios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 10000 check(balance>=0),
  starting_balance integer not null default 10000 check(starting_balance>0),
  updated_at timestamptz not null default now()
);
create table if not exists public.virtual_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check(transaction_type in ('initial_grant','prediction_allocation','prediction_payout','correction')),
  amount integer not null check(amount>0),
  market_id text references public.prediction_markets(id) on delete set null,
  position_id uuid references public.prediction_positions(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists virtual_transactions_user_created_idx on public.virtual_transactions(user_id,created_at desc);
create table if not exists public.demo_prediction_positions (
  id text primary key,
  persona_id text not null references public.demo_personas(id) on delete cascade,
  market_id text not null references public.prediction_markets(id) on delete cascade,
  side text not null check(side in ('YES','NO')),
  sample_credits integer not null check(sample_credits>0),
  status text not null default 'open' check(status in ('open','won','lost','void')),
  created_at timestamptz not null default now()
);
insert into public.demo_prediction_positions(id,persona_id,market_id,side,sample_credits) values
('sample-risk-btc','demo-riskfirst','btc-85','NO',420),('sample-quant-fed','demo-quantwolf','fed-cut','NO',300),('sample-bull-eth','demo-bulltrader','eth-btc','YES',250),('sample-bear-nvda','demo-bearmind','nvda-200','NO',375),('sample-oracle-btc','demo-cryptooracle','btc-85','YES',200),('sample-macro-fed','demo-macrovision','fed-cut','YES',280),('sample-options-nvda','demo-optionsedge','nvda-200','NO',180),('sample-chart-eth','demo-chartmaster','eth-btc','YES',150)
on conflict(id) do nothing;

alter table public.virtual_portfolios enable row level security;
alter table public.virtual_transactions enable row level security;
alter table public.demo_prediction_positions enable row level security;
revoke all on public.virtual_portfolios,public.virtual_transactions from anon,authenticated;
grant select on public.virtual_portfolios,public.virtual_transactions to authenticated;
grant select on public.demo_prediction_positions to anon,authenticated;
drop policy if exists virtual_portfolio_read_own on public.virtual_portfolios;
create policy virtual_portfolio_read_own on public.virtual_portfolios for select to authenticated using(user_id=auth.uid());
drop policy if exists virtual_transactions_read_own on public.virtual_transactions;
create policy virtual_transactions_read_own on public.virtual_transactions for select to authenticated using(user_id=auth.uid());
drop policy if exists demo_prediction_positions_read on public.demo_prediction_positions;
create policy demo_prediction_positions_read on public.demo_prediction_positions for select to anon,authenticated using(true);

-- New and existing accounts receive one non-transferable practice grant.
create or replace function public.handle_new_valtiera_user()
returns trigger language plpgsql security definer set search_path=public,auth as $$
begin
  insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing;
  insert into public.virtual_portfolios(user_id,balance,starting_balance) values(new.id,10000,10000) on conflict(user_id) do nothing;
  if found then
    insert into public.virtual_transactions(user_id,transaction_type,amount,note) values(new.id,'initial_grant',10000,'Demo credits only · non-purchasable · non-transferable · no cash value');
  end if;
  return new;
end; $$;
with new_portfolios as (
  insert into public.virtual_portfolios(user_id,balance,starting_balance)
  select p.id,10000,10000 from public.profiles p
  on conflict(user_id) do nothing returning user_id
)
insert into public.virtual_transactions(user_id,transaction_type,amount,note)
select user_id,'initial_grant',10000,'Demo credits only · non-purchasable · non-transferable · no cash value' from new_portfolios;

create or replace function public.place_virtual_prediction(p_market_id text,p_side text,p_amount integer)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare uid uuid:=auth.uid(); market_row public.prediction_markets; pos public.prediction_positions; remaining integer; price numeric; payout integer;
begin
  if uid is null then raise exception 'Sign in to save practice positions.' using errcode='28000'; end if;
  if p_side not in ('YES','NO') or p_amount is null or p_amount<1 or p_amount>5000 then raise exception 'Choose a side and allocate between 1 and 5,000 credits.' using errcode='22023'; end if;
  select * into market_row from public.prediction_markets where id=p_market_id and status='open' and (is_demo or public.is_valtiera_admin()) for update;
  if not found then raise exception 'This practice market is not open.' using errcode='22023'; end if;
  if market_row.closes_at is not null and market_row.closes_at<=now() then raise exception 'This market has closed.' using errcode='22023'; end if;
  price:=case when p_side='YES' then market_row.yes_probability else 100-market_row.yes_probability end;
  if price<1 or price>99 then raise exception 'Market probability is outside the supported range.' using errcode='22023'; end if;
  payout:=floor(p_amount*100/price)::integer;
  update public.virtual_portfolios set balance=balance-p_amount,updated_at=now() where user_id=uid and balance>=p_amount returning balance into remaining;
  if remaining is null then raise exception 'Not enough practice credits.' using errcode='22023'; end if;
  insert into public.prediction_positions(user_id,market_id,side,virtual_credits,probability_at_entry,potential_payout)
  values(uid,p_market_id,p_side,p_amount,price,payout) returning * into pos;
  insert into public.virtual_transactions(user_id,transaction_type,amount,market_id,position_id,note)
  values(uid,'prediction_allocation',p_amount,p_market_id,pos.id,format('Practice allocation · %s · %s credits',p_side,p_amount));
  update public.prediction_markets set virtual_activity=virtual_activity+p_amount,participant_count=(select count(distinct user_id)::integer from public.prediction_positions where market_id=p_market_id) where id=p_market_id;
  return jsonb_build_object('position_id',pos.id,'remaining_credits',remaining,'potential_payout',payout);
end; $$;
revoke all on function public.place_virtual_prediction(text,text,integer) from public,anon;
grant execute on function public.place_virtual_prediction(text,text,integer) to authenticated;

create or replace function public.resolve_virtual_prediction_market(p_market_id text,p_outcome text,p_note text,p_source_url text)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare uid uuid:=auth.uid(); market_row public.prediction_markets; pos record; payout integer:=0; winners integer:=0; losers integer:=0; total_payout bigint:=0;
begin
  if uid is null or not public.is_valtiera_admin() then raise exception 'Moderator access required.' using errcode='42501'; end if;
  if p_outcome not in ('YES','NO','VOID') or char_length(coalesce(trim(p_note),''))<12 or coalesce(trim(p_source_url),'')='' then raise exception 'Provide a valid outcome, resolution note, and source URL.' using errcode='22023'; end if;
  select * into market_row from public.prediction_markets where id=p_market_id and status in ('open','closed') for update;
  if not found then raise exception 'Market is already resolved or unavailable.' using errcode='22023'; end if;
  insert into public.prediction_resolutions(market_id,outcome,resolution_note,source_url,resolved_by) values(p_market_id,p_outcome,p_note,p_source_url,uid);
  update public.prediction_markets set status='resolved' where id=p_market_id;
  for pos in select * from public.prediction_positions where market_id=p_market_id and settled_at is null for update loop
    if p_outcome='VOID' then payout:=pos.virtual_credits;
    elsif pos.side=p_outcome then payout:=pos.potential_payout; winners:=winners+1;
    else payout:=0; losers:=losers+1; end if;
    update public.prediction_positions set payout=payout,settled_at=now() where id=pos.id;
    if payout>0 then
      update public.virtual_portfolios set balance=balance+payout,updated_at=now() where user_id=pos.user_id;
      insert into public.virtual_transactions(user_id,transaction_type,amount,market_id,position_id,note) values(pos.user_id,'prediction_payout',payout,p_market_id,pos.id,case when p_outcome='VOID' then 'Voided practice position returned' else 'Resolved practice prediction payout' end);
      total_payout:=total_payout+payout;
    end if;
  end loop;
  return jsonb_build_object('status','resolved','winning_positions',winners,'losing_positions',losers,'credits_paid',total_payout);
end; $$;
revoke all on function public.resolve_virtual_prediction_market(text,text,text,text) from public,anon;
grant execute on function public.resolve_virtual_prediction_market(text,text,text,text) to authenticated;

-- Include live member responses in realtime where the Supabase publication is available.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='demo_poll_votes') then alter publication supabase_realtime add table public.demo_poll_votes; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='demo_member_post_votes') then alter publication supabase_realtime add table public.demo_member_post_votes; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_poll_votes') then alter publication supabase_realtime add table public.community_poll_votes; end if;
  end if;
end $$;


-- Extend the first Academy lesson with the selected locally supplied video.
alter table public.lessons add column if not exists source_url text;
alter table public.lessons add column if not exists source_attribution text;
update public.courses
set title='Trading Strategy Case Studies',
    description='Instructor-led market strategy lessons with explicit discussion of assumptions, sizing, and risk.',
    category='Trading Strategies',
    thumbnail_url='https://img.youtube.com/vi/TQVMBcv13oQ/hqdefault.jpg',
    status='published'
where slug='mit-mathematics-finance';
update public.lessons l
set title='The Trading Strategy That Can Be WRONG and Still WIN',
    description='Trade with Pat demonstrates a multi-entry grid strategy and explains how position sizing can affect outcomes. The lesson also discusses risk; the video is educational content, not investment advice.',
    video_url='https://www.youtube-nocookie.com/embed/TQVMBcv13oQ',
    duration_seconds=700,
    source_url='https://www.youtube.com/watch?v=TQVMBcv13oQ',
    source_attribution='Trade with Pat',
    sort_order=1
from public.courses c
where l.course_id=c.id and c.slug='mit-mathematics-finance' and l.sort_order=1;

-- Add missing sample markets referenced by the demo positions and client fixture.
insert into public.prediction_markets(id,question,category,yes_probability,virtual_activity,closes_at,description,resolution_criteria,resolution_source,status,is_illustrative)
values
 ('gold-3k','Will gold reach $3,000 per ounce by year-end?','Commodities',31,3200,'2026-12-31T23:59:00Z','Demo-only scenario using a transparent, pre-declared resolution threshold.','Resolve YES if the chosen spot gold reference prints at or above $3,000/oz before 31 Dec 2026 23:59 UTC. Record source and timestamp.','Source to be designated by a moderator before settlement.','open',true),
 ('btc-100','Will BTC close above $100,000 by 31 March 2027?','Crypto',44,2800,'2027-03-31T23:59:00Z','A longer-horizon demo market. Probability path is illustrative and not market-derived.','Resolve YES if BTC/USD reference close is at or above $100,000 on 31 Mar 2027 at 23:59 UTC. Attach the reference source.','Moderator source citation required.','open',true)
on conflict(id) do nothing;
update public.prediction_markets set is_demo=true where id in ('btc-85','fed-cut','eth-btc','nvda-200','gold-3k','btc-100');

-- Each demo persona has clearly labeled sample prediction history, isolated from member ledgers.
insert into public.demo_prediction_positions(id,persona_id,market_id,side,sample_credits) values
('sample-value-gold','demo-valuehunter','gold-3k','YES',225),
('sample-pulse-btc-long','demo-marketpulse','btc-100','YES',160),
('sample-alpha-nvda','demo-alphaseeker','nvda-200','YES',310),
('sample-defi-eth','demo-defiexplorer','eth-btc','NO',190),
('sample-contrarian-gold','demo-contrarianx','gold-3k','NO',260),
('sample-newinvestor-fed','demo-newinvestor','fed-cut','YES',80),
('sample-chain-btc','demo-chainanalyst','btc-100','NO',175)
on conflict(id) do nothing;

-- Seed mixed demo replies so the database-backed sample has visible disagreement.
insert into public.demo_comments(id,post_id,persona_id,body,created_at) values
('demo-comment-seed-01','demo-post-1','demo-bearmind','Flows matter, but I would want to see leverage cool before calling this a durable breakout.',now()-interval '7 minutes'),
('demo-comment-seed-02','demo-post-1','demo-bulltrader','I disagree on waiting for leverage: spot demand can absorb a lot if the level holds.',now()-interval '5 minutes'),
('demo-comment-seed-03','demo-post-2','demo-valuehunter','Strong business, but the multiple leaves little room for slower capex payback.',now()-interval '10 minutes'),
('demo-comment-seed-04','demo-post-2','demo-alphaseeker','Customer demand is broadening. I would track returns on deployed capacity over the next few quarters.',now()-interval '8 minutes'),
('demo-comment-seed-05','demo-post-3','demo-macrovision','The distribution of inflation outcomes is still wide; one benign print does not settle the policy path.',now()-interval '12 minutes'),
('demo-comment-seed-06','demo-post-3','demo-contrarianx','Crowding is a risk, but the consensus may already be hedged. Positioning data would help.',now()-interval '9 minutes'),
('demo-comment-seed-07','demo-post-4','demo-chainanalyst','Fee capture and security-adjusted activity are better evidence than active addresses alone.',now()-interval '15 minutes'),
('demo-comment-seed-08','demo-post-4','demo-cryptooracle','Agreed on value capture, though on-chain metrics can still help distinguish real use from incentives.',now()-interval '13 minutes'),
('demo-comment-seed-09','demo-post-6','demo-riskfirst','Cheap volatility can still be expensive if the position is too large or the catalyst is mis-timed.',now()-interval '20 minutes'),
('demo-comment-seed-10','demo-post-6','demo-optionsedge','Exactly. Term structure and skew change the carry; realized-versus-implied is only a starting point.',now()-interval '18 minutes'),
('demo-comment-seed-11','demo-post-7','demo-defiexplorer','Liquidity incentives can inflate deposits quickly. I would haircut anything that depends on a temporary reward.',now()-interval '23 minutes'),
('demo-comment-seed-12','demo-post-7','demo-chainanalyst','Bridge exposure deserves a separate risk budget; protocol TVL does not capture that tail.',now()-interval '21 minutes'),
('demo-comment-seed-13','demo-post-9','demo-chartmaster','The same level can behave differently when depth disappears. I watch spread and open interest together.',now()-interval '27 minutes'),
('demo-comment-seed-14','demo-post-9','demo-riskfirst','That is why I stress cross-asset correlation instead of assuming historical diversification persists.',now()-interval '25 minutes'),
('demo-comment-seed-15','demo-post-15','demo-newinvestor','I am starting with fees and diversification before choosing individual stocks.',now()-interval '30 minutes')
on conflict(id) do nothing;

