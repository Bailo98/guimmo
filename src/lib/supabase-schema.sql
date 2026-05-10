-- GuImmo Database Schema
-- Run this in your Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  phone text,
  whatsapp text,
  role text not null default 'user' check (role in ('user', 'owner', 'agent', 'agency', 'admin')),
  verified boolean default false,
  avatar_url text,
  trust_score int default 50,
  response_rate int,
  total_listings int default 0,
  created_at timestamptz default now()
);

-- Properties
create table if not exists public.properties (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  type text not null check (type in ('apartment', 'house', 'studio', 'villa', 'room', 'office', 'shop', 'land')),
  transaction_type text not null check (transaction_type in ('rent', 'sale')),
  status text default 'pending' check (status in ('active', 'pending', 'suspended', 'rented', 'sold')),
  price bigint not null,
  price_period text check (price_period in ('month', 'year', 'total')),
  surface int,
  rooms int,
  bathrooms int,
  furnished boolean default false,
  available_now boolean default true,
  neighborhood text not null,
  city text default 'Conakry',
  features text[] default '{}',
  views int default 0,
  whatsapp_clicks int default 0,
  is_boosted boolean default false,
  boost_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Property images
create table if not exists public.property_images (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references public.properties(id) on delete cascade,
  url text not null,
  alt text,
  is_primary boolean default false,
  storage_path text
);

-- Favorites
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  property_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, property_id)
);

-- Messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid not null,
  sender_id uuid references public.profiles(id),
  text text not null,
  sent_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;

-- Policies
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Properties are viewable by everyone" on public.properties for select using (status = 'active' or owner_id = auth.uid());
create policy "Owners can insert properties" on public.properties for insert with check (auth.uid() = owner_id);
create policy "Owners can update own properties" on public.properties for update using (auth.uid() = owner_id);

create policy "Images are viewable by everyone" on public.property_images for select using (true);
create policy "Owners can manage property images" on public.property_images for all using (
  exists (select 1 from public.properties where id = property_id and owner_id = auth.uid())
);

create policy "Users can manage own favorites" on public.favorites for all using (auth.uid() = user_id);

create policy "Users can read own messages" on public.messages for select using (
  auth.uid() = sender_id
);
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
