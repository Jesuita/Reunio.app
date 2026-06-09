-- ──────────────────────────────────────────────────────────────────────────────
-- RLS policies for all operational tables.
--
-- Convention:
--   • current_org_id() (security-definer) already exists from migration 003.
--   • All dashboard operations use the anon key + authenticated session.
--   • Public API routes (bookings, availability) use the service_role key
--     and bypass RLS entirely, so no public-INSERT policies are needed here.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── services ─────────────────────────────────────────────────────────────────
create policy "services_select_own_org" on services
  for select using (organization_id = current_org_id());

create policy "services_insert_own_org" on services
  for insert with check (organization_id = current_org_id());

create policy "services_update_own_org" on services
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

create policy "services_delete_own_org" on services
  for delete using (organization_id = current_org_id());

-- ── staff ────────────────────────────────────────────────────────────────────
create policy "staff_select_own_org" on staff
  for select using (organization_id = current_org_id());

create policy "staff_insert_own_org" on staff
  for insert with check (organization_id = current_org_id());

create policy "staff_update_own_org" on staff
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

create policy "staff_delete_own_org" on staff
  for delete using (organization_id = current_org_id());

-- ── schedules ────────────────────────────────────────────────────────────────
create policy "schedules_select_own_org" on schedules
  for select using (organization_id = current_org_id());

create policy "schedules_insert_own_org" on schedules
  for insert with check (organization_id = current_org_id());

create policy "schedules_update_own_org" on schedules
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

create policy "schedules_delete_own_org" on schedules
  for delete using (organization_id = current_org_id());

-- ── schedule_overrides ───────────────────────────────────────────────────────
-- schedule_overrides has no organization_id — access is derived via staff.
create policy "overrides_select_own_org" on schedule_overrides
  for select using (
    staff_id in (select id from staff where organization_id = current_org_id())
  );

create policy "overrides_insert_own_org" on schedule_overrides
  for insert with check (
    staff_id in (select id from staff where organization_id = current_org_id())
  );

create policy "overrides_update_own_org" on schedule_overrides
  for update using (
    staff_id in (select id from staff where organization_id = current_org_id())
  );

create policy "overrides_delete_own_org" on schedule_overrides
  for delete using (
    staff_id in (select id from staff where organization_id = current_org_id())
  );

-- ── clients ──────────────────────────────────────────────────────────────────
create policy "clients_select_own_org" on clients
  for select using (organization_id = current_org_id());

create policy "clients_insert_own_org" on clients
  for insert with check (organization_id = current_org_id());

create policy "clients_update_own_org" on clients
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

-- ── bookings ─────────────────────────────────────────────────────────────────
create policy "bookings_select_own_org" on bookings
  for select using (organization_id = current_org_id());

create policy "bookings_insert_own_org" on bookings
  for insert with check (organization_id = current_org_id());

create policy "bookings_update_own_org" on bookings
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

-- ── payments ─────────────────────────────────────────────────────────────────
create policy "payments_select_own_org" on payments
  for select using (organization_id = current_org_id());

create policy "payments_insert_own_org" on payments
  for insert with check (organization_id = current_org_id());

create policy "payments_update_own_org" on payments
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

-- ── reminders ────────────────────────────────────────────────────────────────
-- reminders has no organization_id — access derived via booking_id.
create policy "reminders_select_own_org" on reminders
  for select using (
    booking_id in (select id from bookings where organization_id = current_org_id())
  );

create policy "reminders_insert_own_org" on reminders
  for insert with check (
    booking_id in (select id from bookings where organization_id = current_org_id())
  );

create policy "reminders_update_own_org" on reminders
  for update using (
    booking_id in (select id from bookings where organization_id = current_org_id())
  );

-- ── branches ─────────────────────────────────────────────────────────────────
create policy "branches_select_own_org" on branches
  for select using (organization_id = current_org_id());

create policy "branches_insert_own_org" on branches
  for insert with check (organization_id = current_org_id());

create policy "branches_update_own_org" on branches
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

-- ── organizations: add UPDATE policy (users can edit their own org) ──────────
create policy "orgs_update_own" on organizations
  for update using (id = current_org_id())
  with check (id = current_org_id());
