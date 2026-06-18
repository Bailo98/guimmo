-- 023: Housing requests ("Publier ma recherche")
-- Private demand flow: seekers create requests, matching owners see only
-- requests in their property zones, admins see everything.

create table if not exists public.housing_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  commune text not null,
  property_type text,
  max_budget bigint,
  rooms integer,
  move_in_date date,
  phone text,
  message text,
  status text not null default 'active'
    check (status in ('active', 'matched', 'closed', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.housing_request_notifications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.housing_requests(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  unique (request_id, owner_id)
);

create index if not exists housing_requests_user_id_idx
  on public.housing_requests(user_id);

create index if not exists housing_requests_commune_status_idx
  on public.housing_requests(lower(commune), status, created_at desc);

create index if not exists housing_requests_type_budget_idx
  on public.housing_requests(property_type, max_budget);

create index if not exists housing_request_notifications_owner_seen_idx
  on public.housing_request_notifications(owner_id, seen, created_at desc);

create or replace function public.set_housing_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_housing_requests_updated_at on public.housing_requests;
create trigger set_housing_requests_updated_at
before update on public.housing_requests
for each row
execute function public.set_housing_requests_updated_at();

alter table public.housing_requests enable row level security;
alter table public.housing_request_notifications enable row level security;

drop policy if exists "housing_requests seeker select own" on public.housing_requests;
drop policy if exists "housing_requests seeker insert own" on public.housing_requests;
drop policy if exists "housing_requests seeker update own" on public.housing_requests;
drop policy if exists "housing_requests owner select matching zones" on public.housing_requests;
drop policy if exists "housing_requests admin select all" on public.housing_requests;
drop policy if exists "housing_requests admin update all" on public.housing_requests;
drop policy if exists "housing_requests admin delete all" on public.housing_requests;

create policy "housing_requests seeker select own"
  on public.housing_requests for select
  using (auth.uid() = user_id);

create policy "housing_requests seeker insert own"
  on public.housing_requests for insert
  with check (auth.uid() = user_id);

create policy "housing_requests seeker update own"
  on public.housing_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "housing_requests owner select matching zones"
  on public.housing_requests for select
  using (
    status = 'active'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('owner', 'proprietaire', 'agent', 'agence', 'admin')
          or p.account_type in ('owner', 'proprietaire', 'agent', 'agence')
        )
    )
    and exists (
      select 1
      from public.properties pr
      where pr.owner_id = auth.uid()
        and pr.status in ('active', 'pending')
        and (
          lower(coalesce(pr.neighborhood, '')) = lower(public.housing_requests.commune)
          or lower(coalesce(pr.city, '')) = lower(public.housing_requests.commune)
        )
    )
  );

create policy "housing_requests admin select all"
  on public.housing_requests for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "housing_requests admin update all"
  on public.housing_requests for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "housing_requests admin delete all"
  on public.housing_requests for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "housing_request_notifications owner select own" on public.housing_request_notifications;
drop policy if exists "housing_request_notifications owner update own" on public.housing_request_notifications;
drop policy if exists "housing_request_notifications insert authenticated" on public.housing_request_notifications;
drop policy if exists "housing_request_notifications admin all" on public.housing_request_notifications;

create policy "housing_request_notifications owner select own"
  on public.housing_request_notifications for select
  using (auth.uid() = owner_id);

create policy "housing_request_notifications owner update own"
  on public.housing_request_notifications for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "housing_request_notifications insert authenticated"
  on public.housing_request_notifications for insert
  with check (auth.uid() is not null);

create policy "housing_request_notifications admin all"
  on public.housing_request_notifications for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
