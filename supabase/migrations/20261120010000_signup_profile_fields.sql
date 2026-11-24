-- Create Account now also asks for role, phone and company (Figma Make
-- CreateAccountPage). Copy them from the sign-up metadata into the new profile and
-- workspace, trimmed to the column limits so a long value can't block sign-up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws uuid;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, full_name, job_role, phone)
  values (
    new.id,
    left(coalesce(meta ->> 'full_name', ''), 80),
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
