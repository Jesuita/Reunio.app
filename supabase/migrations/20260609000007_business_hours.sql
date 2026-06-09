-- ──────────────────────────────────────────────────────────────────────────────
-- business_hours: horario de apertura del negocio (org-level).
--
-- Distinto de schedules (por profesional). Este horario representa cuándo
-- está abierto el local, se muestra en la página pública y puede usarse
-- como restricción adicional en el motor de disponibilidad.
--
-- Soporta múltiples bloques por día (ej: mañana 9-13 + tarde 16-20).
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists business_hours (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  day_of_week     integer not null check (day_of_week between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),

  constraint business_hours_time_order check (start_time < end_time)
);

create index idx_business_hours_org on business_hours(organization_id);
create index idx_business_hours_day on business_hours(organization_id, day_of_week);

alter table business_hours enable row level security;

create policy "bh_select_own_org" on business_hours
  for select using (organization_id = current_org_id());

create policy "bh_insert_own_org" on business_hours
  for insert with check (organization_id = current_org_id());

create policy "bh_update_own_org" on business_hours
  for update using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

create policy "bh_delete_own_org" on business_hours
  for delete using (organization_id = current_org_id());
