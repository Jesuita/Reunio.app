-- ──────────────────────────────────────────────────────────────────────────────
-- organization_members: links Supabase Auth users to organizations
-- Supports multi-user orgs with role-based access
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'owner'
                    check (role in ('owner', 'admin', 'staff')),
  created_at      timestamptz not null default now(),

  unique(organization_id, user_id)
);

create index if not exists idx_org_members_user_id on organization_members(user_id);
create index if not exists idx_org_members_org_id  on organization_members(organization_id);

-- RLS
alter table organization_members enable row level security;

-- Users can only see memberships for their own orgs
create policy "members_select_own_org" on organization_members
  for select using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Only owners/admins can insert new members
create policy "members_insert_owner" on organization_members
  for insert with check (
    exists (
      select 1 from organization_members
      where organization_id = organization_members.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
    -- Allow inserting yourself as owner when creating the org (no existing members yet)
    or not exists (
      select 1 from organization_members
      where organization_id = organization_members.organization_id
    )
  );

-- Only owners can delete members
create policy "members_delete_owner" on organization_members
  for delete using (
    exists (
      select 1 from organization_members om2
      where om2.organization_id = organization_members.organization_id
        and om2.user_id = auth.uid()
        and om2.role = 'owner'
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- Update /api/register to insert the member row after creating the org.
-- Also store the user_id in organizations.settings for quick lookups.
-- ──────────────────────────────────────────────────────────────────────────────

-- Helper function: get org_id from current auth context (used in RLS policies)
create or replace function current_org_id()
returns uuid language sql stable security definer as $$
  select organization_id from organization_members
  where user_id = auth.uid()
  limit 1;
$$;

-- Update RLS on organizations: user can read their own org
drop policy if exists "orgs_select_own" on organizations;
create policy "orgs_select_own" on organizations
  for select using (
    id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );

-- Seed: link existing demo org to any existing auth users (no-op if none)
-- This runs silently even if auth.users is empty
do $$
begin
  -- intentionally empty: seed users are added in seed.sql
  null;
end $$;
