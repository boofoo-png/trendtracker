-- Separate first and last name (sign-up and Settings both ask for them separately).
-- full_name stays as the joined name, kept in sync by the app, so anything that shows
-- a single name keeps working.

alter table public.profiles
  add column first_name text not null default '' check (char_length(first_name) <= 40),
  add column last_name  text not null default '' check (char_length(last_name) <= 40);

-- Existing profiles: first word is the first name, the rest is the last name.
update public.profiles
set first_name = left(split_part(btrim(full_name), ' ', 1), 40),
    last_name  = left(btrim(substr(btrim(full_name), length(split_part(btrim(full_name), ' ', 1)) + 1)), 40)
where full_name <> '' and first_name = '' and last_name = '';

-- Sign-up now sends first_name and last_name too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws uuid;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text := left(btrim(coalesce(meta ->> 'first_name', '')), 40);
  v_last  text := left(btrim(coalesce(meta ->> 'last_name', '')), 40);
  v_full  text := left(btrim(coalesce(meta ->> 'full_name', '')), 80);
begin
  if v_full = '' then
    v_full := left(btrim(v_first || ' ' || v_last), 80);
  end if;

  insert into public.profiles (id, full_name, first_name, last_name, job_role, phone)
  values (
    new.id,
    v_full,
    v_first,
    v_last,
    left(coalesce(meta ->> 'job_role', ''), 80),
    left(coalesce(meta ->> 'phone', ''), 40)
  );

  insert into public.workspaces (created_by, company)
  values (new.id, left(coalesce(meta ->> 'company', ''), 80))
  returning id into ws;

  insert into public.workspace_members (workspace_id, user_id, role) values (ws, new.id, 'owner');
  return new;
end;
$$;
