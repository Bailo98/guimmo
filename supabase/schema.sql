-- GuImmo – Production Schema
-- Run once in Supabase SQL editor

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'buyer'
                check (role in ('buyer','owner','agent','agency','admin')),
  agency_name text,
  avatar_url  text,
  is_verified boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on new signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Properties ───────────────────────────────────────────────────────────────
create table if not exists properties (
  id                 uuid primary key default uuid_generate_v4(),
  owner_id           uuid not null references profiles(id) on delete cascade,
  title              text not null,
  description        text,
  type               text not null check (type in ('apartment','house','studio','villa','room','land')),
  transaction_type   text not null check (transaction_type in ('rent','sale')),
  status             text not null default 'active' check (status in ('active','pending','archived')),
  price              bigint not null,
  price_period       text default 'month' check (price_period in ('month','total','year')),
  surface            integer,
  rooms              integer default 1,
  bathrooms          integer default 0,
  furnished          boolean default false,
  available_now      boolean default true,
  neighborhood       text not null,
  city               text not null default 'Conakry',
  features           text[] default '{}',
  contact_phone      text,
  contact_preference text default 'both' check (contact_preference in ('whatsapp','call','both')),
  short_ref          text unique,
  video_url          text,
  is_boosted         boolean default false,
  boost_expires_at   timestamptz,
  views              integer not null default 0,
  whatsapp_clicks    integer not null default 0,
  latitude           double precision,
  longitude          double precision,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists properties_status_created_idx on properties(status, created_at desc);
create index if not exists properties_owner_idx on properties(owner_id);
create index if not exists properties_neighborhood_idx on properties(neighborhood);
create index if not exists properties_short_ref_idx on properties(short_ref);

-- ─── Property images ──────────────────────────────────────────────────────────
create table if not exists property_images (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  url         text not null,
  alt         text,
  is_primary  boolean default false,
  sort_order  integer default 0,
  created_at  timestamptz not null default now()
);

create index if not exists property_images_property_idx on property_images(property_id);

-- ─── Favorites ────────────────────────────────────────────────────────────────
create table if not exists favorites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, property_id)
);

create index if not exists favorites_user_idx on favorites(user_id);

-- ─── Messages ─────────────────────────────────────────────────────────────────
create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete set null,
  sender_id   uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists messages_receiver_idx on messages(receiver_id, created_at desc);
create index if not exists messages_sender_idx on messages(sender_id, created_at desc);
create index if not exists messages_property_idx on messages(property_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table profiles        enable row level security;
alter table properties      enable row level security;
alter table property_images enable row level security;
alter table favorites       enable row level security;
alter table messages        enable row level security;

-- profiles
create policy "Public profiles are viewable" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- properties
create policy "Active properties are viewable" on properties for select
  using (status = 'active' or auth.uid() = owner_id);
create policy "Owners can insert" on properties for insert
  with check (auth.uid() = owner_id);
create policy "Owners can update own" on properties for update
  using (auth.uid() = owner_id);
create policy "Owners can delete own" on properties for delete
  using (auth.uid() = owner_id);

-- property_images
create policy "Images viewable" on property_images for select using (true);
create policy "Owners can insert images" on property_images for insert
  with check (
    auth.uid() = (select owner_id from properties where id = property_id)
  );
create policy "Owners can delete images" on property_images for delete
  using (
    auth.uid() = (select owner_id from properties where id = property_id)
  );

-- favorites
create policy "Users can view own favorites" on favorites for select
  using (auth.uid() = user_id);
create policy "Users can add favorites" on favorites for insert
  with check (auth.uid() = user_id);
create policy "Users can remove favorites" on favorites for delete
  using (auth.uid() = user_id);

-- messages
create policy "Users can read own messages" on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on messages for insert
  with check (auth.uid() = sender_id);
create policy "Receivers can mark read" on messages for update
  using (auth.uid() = receiver_id or auth.uid() = sender_id);

-- ─── Agents ──────────────────────────────────────────────────────────────────
create table if not exists agents (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  neighborhood   text not null,
  whatsapp       text not null,
  phone          text,
  photo_url      text,
  description    text,
  is_active      boolean not null default true,
  listings_count integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists agents_neighborhood_idx on agents(neighborhood);

alter table agents enable row level security;
create policy "Agents are viewable by all" on agents for select using (is_active = true);

-- Demo agents (run once)
insert into agents (name, neighborhood, whatsapp, description, listings_count) values
  ('Mamadou Diallo',  'kipe',       '+224628000001', 'Spécialiste location Kipé & Ratoma depuis 5 ans.', 12),
  ('Fatoumata Bah',   'hamdallaye', '+224628000002', 'Expert vente villa haut standing.',               8),
  ('Ibrahima Sow',    'matam',      '+224628000003', 'Annonces vérifiées, réponse rapide.',             15),
  ('Aissatou Barry',  'dixinn',     '+224628000004', 'Locations meublées et non meublées Dixinn.',      6)
on conflict do nothing;

-- ─── Agent applications ───────────────────────────────────────────────────────
create table if not exists agent_applications (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  phone        text not null,
  neighborhood text not null,
  status       text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now()
);

alter table agent_applications enable row level security;
create policy "Anyone can apply to be agent" on agent_applications for insert with check (true);
create policy "Admins can read applications" on agent_applications for select
  using (auth.uid() in (select id from profiles where role = 'admin'));

-- ─── Reports ──────────────────────────────────────────────────────────────────
create table if not exists reports (
  id             uuid primary key default uuid_generate_v4(),
  property_id    uuid not null references properties(id) on delete cascade,
  reason         text not null,
  details        text,
  reporter_phone text,
  created_at     timestamptz not null default now()
);

create index if not exists reports_property_idx on reports(property_id);

alter table reports enable row level security;
create policy "Anyone can submit a report" on reports for insert with check (true);
create policy "Admins can read reports" on reports for select
  using (auth.uid() in (select id from profiles where role = 'admin'));

-- Admin can delete reports (for masquer/ignorer actions)
create policy "Admins can delete reports" on reports for delete
  using (auth.uid() in (select id from profiles where role = 'admin'));

-- ─── Utility functions ───────────────────────────────────────────────────────
create or replace function increment_views(property_id uuid)
returns void language sql security definer as $$
  update properties set views = views + 1 where id = property_id;
$$;

-- ─── Storage buckets ──────────────────────────────────────────────────────────
-- Run these via the Supabase Storage API or dashboard:
-- bucket: property-images  → public: true, file size limit: 5MB
-- bucket: avatars          → public: true, file size limit: 2MB

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-images', 'property-images', true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('avatars',         'avatars',         true, 2097152,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Property images are public" on storage.objects for select
  using (bucket_id = 'property-images');
create policy "Auth users can upload property images" on storage.objects for insert
  with check (bucket_id = 'property-images' and auth.role() = 'authenticated');
create policy "Owners can delete property images" on storage.objects for delete
  using (bucket_id = 'property-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars are public" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "Auth users can upload avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users can delete own avatar" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
