-- Facebook + Instagram connection (Facebook Login). One per workspace.
-- Holds access tokens, so RLS is on with NO policies: only the server (service role)
-- can read or write it. The app shows status through server actions that never
-- return the tokens.

create table public.meta_connections (
  workspace_id      uuid primary key references public.workspaces (id) on delete cascade,
  connected_by      uuid references auth.users (id) on delete set null,
  fb_user_id        text not null,
  fb_user_name      text not null default '',
  user_token        text not null,             -- long-lived user token (~60 days)
  token_expires_at  timestamptz,
  -- [{ id, name, token, ig: { id, username } | null }]  Page tokens from a
  -- long-lived user token don't expire.
  pages             jsonb not null default '[]',
  connected_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.meta_connections enable row level security;
