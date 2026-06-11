-- ──────────────────────────────────────────────────────────────────────────────
-- Ampliar tabla plans existente para soporte de edición desde admin
-- ──────────────────────────────────────────────────────────────────────────────

-- Nuevas columnas
alter table plans
  add column if not exists label                   text,
  add column if not exists highlight               text,
  add column if not exists is_active               boolean not null default true,
  add column if not exists sort_order              integer not null default 0,
  add column if not exists max_services            integer,
  add column if not exists max_bookings_per_month  integer,
  add column if not exists whatsapp_reminders      boolean not null default false,
  add column if not exists online_payments         boolean not null default false,
  add column if not exists multi_location          boolean not null default false,
  add column if not exists api_access              boolean not null default false,
  add column if not exists custom_branding         boolean not null default false,
  add column if not exists reports                 text not null default 'basic',
  add column if not exists updated_at              timestamptz not null default now();

-- Poblar label desde name para filas existentes
update plans set label = initcap(name) where label is null;

-- Poblar sort_order
update plans set sort_order = case name when 'free' then 1 when 'pro' then 2 when 'business' then 3 else 99 end;

-- Poblar max_bookings_per_month desde max_bookings_month
update plans set max_bookings_per_month = max_bookings_month where max_bookings_per_month is null;

-- Poblar features desde jsonb
update plans set
  whatsapp_reminders = coalesce((features->>'whatsapp')::boolean, false),
  online_payments    = coalesce((features->>'payments')::boolean, false),
  reports            = case when (features->>'reports')::boolean then 'full' else 'basic' end
where features is not null;

-- Pro y Business: activar features
update plans set
  whatsapp_reminders = true, online_payments = true, reports = 'full',
  max_staff = 5, highlight = 'Más popular', sort_order = 2
where name = 'pro';

update plans set
  whatsapp_reminders = true, online_payments = true, multi_location = true,
  api_access = true, custom_branding = true, reports = 'full', sort_order = 3
where name = 'business';

-- label not null después de poblar
alter table plans alter column label set not null;

-- RLS
alter table plans enable row level security;

drop policy if exists "plans_read"  on plans;
drop policy if exists "plans_write" on plans;

create policy "plans_read" on plans for select using (true);

create policy "plans_write" on plans for all
  using (exists (select 1 from platform_admins where user_id = auth.uid()));
