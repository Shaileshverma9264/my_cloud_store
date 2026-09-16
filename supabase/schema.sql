-- My Cloud Storage Pro - AUTH-FREE / PUBLIC WORKSPACE
-- Run this in the Supabase SQL Editor.
-- WARNING: this intentionally allows anonymous users to manage the same files.
-- Use this edition for a public/testing cloud, not private documents.

create extension if not exists pgcrypto;

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders(id) on delete set null,
  original_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  file_id uuid not null references public.files(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Remove policies from the previous authenticated version.
drop policy if exists "folders own all" on public.folders;
drop policy if exists "files own all" on public.files;
drop policy if exists "shares owner all" on public.share_links;

-- If these tables came from the old authenticated edition, remove per-user ownership.
alter table public.folders drop column if exists owner_id;
alter table public.files drop column if exists owner_id;
alter table public.share_links drop column if exists owner_id;

drop index if exists public.files_owner_idx;
drop index if exists public.folders_owner_idx;

create index if not exists files_folder_idx on public.files(folder_id);
create index if not exists share_token_idx on public.share_links(token);

alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.share_links enable row level security;

drop policy if exists "public folders all" on public.folders;
create policy "public folders all"
on public.folders
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public files all" on public.files;
create policy "public files all"
on public.files
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public shares all" on public.share_links;
create policy "public shares all"
on public.share_links
for all
to anon, authenticated
using (true)
with check (true);

-- Public metadata lookup for a non-expired share token.
drop function if exists public.get_public_share(text);
create or replace function public.get_public_share(p_token text)
returns table (
  original_name text,
  size_bytes bigint,
  mime_type text,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select f.original_name, f.size_bytes, f.mime_type, s.expires_at
  from public.share_links s
  join public.files f on f.id = s.file_id
  where s.token = p_token
    and s.expires_at > now()
    and f.deleted_at is null;
$$;

revoke all on function public.get_public_share(text) from public;
grant execute on function public.get_public_share(text) to anon, authenticated;

-- Storage policies for the user-files bucket.
-- Create the bucket in Supabase Storage with the exact name: user-files.
drop policy if exists "public user files insert" on storage.objects;
create policy "public user files insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'user-files');

drop policy if exists "public user files select" on storage.objects;
create policy "public user files select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'user-files');

drop policy if exists "public user files delete" on storage.objects;
create policy "public user files delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'user-files');

-- The old authenticated storage policies are no longer needed.
drop policy if exists "user files insert" on storage.objects;
drop policy if exists "user files select" on storage.objects;
drop policy if exists "user files delete" on storage.objects;

-- new
alter table public.files
add column if not exists item_type
text not null default 'file';

alter table public.files
add column if not exists url text;
alter table public.files
drop constraint if exists files_item_type_check;

alter table public.files
add constraint files_item_type_check
check (
  item_type in ('file', 'link')
);