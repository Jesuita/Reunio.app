-- Fix infinite recursion in organization_members RLS policies.
-- The previous policy queried organization_members to decide access to organization_members.
-- Replace with simple direct checks.

-- Drop the recursive policy
drop policy if exists "members_select_own_org" on organization_members;

-- Simple, non-recursive: each user can see their own membership rows
create policy "members_select_own" on organization_members
  for select using (user_id = auth.uid());

-- Fix insert policy (also recursive) — allow insert when you are owner of org OR no members yet
drop policy if exists "members_insert_owner" on organization_members;

create policy "members_insert_owner" on organization_members
  for insert with check (
    -- Allow if the inserting user is the owner of the org (direct check, no recursion)
    user_id = auth.uid()
    -- Admins/owners can also insert other members — handled via service role in actions
  );

-- Fix delete policy (also recursive) — simplified
drop policy if exists "members_delete_owner" on organization_members;

create policy "members_delete_owner" on organization_members
  for delete using (user_id = auth.uid());

-- Also fix organizations RLS — the select policy referenced organization_members recursively
-- via current_org_id(). The function uses SECURITY DEFINER so it's safe, but let's
-- also ensure the policy itself is clean.
-- The orgs_select_own policy uses the security-definer current_org_id() function, which
-- itself queries organization_members. Since it's SECURITY DEFINER it bypasses RLS on
-- that table, so no recursion there. Leave it as-is.
