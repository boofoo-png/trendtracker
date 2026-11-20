-- TrendTracker (SixthSense): initial schema
--
-- Replaces today's browser and Apify storage:
--   localStorage "trendtracker:settings"        -> profiles + workspaces
--   localStorage "trendtracker:audiences"       -> audiences
--   Apify KV store "trendtracker" / "latest"    -> trend_searches + posts + trends
--   localStorage "trendtracker:watchlist"       -> watchlist
--   localStorage "trendtracker:campaign-focus"  -> campaign_directions.focus
--   localStorage "trendtracker:campaign"        -> campaigns
--   localStorage "trendtracker:saved-content"   -> saved_content
--   localStorage "trendtracker:calendar"        -> calendar_posts (+ posting_plans)
--   localStorage "trendtracker:alerts-read"     -> alerts + alert_reads
--   Gemini in-memory cache                      -> ai_cache
--   lib/sample/* (placeholder figures)          -> competitors, competitor_campaigns, metrics_daily
--
-- Pure UI state stays in the browser: "trendtracker:period", "trendtracker:content-trend",
-- "trendtracker:open-sense". (profiles.preferences holds anything that should follow the user.)
--
-- Tenancy: every business row belongs to a workspace (the company in Settings -> Workspace).
-- Users reach rows only through workspace_members (see RLS at the bottom).

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

-- One row per signed-in user (Settings -> Profile). Email lives in auth.users.
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '' check (char_length(full_name) <= 80),
  job_role     text not null default '' check (char_length(job_role) <= 80),
  phone        text not null default '' check (char_length(phone) <= 40),
  timezone     text not null default 'America/Vancouver',  -- IANA name; UI shows "Pacific Time (PT)"
  -- Alert switches from lib/settings.js ALERT_TYPES.
  alert_prefs  jsonb not null default '{"competitor": true, "trends": true, "reports": false, "planner": true}',
  -- Per-user UI preferences worth syncing across devices (e.g. default period).
  preferences  jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- The business (Settings -> Workspace). Fed to every Gemini prompt via businessContext().
create table public.workspaces (
  id             uuid primary key default gen_random_uuid(),
  company        text not null default '' check (char_length(company) <= 80),
  website        text not null default '' check (char_length(website) <= 200),
  industry       text not null default 'Not specified',     -- lib/business.js INDUSTRIES
  customer_type  text not null default 'Not specified'
                 check (customer_type in ('Not specified', 'Consumers (B2C)', 'Businesses (B2B)', 'Both')),
  description    text not null default '' check (char_length(description) <= 400),
  keywords       text[] not null default '{}' check (cardinality(keywords) <= 12),
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

-- ---------------------------------------------------------------------------
-- Audiences and trend search
-- ---------------------------------------------------------------------------

-- "Saved to your profile" audience chips. Selection is per user, so it's a separate table.
create table public.audiences (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  name          citext not null check (char_length(name) between 1 and 60),  -- case-insensitive dedupe, as in useAudiences
  source        text not null default 'custom' check (source in ('preset', 'ai', 'custom')),
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.audience_selections (
  user_id      uuid not null references auth.users (id) on delete cascade,
  audience_id  uuid not null references public.audiences (id) on delete cascade,
  primary key (user_id, audience_id)
);

-- One "Run trend search" press (plan -> confirm -> run). The newest succeeded/partial
-- run per workspace is what LiveStatusBanner calls "Live · updated N min ago".
create table public.trend_searches (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  run_by         uuid references auth.users (id) on delete set null,
  audiences      text[] not null default '{}',
  hashtags       jsonb not null default '[]',   -- [{ "tag": "hotelier", "audience": "Hotel general managers" }]
  status         text not null default 'running'
                 check (status in ('running', 'succeeded', 'partial', 'failed')),  -- partial = one platform failed
  errors         jsonb not null default '[]',
  post_count     integer not null default 0,
  est_cost_usd   numeric(8, 2),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz
);
create index trend_searches_latest_idx on public.trend_searches (workspace_id, finished_at desc)
  where status in ('succeeded', 'partial');

-- Normalized scraped posts (lib/apify/normalize.js). Public social data, shared by all
-- workspaces and deduplicated by id; metrics are overwritten with the latest scrape.
create table public.posts (
  id             text primary key,               -- "tt-<id>" / "ig-<id>"
  platform       text not null check (platform in ('TikTok', 'Instagram')),
  text           text not null default '',
  hashtags       text[] not null default '{}',   -- lowercase, no "#"
  format         text not null,                  -- Short-form video | Slideshow | Reel | Carousel | Image post | Post
  url            text,
  embed_url      text,
  likes          bigint not null default 0 check (likes >= 0),
  comments       bigint not null default 0 check (comments >= 0),
  shares         bigint not null default 0 check (shares >= 0),
  views          bigint not null default 0 check (views >= 0),
  posted_at      timestamptz,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now()
);
create index posts_hashtags_idx on public.posts using gin (hashtags);

-- Which posts a search returned, and the hashtag each was scraped for (queryTag).
create table public.search_posts (
  search_id  uuid not null references public.trend_searches (id) on delete cascade,
  post_id    text not null references public.posts (id) on delete cascade,
  query_tag  text,
  primary key (search_id, post_id)
);
create index search_posts_post_idx on public.search_posts (post_id);

-- Trends built by buildTrends() for one search. Keeping every run's snapshot gives
-- momentum history across searches. trend_key ("tiktok-sustainablehotel") is stable
-- between runs; it's what the watchlist and campaign directions point at.
create table public.trends (
  id            uuid primary key default gen_random_uuid(),
  search_id     uuid not null references public.trend_searches (id) on delete cascade,
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  trend_key     text not null,
  name          text not null,                   -- "#sustainablehotel"
  platform      text not null check (platform in ('TikTok', 'Instagram', 'LinkedIn')),
  format        text,
  depth         text not null check (depth in ('Broad', 'Niche')),
  post_count    integer not null default 0,
  momentum      smallint not null check (momentum between 0 and 100),
  change_pct    integer not null default 0,      -- week-over-week post growth
  fit           smallint check (fit between 0 and 100),  -- keyword fallback; unused while FIT_ENABLED = false
  audience_fit  jsonb,                           -- { "<audience>": { "fit": 0-100, "reason": "..." } }
  history       integer[] not null default '{}', -- posts per day, last 7 days
  top_post_ids  text[] not null default '{}',    -- up to 3 posts.id, by engagement
  angle         jsonb,                           -- optional hand-written { headline, summary, do, avoid, why }
  created_at    timestamptz not null default now(),
  unique (search_id, trend_key)
);
create index trends_workspace_key_idx on public.trends (workspace_id, trend_key, created_at desc);

-- Starred trends. Per user; keyed by trend_key so a star survives new searches.
create table public.watchlist (
  user_id       uuid not null references auth.users (id) on delete cascade,
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  trend_key     text not null,
  name          text not null,
  platform      text not null,
  created_at    timestamptz not null default now(),
  primary key (user_id, workspace_id, trend_key)
);

-- Gemini "Campaign direction" for a trend. Also serves as its cache: look up by
-- (trend_id, focus, audiences, attempt) before calling Gemini.
create table public.campaign_directions (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  trend_id      uuid references public.trends (id) on delete set null,
  trend_key     text not null,
  audiences     text[] not null default '{}',
  focus         jsonb not null default '{"type": "General brand", "name": "", "details": ""}',  -- CampaignFocusForm
  attempt       smallint not null default 0,     -- bumped by Regenerate
  result        jsonb not null,                  -- { headline, summary, do, avoid, why }
  model         text,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index campaign_directions_trend_idx on public.campaign_directions (workspace_id, trend_key, created_at desc);

-- ---------------------------------------------------------------------------
-- Content creation and planning
-- ---------------------------------------------------------------------------

-- Content Creation -> Campaign builder. brief = lib/campaignBrief.js EMPTY_BRIEF shape
-- (validated by cleanBrief); plan = generateCampaignPlan output. Filterable fields are columns.
create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  name          text check (char_length(name) <= 120),
  goal          text not null default 'Awareness' check (goal in ('Awareness', 'Leads', 'Sales')),
  focus         text not null default 'Product' check (focus in ('Product', 'Service', 'Event', 'Sale or offer')),
  channels      text[] not null default '{Instagram}',
  launch_date   date,
  days          smallint not null default 30 check (days between 7 and 90),
  brief         jsonb not null default '{}',
  plan          jsonb,                           -- null until generated
  status        text not null default 'draft' check (status in ('draft', 'planned', 'active', 'done', 'archived')),
  source_trend  text,                            -- trend name handed over from Audience trends
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index campaigns_workspace_idx on public.campaigns (workspace_id, updated_at desc);

-- "My Content": anything saved from the creators (social, video, blog, ad, edit, improve,
-- repurpose, upload) or the campaign builder.
create table public.saved_content (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  kind          text not null check (kind in ('social', 'video', 'blog', 'ad', 'edit', 'improve', 'repurpose', 'upload', 'campaign')),
  type          text not null,                   -- display label: "Social post", "Ad copy", "Campaign"...
  title         text not null check (char_length(title) <= 120),
  body          text not null default '',
  inputs        jsonb not null default '{}',     -- the form fields used to generate it (goal, tone, idea...)
  source_trend  text,                            -- the "trend" field in savedContent.js
  campaign_id   uuid references public.campaigns (id) on delete set null,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index saved_content_workspace_idx on public.saved_content (workspace_id, created_at desc);

-- AI Management -> "Create my plan" (two-week posting plan from Gemini).
create table public.posting_plans (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  goal            text not null check (char_length(goal) between 5 and 500),
  channels        text[] not null,
  per_week        smallint not null check (per_week between 2 and 5),
  start_date      date not null,
  recommendation  text,                          -- the "plan note" shown on the calendar
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- Content calendar. time is a real time (the UI shows "9:30 AM"), interpreted in the
-- creator's profile timezone.
create table public.calendar_posts (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  scheduled_date    date not null,
  scheduled_time    time,
  channels          text[] not null default '{}' check (cardinality(channels) >= 1),  -- a post can go to several
  format            text not null check (format in ('Image', 'Carousel', 'Reel', 'Video', 'Story')),
  title             text not null check (char_length(title) <= 120),
  caption           text not null default '',
  status            text not null default 'planned' check (status in ('planned', 'published', 'skipped')),
  posting_plan_id   uuid references public.posting_plans (id) on delete set null,   -- set when AI-planned
  saved_content_id  uuid references public.saved_content (id) on delete set null,
  campaign_id       uuid references public.campaigns (id) on delete set null,
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index calendar_posts_date_idx on public.calendar_posts (workspace_id, scheduled_date, scheduled_time);

-- ---------------------------------------------------------------------------
-- Competitors, metrics, alerts (placeholder data in the app today)
-- ---------------------------------------------------------------------------

create table public.competitors (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  name          text not null,
  website       text,
  handles       jsonb not null default '{}',     -- { "instagram": "@...", "tiktok": "@..." }
  created_at    timestamptz not null default now(),
  unique (workspace_id, name)
);

-- Cards on the Competitors page. yours/theirs = { count, engagement } comparison.
create table public.competitor_campaigns (
  id             uuid primary key default gen_random_uuid(),
  competitor_id  uuid not null references public.competitors (id) on delete cascade,
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  title          text not null,
  description    text,
  channel        text,                            -- "Paid social", "Cross-channel"
  platform       text,
  format         text,
  image_url      text,
  tags           text[] not null default '{}',    -- "Most liked post", "Common reused layouts"...
  unit           text,                            -- "Reels", "posts"
  yours          jsonb,
  theirs         jsonb,
  launched_at    date,
  created_at     timestamptz not null default now()
);
create index competitor_campaigns_idx on public.competitor_campaigns (workspace_id, launched_at desc);

-- Daily marketing figures for Overview and Reports (replaces lib/sample/series.js dayFigures).
-- One row per workspace, day and source; totals are summed over any period.
create table public.metrics_daily (
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  day           date not null,
  source        text not null,                    -- 'google', 'meta', 'instagram', 'facebook', 'web', 'email'
  spend         numeric(12, 2) not null default 0,
  revenue       numeric(12, 2) not null default 0,
  impressions   bigint not null default 0,
  clicks        bigint not null default 0,
  conversions   numeric(12, 2) not null default 0,
  reach         bigint not null default 0,
  new_members   integer not null default 0,
  extra         jsonb not null default '{}',      -- country split etc.
  primary key (workspace_id, day, source)
);

-- Top-bar alerts. user_id null = for everyone in the workspace.
create table public.alerts (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete cascade,
  type          text not null check (type in ('competitor', 'trends', 'reports', 'planner')),
  title         text not null,
  body          text,
  href          text,
  created_at    timestamptz not null default now()
);
create index alerts_workspace_idx on public.alerts (workspace_id, created_at desc);

create table public.alert_reads (
  alert_id  uuid not null references public.alerts (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  read_at   timestamptz not null default now(),
  primary key (alert_id, user_id)
);

-- Server-only cache for Gemini answers (audience suggestions, hashtags, fit).
-- No RLS policies: only the service role key can read or write it.
create table public.ai_cache (
  key         text primary key,
  value       jsonb not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index ai_cache_expires_idx on public.ai_cache (expires_at);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at       before update on public.profiles       for each row execute function public.set_updated_at();
create trigger workspaces_updated_at     before update on public.workspaces     for each row execute function public.set_updated_at();
create trigger campaigns_updated_at      before update on public.campaigns      for each row execute function public.set_updated_at();
create trigger saved_content_updated_at  before update on public.saved_content  for each row execute function public.set_updated_at();
create trigger calendar_posts_updated_at before update on public.calendar_posts for each row execute function public.set_updated_at();

-- New sign-up -> a profile, a workspace and an owner membership.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.workspaces (created_by) values (new.id) returning id into ws;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

-- security definer so policies on workspace_members don't recurse into themselves.
create or replace function public.is_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_admin(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = (select auth.uid()) and role in ('owner', 'admin')
  );
$$;

alter table public.profiles             enable row level security;
alter table public.workspaces           enable row level security;
alter table public.workspace_members    enable row level security;
alter table public.audiences            enable row level security;
alter table public.audience_selections  enable row level security;
alter table public.trend_searches       enable row level security;
alter table public.posts                enable row level security;
alter table public.search_posts         enable row level security;
alter table public.trends               enable row level security;
alter table public.watchlist            enable row level security;
alter table public.campaign_directions  enable row level security;
alter table public.campaigns            enable row level security;
alter table public.saved_content        enable row level security;
alter table public.posting_plans        enable row level security;
alter table public.calendar_posts       enable row level security;
alter table public.competitors          enable row level security;
alter table public.competitor_campaigns enable row level security;
alter table public.metrics_daily        enable row level security;
alter table public.alerts               enable row level security;
alter table public.alert_reads          enable row level security;
alter table public.ai_cache             enable row level security;

-- Own profile; teammates can read each other's.
create policy "profiles: read self and teammates" on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.workspace_members a
      join public.workspace_members b on a.workspace_id = b.workspace_id
      where a.user_id = (select auth.uid()) and b.user_id = profiles.id
    )
  );
create policy "profiles: update self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "workspaces: members read" on public.workspaces for select to authenticated
  using (public.is_member(id));
create policy "workspaces: admins update" on public.workspaces for update to authenticated
  using (public.is_admin(id)) with check (public.is_admin(id));

create policy "members: members read" on public.workspace_members for select to authenticated
  using (public.is_member(workspace_id));
create policy "members: admins manage" on public.workspace_members for all to authenticated
  using (public.is_admin(workspace_id)) with check (public.is_admin(workspace_id));

-- Workspace-owned tables: any member can read and write.
do $$
declare
  t text;
begin
  foreach t in array array[
    'audiences', 'trend_searches', 'trends', 'campaign_directions', 'campaigns',
    'saved_content', 'posting_plans', 'calendar_posts', 'competitors',
    'competitor_campaigns', 'metrics_daily'
  ] loop
    execute format(
      'create policy "%1$s: members all" on public.%1$I for all to authenticated
         using (public.is_member(workspace_id)) with check (public.is_member(workspace_id))', t);
  end loop;
end;
$$;

-- Per-user rows.
create policy "audience_selections: own" on public.audience_selections for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.audiences a where a.id = audience_id and public.is_member(a.workspace_id))
  );

create policy "watchlist: own" on public.watchlist for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_member(workspace_id));

create policy "alerts: read own or workspace-wide" on public.alerts for select to authenticated
  using (public.is_member(workspace_id) and (user_id is null or user_id = (select auth.uid())));

create policy "alert_reads: own" on public.alert_reads for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Scraped posts are public data: any signed-in user may read; only the server
-- (service role, which bypasses RLS) writes them.
create policy "posts: read" on public.posts for select to authenticated using (true);
create policy "search_posts: members read" on public.search_posts for select to authenticated
  using (exists (select 1 from public.trend_searches s where s.id = search_id and public.is_member(s.workspace_id)));

-- ai_cache: RLS on, no policies -> service role only.
