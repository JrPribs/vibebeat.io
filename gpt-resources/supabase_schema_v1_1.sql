
-- supabase_schema_v1_1.sql
-- vibebeat.io — DB schema, policies, helper functions, and notes
-- Version: 1.1 (includes shares, ai logs, assets, projects; RLS; slug generator)
-- Run in Supabase SQL editor. Review before executing in production.

-- ===============
-- Extensions
-- ===============
create extension if not exists "pgcrypto";

-- ===============
-- Helper: updated_at trigger
-- ===============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ===============
-- Projects table
-- ===============
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_idx on public.projects(owner);
create index if not exists projects_created_idx on public.projects(created_at desc);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

alter table public.projects enable row level security;

-- Owner can do anything on own projects
drop policy if exists projects_owner_all on public.projects;
create policy projects_owner_all
on public.projects
as permissive
for all
using (owner = auth.uid())
with check (owner = auth.uid());

-- Anyone (even anon) can SELECT projects that are shared
drop policy if exists projects_shared_read on public.projects;
create policy projects_shared_read
on public.projects
as permissive
for select
using (exists (select 1 from public.shares s where s.project = projects.id));

-- ===============
-- Shares table (publicly readable mapping from project -> slug)
-- ===============
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  project uuid not null references public.projects(id) on delete cascade,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create index if not exists shares_project_idx on public.shares(project);
create index if not exists shares_slug_idx on public.shares(slug);

alter table public.shares enable row level security;

-- Anyone can read shares (used by public /share/:slug pages)
drop policy if exists shares_select_all on public.shares;
create policy shares_select_all
on public.shares
as permissive
for select
using (true);

-- Only the owner of the underlying project may create or delete a share
drop policy if exists shares_owner_insert on public.shares;
create policy shares_owner_insert
on public.shares
as permissive
for insert
with check (auth.uid() = (select p.owner from public.projects p where p.id = shares.project));

drop policy if exists shares_owner_delete on public.shares;
create policy shares_owner_delete
on public.shares
as permissive
for delete
using (auth.uid() = (select p.owner from public.projects p where p.id = shares.project));

-- ===============
-- Slug generator (unique short id for shares)
-- SECURITY DEFINER so it can check uniqueness across shares without RLS conflicts
-- ===============
create or replace function public.gen_share_slug()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    -- base62-like 7 chars from random bytes (replace non-url chars)
    candidate := substring(translate(encode(gen_random_bytes(6), 'base64'), '/+=', 'xyz'), 1, 7);
    exit when not exists (select 1 from public.shares where slug = candidate);
  end loop;
  return candidate;
end;
$$;

-- ===============
-- Assets table (DB metadata about user-owned storage files)
-- (Actual files go to Storage bucket `user-assets`.)
-- ===============
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('audio','project','image','other')),
  path text not null unique, -- e.g., 'user-assets/{owner}/somefile.wav'
  created_at timestamptz not null default now()
);

create index if not exists assets_owner_idx on public.assets(owner);
create index if not exists assets_kind_idx on public.assets(kind);

alter table public.assets enable row level security;

-- Owner CRUD
drop policy if exists assets_owner_all on public.assets;
create policy assets_owner_all
on public.assets
as permissive
for all
using (owner = auth.uid())
with check (owner = auth.uid());

-- ===============
-- AI logs (rate-limit auditing and storytelling)
-- ===============
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  tool text not null check (tool in ('drum','melody','other')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_logs_owner_idx on public.ai_logs(owner);
create index if not exists ai_logs_created_idx on public.ai_logs(created_at desc);

alter table public.ai_logs enable row level security;

-- Owner read/insert
drop policy if exists ai_logs_owner_select on public.ai_logs;
create policy ai_logs_owner_select
on public.ai_logs
as permissive
for select
using (owner = auth.uid());

drop policy if exists ai_logs_owner_insert on public.ai_logs;
create policy ai_logs_owner_insert
on public.ai_logs
as permissive
for insert
with check (owner = auth.uid());

-- ===============
-- Storage bucket & policies (run once; adjust as needed)
-- ===============
-- Create bucket (no-op if exists)
insert into storage.buckets (id, name, public)
values ('user-assets', 'user-assets', false)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (already enabled by default).
-- Policies (make sure to review in the Storage Policies UI as well):
drop policy if exists "User can read own assets" on storage.objects;
create policy "User can read own assets"
on storage.objects
for select
using (
  bucket_id = 'user-assets'
  and owner = auth.uid()
);

drop policy if exists "User can upload own assets" on storage.objects;
create policy "User can upload own assets"
on storage.objects
for insert
with check (
  bucket_id = 'user-assets'
  and owner = auth.uid()
);

drop policy if exists "User can update own assets" on storage.objects;
create policy "User can update own assets"
on storage.objects
for update
using (
  bucket_id = 'user-assets'
  and owner = auth.uid()
);

drop policy if exists "User can delete own assets" on storage.objects;
create policy "User can delete own assets"
on storage.objects
for delete
using (
  bucket_id = 'user-assets'
  and owner = auth.uid()
);

-- Note: For public sharing, DO NOT open the bucket. Use signed URLs via Edge Function.

-- ===============
-- (Optional) Seed demo project for current user, only if auth.uid() is present
-- ===============
do $$
begin
  if auth.uid() is not null then
    insert into public.projects (owner, title, data)
    values (auth.uid(), 'Demo Project', jsonb_build_object('version','1.1.0','tempoBpm', 90));
  end if;
end $$;
