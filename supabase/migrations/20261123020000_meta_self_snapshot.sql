-- Cache the workspace's own Instagram numbers (the "You" row on the Competitors page)
-- so the page can show them instantly instead of asking Instagram on every visit.
-- Same idea as competitors.snapshot. Server-only like the rest of this table.

alter table public.meta_connections
  add column self_snapshot    jsonb,
  add column self_snapshot_at timestamptz;
