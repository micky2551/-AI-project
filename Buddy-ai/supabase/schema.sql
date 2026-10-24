-- Buddy AI schema
-- Run this entire file in Supabase SQL Editor using a trusted project owner account.
-- This schema uses Supabase Auth + Row Level Security (RLS).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Student',
  role text not null default 'student' check (role in ('student', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active = true
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active = true
  );
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_active_user() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(coalesce(new.email, 'student'), '@', 1)),
    'student',
    true
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Always create normal Student profiles from Auth; public signup cannot choose a role.
drop trigger if exists on_auth_user_created_studypilot on auth.users;
create trigger on_auth_user_created_studypilot
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.email is distinct from old.email)
     and not public.is_admin() then
    raise exception 'Only an active admin may change role, active status, or profile email';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_fields on public.profiles;
create trigger profiles_guard_privileged_fields
before update on public.profiles
for each row execute procedure public.guard_profile_privileged_fields();

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  code text,
  description text,
  color text not null default 'violet',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  constraint public_course_owner_check check (is_public = false or user_id is null)
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text not null default '',
  task_type text not null default 'study' check (task_type in ('study','assignment','exam','activity','class','break')),
  start_at timestamptz,
  due_at timestamptz,
  duration_minutes integer not null default 45 check (duration_minutes between 5 and 1440),
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  is_locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  source_text text not null default '',
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  topic text not null,
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  weak_topics text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.learning_contents (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  content text not null,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_templates (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  questions jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_questions_must_be_array check (jsonb_typeof(questions) = 'array')
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add indexes for the most common user-scoped queries.
create index if not exists study_tasks_user_due_idx on public.study_tasks(user_id, due_at);
create index if not exists courses_user_idx on public.courses(user_id);
create index if not exists materials_user_created_idx on public.learning_materials(user_id, created_at desc);
create index if not exists quiz_attempts_user_created_idx on public.quiz_attempts(user_id, created_at desc);
create index if not exists learning_contents_published_idx on public.learning_contents(is_published, created_at desc);
create index if not exists quiz_templates_published_idx on public.quiz_templates(is_published, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

-- Enable RLS on every table exposed to the browser.
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.study_tasks enable row level security;
alter table public.learning_materials enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.learning_contents enable row level security;
alter table public.quiz_templates enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: user reads/updates their own display information; admins can view all profiles.
drop policy if exists profiles_select_self_admin on public.profiles;
create policy profiles_select_self_admin on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update_self_admin on public.profiles;
create policy profiles_update_self_admin on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Courses: private courses belong to one student; published catalog courses are shared.
drop policy if exists courses_select_own_public_admin on public.courses;
create policy courses_select_own_public_admin on public.courses for select to authenticated
using ((user_id = auth.uid() and public.is_active_user()) or (is_public = true and public.is_active_user()) or public.is_admin());
drop policy if exists courses_insert_own_or_admin on public.courses;
create policy courses_insert_own_or_admin on public.courses for insert to authenticated
with check (public.is_admin() or (user_id = auth.uid() and is_public = false and public.is_active_user()));
drop policy if exists courses_update_own_or_admin on public.courses;
create policy courses_update_own_or_admin on public.courses for update to authenticated
using (public.is_admin() or (user_id = auth.uid() and is_public = false and public.is_active_user()))
with check (public.is_admin() or (user_id = auth.uid() and is_public = false and public.is_active_user()));
drop policy if exists courses_delete_own_or_admin on public.courses;
create policy courses_delete_own_or_admin on public.courses for delete to authenticated
using (public.is_admin() or (user_id = auth.uid() and is_public = false and public.is_active_user()));

-- Private study data is only accessible to its owner (while the account is active).
drop policy if exists tasks_owner_only on public.study_tasks;
create policy tasks_owner_only on public.study_tasks for all to authenticated
using (user_id = auth.uid() and public.is_active_user())
with check (user_id = auth.uid() and public.is_active_user());
drop policy if exists materials_owner_only on public.learning_materials;
create policy materials_owner_only on public.learning_materials for all to authenticated
using (user_id = auth.uid() and public.is_active_user())
with check (user_id = auth.uid() and public.is_active_user());
drop policy if exists quiz_attempts_owner_only on public.quiz_attempts;
create policy quiz_attempts_owner_only on public.quiz_attempts for all to authenticated
using (user_id = auth.uid() and public.is_active_user())
with check (user_id = auth.uid() and public.is_active_user());

-- Shared content: students can read only published content; admins manage it.
drop policy if exists learning_contents_read_published_admin on public.learning_contents;
create policy learning_contents_read_published_admin on public.learning_contents for select to authenticated
using ((is_published = true and public.is_active_user()) or public.is_admin());
drop policy if exists learning_contents_admin_insert on public.learning_contents;
create policy learning_contents_admin_insert on public.learning_contents for insert to authenticated
with check (public.is_admin() and created_by = auth.uid());
drop policy if exists learning_contents_admin_update on public.learning_contents;
create policy learning_contents_admin_update on public.learning_contents for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists learning_contents_admin_delete on public.learning_contents;
create policy learning_contents_admin_delete on public.learning_contents for delete to authenticated
using (public.is_admin());

-- Shared quiz templates follow the same publish policy; student attempts stay private.
drop policy if exists quiz_templates_read_published_admin on public.quiz_templates;
create policy quiz_templates_read_published_admin on public.quiz_templates for select to authenticated
using ((is_published = true and public.is_active_user()) or public.is_admin());
drop policy if exists quiz_templates_admin_insert on public.quiz_templates;
create policy quiz_templates_admin_insert on public.quiz_templates for insert to authenticated
with check (public.is_admin() and created_by = auth.uid());
drop policy if exists quiz_templates_admin_update on public.quiz_templates;
create policy quiz_templates_admin_update on public.quiz_templates for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists quiz_templates_admin_delete on public.quiz_templates;
create policy quiz_templates_admin_delete on public.quiz_templates for delete to authenticated
using (public.is_admin());

-- Audit logs are readable by Admin only; end users cannot insert/update/delete them directly.
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs for select to authenticated
using (public.is_admin());

-- Admin-only role management RPC. Role changes happen in the database, not from a client-supplied profile update.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_admins integer;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_role not in ('student', 'admin') then raise exception 'invalid role'; end if;
  if p_role = 'student' then
    select count(*) into remaining_admins from public.profiles
    where role = 'admin' and is_active = true and id <> p_user_id;
    if exists (select 1 from public.profiles where id = p_user_id and role = 'admin' and is_active = true) and remaining_admins = 0 then
      raise exception 'cannot demote the last active admin';
    end if;
  end if;
  update public.profiles set role = p_role, updated_at = now() where id = p_user_id;
  if not found then raise exception 'user not found'; end if;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'role_changed', 'profile', p_user_id, jsonb_build_object('role', p_role));
  return true;
end;
$$;

create or replace function public.admin_set_user_active(p_user_id uuid, p_is_active boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
  remaining_admins integer;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_user_id = auth.uid() and p_is_active = false then raise exception 'cannot deactivate your own admin session'; end if;
  select role into target_role from public.profiles where id = p_user_id;
  if target_role is null then raise exception 'user not found'; end if;
  if target_role = 'admin' and p_is_active = false then
    select count(*) into remaining_admins from public.profiles
    where role = 'admin' and is_active = true and id <> p_user_id;
    if remaining_admins = 0 then raise exception 'cannot deactivate the last active admin'; end if;
  end if;
  update public.profiles set is_active = p_is_active, updated_at = now() where id = p_user_id;
  insert into public.audit_logs(actor_id, action, target_type, target_id, details)
  values (auth.uid(), case when p_is_active then 'account_activated' else 'account_suspended' end, 'profile', p_user_id, jsonb_build_object('is_active', p_is_active));
  return true;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
revoke all on function public.admin_set_user_active(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_set_user_active(uuid, boolean) to authenticated;

-- Explicit grants for Supabase Data API roles; RLS remains the actual row-level security boundary.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.study_tasks to authenticated;
grant select, insert, update, delete on public.learning_materials to authenticated;
grant select, insert, update, delete on public.quiz_attempts to authenticated;
grant select, insert, update, delete on public.learning_contents to authenticated;
grant select, insert, update, delete on public.quiz_templates to authenticated;
grant select on public.audit_logs to authenticated;

-- Bootstrap an Admin safely:
-- 1. Register normally through the website and verify that account's email.
-- 2. Run the following in SQL Editor after replacing the email:
-- update public.profiles set role = 'admin' where email = 'YOUR_VERIFIED_ADMIN_EMAIL';
-- 3. Never put the Admin password or service-role key into source code.

-- Private persistent study-file library. Existing learning data is preserved.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-files', 'study-files', false, 50000000,
  array['application/pdf','image/png','image/jpeg','image/webp','text/plain','text/markdown','text/csv','application/octet-stream'])
on conflict (id) do update set public = false, file_size_limit = 50000000, allowed_mime_types = excluded.allowed_mime_types;
create table if not exists public.study_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  file_name text not null, mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 50000000),
  storage_path text not null unique, created_at timestamptz not null default now()
);
alter table public.study_files enable row level security;
drop policy if exists study_files_owner_only on public.study_files;
create policy study_files_owner_only on public.study_files for all to authenticated
using (user_id = (select auth.uid()) and public.is_active_user())
with check (user_id = (select auth.uid()) and public.is_active_user());
grant select, insert, update, delete on public.study_files to authenticated;
alter table public.learning_materials add column if not exists study_file_id uuid references public.study_files(id) on delete set null;
create index if not exists study_files_user_created_idx on public.study_files(user_id, created_at desc);
drop policy if exists study_files_storage_select_own on storage.objects;
create policy study_files_storage_select_own on storage.objects for select to authenticated
using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_active_user());
drop policy if exists study_files_storage_insert_own on storage.objects;
create policy study_files_storage_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_active_user());
drop policy if exists study_files_storage_update_own on storage.objects;
create policy study_files_storage_update_own on storage.objects for update to authenticated
using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_active_user())
with check (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_active_user());
drop policy if exists study_files_storage_delete_own on storage.objects;
create policy study_files_storage_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'study-files' and (storage.foldername(name))[1] = (select auth.uid()::text) and public.is_active_user());
