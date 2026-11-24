-- Real competitors from Instagram Business Discovery. The latest numbers are cached on
-- the row (refreshed at most every few hours) so the page is fast and stays well under
-- Instagram's rate limit.
alter table public.competitors
  add column snapshot     jsonb,
  add column snapshot_at  timestamptz;
