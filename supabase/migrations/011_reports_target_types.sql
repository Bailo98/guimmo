-- Extend reports to support both property and user/account reports.
-- Safe for existing property reports: old rows become target_type='property'.

alter table reports
  add column if not exists reporter_id uuid references profiles(id) on delete set null,
  add column if not exists target_type text not null default 'property',
  add column if not exists target_id uuid,
  add column if not exists status text not null default 'pending',
  add column if not exists is_handled boolean not null default false;

alter table reports
  alter column property_id drop not null;

update reports
set target_type = 'property',
    target_id = coalesce(target_id, property_id),
    status = case when is_handled then 'reviewed' else status end
where target_id is null or target_type = 'property';

alter table reports
  drop constraint if exists reports_target_type_check,
  add constraint reports_target_type_check check (target_type in ('property', 'user'));

alter table reports
  drop constraint if exists reports_status_check,
  add constraint reports_status_check check (status in ('pending', 'reviewed', 'resolved', 'rejected'));

create index if not exists reports_target_idx on reports(target_type, target_id);
create index if not exists reports_status_idx on reports(status, is_handled);
