export const SUPABASE_SQL_SCHEMA = `-- RetinaLens PostgreSQL Schema & Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Profiles Table (Tied directly to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  clinic_id text,
  clinic_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 3. Scans Table (Clinical Retinal Screening Records)
create table if not exists public.scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  patient_id text not null,
  eye_side text check (eye_side in ('OD', 'OS')) not null,
  pupil_dilation_status text default 'Dilated',
  image_url text not null,
  gradcam_image_url text,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  dr_severity_level integer check (dr_severity_level between 0 and 4) not null,
  dr_severity_label text not null,
  confidence_score numeric(5, 2) not null,
  findings jsonb default '[]'::jsonb,
  explainability_notes text,
  telemetry jsonb default '{}'::jsonb,
  model_source text default 'matlab_edge_node',
  clinician_notes text
);

-- RLS for Scans (Strict Per-User Isolation)
alter table public.scans enable row level security;

create policy "Clinicians can select their own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Clinicians can insert scans for themselves"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Clinicians can update their own scans"
  on public.scans for update
  using (auth.uid() = user_id);

create policy "Clinicians can delete their own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- 4. Search History Table
create table if not exists public.search_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  query_text text not null,
  searched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Search History
alter table public.search_history enable row level security;

create policy "Users can view their own search history"
  on public.search_history for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own search history"
  on public.search_history for insert
  with check (auth.uid() = user_id);

-- 5. Storage Bucket Configuration for Fundus Images
-- Create 'retinal-scans' bucket in Supabase Storage and enable RLS
insert into storage.buckets (id, name, public)
values ('retinal-scans', 'retinal-scans', false)
on conflict (id) do nothing;

create policy "Clinicians can upload scans into private bucket"
  on storage.objects for insert
  with check (
    bucket_id = 'retinal-scans' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clinicians can view their own uploaded scans"
  on storage.objects for select
  using (
    bucket_id = 'retinal-scans' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
`;
