-- ──────────────────────────────────────────────────────────────────────────────
-- Reestructurar planes: Free ajustado + nuevo Starter + Pro/Business actualizados
-- ──────────────────────────────────────────────────────────────────────────────

-- Ajustar Free: 1 staff, 1 servicio, 30 turnos
update plans set
  max_staff               = 1,
  max_services            = 1,
  max_bookings_per_month  = 30,
  max_bookings_month      = 30,
  price_ars               = 0,
  price_usd               = 0,
  whatsapp_reminders      = false,
  online_payments         = false,
  reports                 = 'basic',
  sort_order              = 1,
  label                   = 'Free'
where name = 'free';

-- Insertar Starter (si no existe)
insert into plans (
  id, name, label, price_ars, price_usd,
  max_staff, max_services, max_bookings_per_month, max_bookings_month,
  whatsapp_reminders, online_payments, multi_location, api_access, custom_branding,
  reports, sort_order, is_active, highlight,
  features
)
values (
  gen_random_uuid(), 'starter', 'Starter', 6000, 6,
  2, 3, 200, 200,
  false, false, false, false, false,
  'basic', 2, true, null,
  '{"whatsapp": false, "payments": false, "reports": false}'
)
on conflict (name) do update set
  label                   = 'Starter',
  price_ars               = 6000,
  price_usd               = 6,
  max_staff               = 2,
  max_services            = 3,
  max_bookings_per_month  = 200,
  max_bookings_month      = 200,
  whatsapp_reminders      = false,
  online_payments         = false,
  reports                 = 'basic',
  sort_order              = 2,
  is_active               = true;

-- Ajustar Pro: 10 staff, servicios ilimitados, 500 turnos
update plans set
  max_staff               = 10,
  max_services            = null,
  max_bookings_per_month  = 500,
  max_bookings_month      = 500,
  price_ars               = 19000,
  price_usd               = 19,
  whatsapp_reminders      = true,
  online_payments         = true,
  reports                 = 'full',
  sort_order              = 3,
  highlight               = 'Más popular',
  label                   = 'Pro'
where name = 'pro';

-- Ajustar Business: todo ilimitado
update plans set
  max_staff               = null,
  max_services            = null,
  max_bookings_per_month  = null,
  max_bookings_month      = null,
  price_ars               = 49000,
  price_usd               = 49,
  whatsapp_reminders      = true,
  online_payments         = true,
  multi_location          = true,
  api_access              = true,
  custom_branding         = true,
  reports                 = 'full',
  sort_order              = 4,
  label                   = 'Business'
where name = 'business';
