-- Persistent community, messaging, research, and learning features.
-- Virtual portfolio tables remain removed per the product decision to remove virtual money.
create extension if not exists pgcrypto;

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists show_last_seen boolean not null default true;
create unique index if not exists profiles_username_unique on public.profiles(lower(username)) where username is not null;

alter table public.community_posts add column if not exists category text not null default 'General Market Discussion';
alter table public.community_posts add column if not exists tags text[] not null default '{}';
alter table public.community_posts add column if not exists image_path text;
alter table public.community_comments add column if not exists parent_comment_id uuid references public.community_comments(id) on delete cascade;
create index if not exists community_comments_parent_idx on public.community_comments(parent_comment_id,created_at);

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id,followed_id),
  check(follower_id<>followed_id)
);
create table if not exists public.saved_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,post_id)
);
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  reason text not null check(char_length(reason) between 3 and 1200),
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  check(num_nonnulls(reported_user_id,post_id,comment_id)=1)
);
grant update(status) on public.content_reports to authenticated;
drop policy if exists reports_moderator_update on public.content_reports;
create policy reports_moderator_update on public.content_reports for update to authenticated using(public.is_valtiera_admin()) with check(public.is_valtiera_admin());
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id), check(blocker_id<>blocked_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key(conversation_id,user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at desc);

create or replace function public.start_direct_conversation(target_user uuid)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare current_user_id uuid:=auth.uid(); existing_id uuid; new_id uuid;
begin
  if current_user_id is null then raise exception 'Sign in required.' using errcode='28000'; end if;
  if target_user is null or target_user=current_user_id or not exists(select 1 from public.profiles where id=target_user) then raise exception 'Invalid recipient.' using errcode='22023'; end if;
  if exists(select 1 from public.user_blocks where (blocker_id=current_user_id and blocked_id=target_user) or (blocker_id=target_user and blocked_id=current_user_id)) then raise exception 'Messaging is unavailable for this user.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext(least(current_user_id::text,target_user::text)),hashtext(greatest(current_user_id::text,target_user::text)));
  select c.id into existing_id from public.conversations c
  where not c.is_group and exists(select 1 from public.conversation_participants p where p.conversation_id=c.id and p.user_id=current_user_id)
    and exists(select 1 from public.conversation_participants p where p.conversation_id=c.id and p.user_id=target_user)
    and (select count(*) from public.conversation_participants p where p.conversation_id=c.id)=2 limit 1;
  if existing_id is not null then return existing_id; end if;
  insert into public.conversations(created_by) values(current_user_id) returning id into new_id;
  insert into public.conversation_participants(conversation_id,user_id) values(new_id,current_user_id),(new_id,target_user);
  return new_id;
end; $$;
revoke all on function public.start_direct_conversation(uuid) from public,anon;
grant execute on function public.start_direct_conversation(uuid) to authenticated;

create or replace function public.touch_profile_presence()
returns void language sql security definer set search_path=public,auth as $$
  update public.profiles set last_seen_at=now() where id=auth.uid() and show_last_seen;
$$;
revoke all on function public.touch_profile_presence() from public,anon;
grant execute on function public.touch_profile_presence() to authenticated;
create or replace function public.set_presence_visibility(enabled boolean)
returns void language sql security definer set search_path=public,auth as $$
  update public.profiles set show_last_seen=enabled,last_seen_at=case when enabled then last_seen_at else null end where id=auth.uid();
$$;
revoke all on function public.set_presence_visibility(boolean) from public,anon;
grant execute on function public.set_presence_visibility(boolean) to authenticated;

create or replace function public.can_access_conversation(target_conversation uuid)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select exists(select 1 from public.conversation_participants mine where mine.conversation_id=target_conversation and mine.user_id=auth.uid())
  and not exists(
    select 1 from public.conversation_participants other_member
    join public.user_blocks b on ((b.blocker_id=auth.uid() and b.blocked_id=other_member.user_id) or (b.blocker_id=other_member.user_id and b.blocked_id=auth.uid()))
    where other_member.conversation_id=target_conversation and other_member.user_id<>auth.uid()
  );
$$;
revoke all on function public.can_access_conversation(uuid) from public,anon;
grant execute on function public.can_access_conversation(uuid) to authenticated;

alter table public.user_follows enable row level security;
alter table public.saved_posts enable row level security;
alter table public.content_reports enable row level security;
alter table public.user_blocks enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

grant select on public.profiles to authenticated;
grant update(username,avatar_url,bio,interests,show_last_seen) on public.profiles to authenticated;
grant select,insert,update,delete on public.community_posts,public.community_comments,public.community_votes,public.user_follows,public.saved_posts,public.content_reports,public.user_blocks to authenticated;
grant select,insert on public.conversations,public.conversation_participants,public.messages to authenticated;
grant update(last_read_at) on public.conversation_participants to authenticated;

drop policy if exists profiles_authenticated_read on public.profiles;
create policy profiles_authenticated_read on public.profiles for select to authenticated using(true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

drop policy if exists follows_read on public.user_follows;
create policy follows_read on public.user_follows for select to authenticated using(true);
drop policy if exists follows_manage_self on public.user_follows;
create policy follows_manage_self on public.user_follows for all to authenticated using(follower_id=auth.uid()) with check(follower_id=auth.uid() and follower_id<>followed_id);
drop policy if exists saves_own on public.saved_posts;
create policy saves_own on public.saved_posts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists reports_create_self on public.content_reports;
create policy reports_create_self on public.content_reports for insert to authenticated with check(reporter_id=auth.uid());
drop policy if exists reports_read_self_or_mod on public.content_reports;
create policy reports_read_self_or_mod on public.content_reports for select to authenticated using(reporter_id=auth.uid() or public.is_valtiera_admin());
drop policy if exists blocks_read_own on public.user_blocks;
create policy blocks_read_own on public.user_blocks for select to authenticated using(blocker_id=auth.uid());
drop policy if exists blocks_manage_own on public.user_blocks;
create policy blocks_manage_own on public.user_blocks for all to authenticated using(blocker_id=auth.uid()) with check(blocker_id=auth.uid() and blocker_id<>blocked_id);

drop policy if exists conversations_read_participant on public.conversations;
create policy conversations_read_participant on public.conversations for select to authenticated using(public.can_access_conversation(id));
drop policy if exists participants_read_member on public.conversation_participants;
create policy participants_read_member on public.conversation_participants for select to authenticated using(public.can_access_conversation(conversation_id));
drop policy if exists participants_update_self on public.conversation_participants;
create policy participants_update_self on public.conversation_participants for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists messages_read_participant on public.messages;
create policy messages_read_participant on public.messages for select to authenticated using(public.can_access_conversation(conversation_id));
drop policy if exists messages_send_participant on public.messages;
create policy messages_send_participant on public.messages for insert to authenticated with check(sender_id=auth.uid() and public.can_access_conversation(conversation_id));

-- The discussion feed is public by design; account actions still require authentication.
grant select on public.community_posts,public.community_comments,public.community_votes to anon;
alter table public.watchlists drop constraint if exists watchlists_asset_type_check;
alter table public.watchlists add constraint watchlists_asset_type_check check(asset_type in ('stock','crypto','fund','index','forex','commodity','future'));

-- Public read, authenticated upload; object paths are prefixed by the uploader's auth UUID.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('community-images','community-images',true,8388608,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists community_images_upload_own on storage.objects;
create policy community_images_upload_own on storage.objects for insert to authenticated with check(bucket_id='community-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists community_images_update_own on storage.objects;
create policy community_images_update_own on storage.objects for update to authenticated using(bucket_id='community-images' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='community-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists community_images_delete_own on storage.objects;
create policy community_images_delete_own on storage.objects for delete to authenticated using(bucket_id='community-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists community_images_public_read on storage.objects;
create policy community_images_public_read on storage.objects for select to anon,authenticated using(bucket_id='community-images');

create table if not exists public.research_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text[] not null default '{}',
  institution text not null default '',
  category text not null,
  summary text not null default '',
  doi text,
  source_url text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists research_papers_source_unique on public.research_papers(source_url);
alter table public.research_papers enable row level security;
grant select on public.research_papers to anon,authenticated;
drop policy if exists research_papers_public_read on public.research_papers;
create policy research_papers_public_read on public.research_papers for select to anon,authenticated using(true);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category text not null,
  level text not null default 'Beginner' check(level in ('Beginner','Intermediate','Advanced')),
  thumbnail_url text,
  status text not null default 'draft' check(status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  video_url text not null,
  duration_seconds integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(course_id,sort_order)
);
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);
create table if not exists public.lesson_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,lesson_id)
);
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_bookmarks enable row level security;
grant select on public.courses,public.lessons to anon,authenticated;
grant select,insert,delete on public.lesson_progress to authenticated;
grant select,insert,delete on public.lesson_bookmarks to authenticated;
drop policy if exists courses_published_read on public.courses;
create policy courses_published_read on public.courses for select to anon,authenticated using(status='published' or public.is_valtiera_admin());
drop policy if exists lessons_published_read on public.lessons;
create policy lessons_published_read on public.lessons for select to anon,authenticated using(exists(select 1 from public.courses c where c.id=course_id and (c.status='published' or public.is_valtiera_admin())));
drop policy if exists lesson_progress_own on public.lesson_progress;
create policy lesson_progress_own on public.lesson_progress for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists lesson_bookmarks_own on public.lesson_bookmarks;
create policy lesson_bookmarks_own on public.lesson_bookmarks for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

with course_row as (
  insert into public.courses(slug,title,description,category,level,thumbnail_url,status)
  values('mit-mathematics-finance','Topics in Mathematics with Applications in Finance','Selected open lectures on financial markets and mathematical applications from MIT OpenCourseWare.','Quantitative Finance','Beginner','https://img.youtube.com/vi/z4p87TPCnQc/hqdefault.jpg','published')
  on conflict(slug) do update set title=excluded.title returning id
)
insert into public.lessons(course_id,title,description,video_url,duration_seconds,sort_order)
select id,'Introduction to Financial Markets','MIT OpenCourseWare lecture covering financial markets, financial products, participants, and introductory quantitative ideas.','https://www.youtube-nocookie.com/embed/z4p87TPCnQc',null,1 from course_row
on conflict(course_id,sort_order) do update set title=excluded.title,description=excluded.description,video_url=excluded.video_url;
with course_row as (select id from public.courses where slug='mit-mathematics-finance')
insert into public.lessons(course_id,title,description,video_url,duration_seconds,sort_order)
select id,'Course introduction','MIT OpenCourseWare introduction to its Topics in Mathematics with Applications in Finance course.','https://www.youtube-nocookie.com/embed/b8u2CQLQBVU',null,2 from course_row
on conflict(course_id,sort_order) do update set title=excluded.title,description=excluded.description,video_url=excluded.video_url;

create table if not exists public.backtests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  strategy text not null,
  parameters jsonb not null default '{}',
  start_date date not null,
  end_date date not null,
  source text not null,
  status text not null default 'unavailable' check(status in ('queued','complete','unavailable','failed')),
  results jsonb,
  created_at timestamptz not null default now(),
  check(end_date>start_date)
);
alter table public.backtests enable row level security;
grant select,insert on public.backtests to authenticated;
drop policy if exists backtests_own on public.backtests;
create policy backtests_own on public.backtests for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then alter publication supabase_realtime add table public.messages; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_posts') then alter publication supabase_realtime add table public.community_posts; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_comments') then alter publication supabase_realtime add table public.community_comments; end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_votes') then alter publication supabase_realtime add table public.community_votes; end if;
  end if;
end $$;

