-- Owner identity verification requests.
-- Documents are stored in a private Supabase Storage bucket and must not be public.

create table if not exists public.owner_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  document_type text not null check (document_type in ('id_card', 'passport', 'driver_license', 'other')),
  document_number text not null,
  document_path text not null,
  selfie_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists owner_verification_requests_user_id_idx
  on public.owner_verification_requests(user_id);

create index if not exists owner_verification_requests_status_idx
  on public.owner_verification_requests(status, created_at desc);

alter table public.owner_verification_requests enable row level security;

drop policy if exists "owner verification select own" on public.owner_verification_requests;
create policy "owner verification select own"
  on public.owner_verification_requests
  for select
  using (auth.uid() = user_id or is_admin());

drop policy if exists "owner verification insert own" on public.owner_verification_requests;
create policy "owner verification insert own"
  on public.owner_verification_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "owner verification update admin" on public.owner_verification_requests;
create policy "owner verification update admin"
  on public.owner_verification_requests
  for update
  using (is_admin())
  with check (is_admin());

insert into storage.buckets (id, name, public)
values ('owner-verification-documents', 'owner-verification-documents', false)
on conflict (id) do nothing;

drop policy if exists "owner verification upload own folder" on storage.objects;
create policy "owner verification upload own folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'owner-verification-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "owner verification read own or admin" on storage.objects;
create policy "owner verification read own or admin"
  on storage.objects
  for select
  using (
    bucket_id = 'owner-verification-documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or is_admin())
  );
