-- ─────────────────────────────────────────────────────────────────────────────
-- Dockit · Supabase schema
--
-- Paste this ENTIRE file into your Supabase SQL Editor (Database → SQL Editor
-- → New query). Run it once. It creates:
--   - three tables (categories, projects, receipts), all scoped per user
--   - Row Level Security policies so users only see their own rows
--   - a "seed defaults" trigger that gives every new signup a sensible
--     starter palette of categories and one "Household / Personal" project
--   - a storage bucket "receipt-images" with per-user folder isolation
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Categories ───────────────────────────────────────────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#7A6A4F',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.categories (user_id, sort_order);

-- ── Projects ─────────────────────────────────────────────────────────────────
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#3F6E5A',
  budget      numeric(12, 2),
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.projects (user_id);

-- ── Receipts ─────────────────────────────────────────────────────────────────
create table public.receipts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- Optional: which row in your taxonomy
  category_id   uuid references public.categories(id) on delete set null,
  project_id   uuid references public.projects(id)   on delete set null,
  -- Receipt fields
  date          date not null,
  merchant      text not null,
  location      text,
  total         numeric(12, 2) not null,
  gst           numeric(12, 2),
  items         int,
  warranty_months int,
  tags          text[] not null default '{}',
  note          text,
  -- Image + OCR
  image_path    text,                 -- path inside the storage bucket
  ocr_provider  text,                 -- 'mindee' | 'gdocai' | null
  ocr_raw       jsonb,                -- raw extraction payload
  ocr_status    text not null default 'pending',  -- pending|ok|failed|skipped
  -- Timestamps
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.receipts (user_id, date desc);
create index on public.receipts (user_id, project_id);
create index on public.receipts (user_id, category_id);

-- Auto-bump updated_at
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger receipts_touch before update on public.receipts
  for each row execute function public.touch_updated_at();

-- ── Row-Level Security ───────────────────────────────────────────────────────
-- Every table: a user can only see/modify rows where user_id = auth.uid()
alter table public.categories enable row level security;
alter table public.projects   enable row level security;
alter table public.receipts   enable row level security;

create policy "categories: owner read"  on public.categories for select using (user_id = auth.uid());
create policy "categories: owner write" on public.categories for all    using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "projects: owner read"    on public.projects   for select using (user_id = auth.uid());
create policy "projects: owner write"   on public.projects   for all    using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "receipts: owner read"    on public.receipts   for select using (user_id = auth.uid());
create policy "receipts: owner write"   on public.receipts   for all    using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Seed defaults for new signups ────────────────────────────────────────────
create or replace function public.seed_defaults_for_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.categories (user_id, name, color, sort_order) values
    (new.id, 'Tools',     '#A65A2A', 0),
    (new.id, 'Materials', '#7A6A4F', 1),
    (new.id, 'Fuel',      '#3F6E5A', 2),
    (new.id, 'Hardware',  '#8B6FAD', 3),
    (new.id, 'Workwear',  '#C57A4F', 4),
    (new.id, 'Vehicle',   '#5B6E8C', 5),
    (new.id, 'Utilities', '#B89A3E', 6),
    (new.id, 'Household', '#967A6E', 7);
  insert into public.projects (user_id, name, color, budget) values
    (new.id, 'Household / Personal', '#7A6A4F', 3000);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_defaults_for_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKET
--
-- Run this AFTER you've created a bucket named "receipt-images" in the
-- Supabase dashboard (Storage → New bucket → name=receipt-images, PRIVATE).
-- These policies require every uploaded object to live under <user_id>/...
-- so users can only read/write their own folder.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "receipt-images: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipt-images: owner read"
  on storage.objects for select
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "receipt-images: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'receipt-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
