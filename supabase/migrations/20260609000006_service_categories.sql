-- ──────────────────────────────────────────────────────────────────────────────
-- service_categories: org-scoped list of categories for grouping services.
-- Replaces the free-text "category" field on services with a FK reference.
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists service_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  color           text not null default '#6366F1',
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),

  unique(organization_id, name)
);

create index idx_service_categories_org on service_categories(organization_id);

alter table service_categories enable row level security;

create policy "categories_select_own_org" on service_categories
  for select using (organization_id = current_org_id());

create policy "categories_insert_own_org" on service_categories
  for insert with check (organization_id = current_org_id());

create policy "categories_update_own_org" on service_categories
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

create policy "categories_delete_own_org" on service_categories
  for delete using (organization_id = current_org_id());

-- Add FK on services.category_id (nullable for backwards compatibility)
alter table services
  add column if not exists category_id uuid references service_categories(id) on delete set null;

-- Seed default categories from existing services for any existing data
-- (idempotent: only runs if there are orgs without categories already seeded)
do $$
declare
  r record;
  cat_id uuid;
begin
  for r in
    select distinct organization_id, category
    from services
    where category is not null and category != ''
  loop
    insert into service_categories(organization_id, name)
    values (r.organization_id, r.category)
    on conflict (organization_id, name) do nothing
    returning id into cat_id;

    if cat_id is null then
      select id into cat_id
      from service_categories
      where organization_id = r.organization_id and name = r.category;
    end if;

    update services
    set category_id = cat_id
    where organization_id = r.organization_id
      and category = r.category
      and category_id is null;
  end loop;
end $$;
