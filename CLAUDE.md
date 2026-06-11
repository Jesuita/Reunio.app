# Reunio — Contexto del proyecto para Claude Code

## Qué es este proyecto
Reunio es un SaaS multi-rubro de agendamiento de turnos online para el mercado LATAM (principalmente Argentina). Lee docs/PLAN_MAESTRO.md para el contexto completo del producto.

## Stack tecnológico
- Frontend/Backend: Next.js 14 con App Router (TypeScript estricto)
- Base de datos: Supabase (PostgreSQL + Auth + Realtime + Storage)
- ORM: Drizzle ORM
- Estilos: Tailwind CSS + shadcn/ui
- Estado cliente: Zustand
- Deploy: Vercel
- Pagos LATAM: Mercado Pago (señas de clientes)
- Pagos SaaS: Stripe (suscripciones de negocios a Reunio)
- WhatsApp: WhatsApp Business API vía 360dialog
- Emails: Resend + React Email
- Jobs/Crons: Inngest
- Monitoreo: Sentry + PostHog

## Documentación de fases
Toda la especificación del producto está en la carpeta /docs:
- PLAN_MAESTRO.md — visión, modelo de datos, arquitectura general, flujos principales
- FASE_1_producto_arquitectura.md — modelo de datos SQL, mapa de pantallas, stack
- FASE_2_nucleo_turnos.md — motor de disponibilidad, API de bookings, flujo de reserva
- FASE_3_panel_admin.md — dashboard, CRM, reportes, permisos
- FASE_4_pagos_whatsapp.md — Mercado Pago, WhatsApp API, bot, recordatorios
- FASE_5_saas_onboarding.md — planes, Stripe billing, onboarding, widget
- FASE_6_lanzamiento.md — beta, QA, go-to-market, métricas

Antes de trabajar en cualquier módulo, leé el archivo de fase correspondiente.

## Convenciones de código obligatorias
- TypeScript estricto (strict: true en tsconfig)
- Nomenclatura en código: booking (no appointment), organization (no tenant), staff (no employee)
- Fechas siempre en UTC en la base de datos; conversión a timezone del negocio solo en frontend
- Monedas como string ISO ("ARS", "MXN", "USD")
- Toda query a Supabase debe filtrar por organization_id (multi-tenant, RLS es segunda línea)
- Webhooks siempre idempotentes: verificar external_id antes de procesar
- Nunca guardar datos de tarjetas — solo IDs y referencias del proveedor
- Errores manejados con Result pattern o neverthrow, no try/catch genérico
- Server Components por defecto; Client Components solo cuando hay interactividad
- Lógica de negocio en /lib o /services, nunca en componentes
- Variables de entorno tipadas con zod en /lib/env.ts
- Commits descriptivos en inglés: feat/fix/chore/docs/test + descripción

## Estado actual del proyecto

### Fase actual
Fase 1 — Producto y arquitectura

### Completado
- [x] Proyecto Next.js 14 con App Router, TypeScript estricto, Tailwind CSS (puerto 8000)
- [x] shadcn/ui configurado (compatibilidad Tailwind v3 aplicada)
- [x] Monorepo Turborepo con packages/database, packages/ui, packages/config
- [x] Migración SQL inicial con 11 tablas, índices, constraints y RLS habilitado
- [x] Schema Drizzle con tipos TypeScript inferidos y constantes de enums
- [x] Variables de entorno tipadas con zod en lib/env.ts
- [x] Supabase local corriendo con migración aplicada
- [x] README con instrucciones de setup completas
- [x] Motor de disponibilidad puro (lib/availability/engine.ts) con 9 tests pasando
- [x] API routes: GET /api/availability, POST /api/bookings, GET+PATCH /api/bookings/[id]
- [x] Página pública /{slug} con servicios agrupados por categoría
- [x] Wizard de reserva 6 pasos (Zustand store + componentes client)
- [x] Seed data: "El Corte Perfecto" con 3 staff, 5 servicios, horarios L-V y sábado
- [x] Admin dashboard: /dashboard (métricas), /dashboard/services (CRUD), /dashboard/staff (horarios), /dashboard/calendar (Realtime)
- [x] Server Actions con zod validation para servicios y staff
- [x] lib/supabase/server.ts + client.ts helpers

### En progreso
- [ ] Fase 6 — Beta, QA, go-to-market, landing page

### Completado recientemente
- [x] Fase 4: Mercado Pago + WhatsApp + recordatorios
  - lib/mercadopago.ts: preference, refund, HMAC verification
  - lib/whatsapp.ts: sendText/Template/Buttons/List, sendWhatsAppReminder
  - lib/whatsapp-bot.ts: state machine completo (idle → completed)
  - lib/reminders.ts: scheduleReminders + processReminders
  - lib/email.ts: Resend transactional emails
  - Webhooks: /api/webhooks/mercadopago, /api/webhooks/whatsapp, /api/webhooks/stripe
  - Crons: /api/cron/reminders (15min), /api/cron/expire-bookings (5min)
  - vercel.json con crons configurados
  - Tests: 7/7 pasando (MP HMAC + WA HMAC)
- [x] Fase 5: SaaS billing + onboarding + widget + API v1
  - lib/plans.ts: PLANS + checkPlanLimit()
  - lib/stripe.ts + Stripe Checkout + Customer Portal
  - /dashboard/billing: comparación de planes, upgrade/portal
  - /pricing: página pública con FAQ
  - /register: wizard 4 pasos (cuenta → negocio → servicio → disponibilidad)
  - /api/register: endpoint que crea org + staff + servicio + horarios
  - /dashboard/widget: configuración + snippet embed
  - public/widget.js: script drop-in con modal iframe
  - API v1: /api/v1/bookings, /api/v1/availability, /api/v1/services, /api/v1/clients
  - lib/api-auth.ts: Bearer token + SHA-256 hashing
  - /api/organizations/[id]/api-keys: generar/revocar keys
  - OnboardingChecklist.tsx: componente reutilizable con progreso circular

### Completado en Fase 6
- [x] Auth — Supabase Auth completo y funcionando:
  - @supabase/ssr instalado; server.ts + client.ts actualizados con cookie-aware clients
  - lib/auth.ts: requireAuth(), getOptionalAuth(), getAuthOrgId()
  - lib/actions/auth.ts: loginAction, logoutAction, registerAction (con admin.createUser)
  - middleware.ts: protege /dashboard/**, redirige a /login, rol staff → /dashboard/calendar
  - app/login/page.tsx + LoginForm.tsx (useFormState de react-dom, no useActionState)
  - app/register: wizard llama a registerAction (real auth + org creation)
  - Migración: organization_members (user_id, org_id, role, RLS)
  - Migración fix: 20260609000004_fix_rls_members.sql — RLS policies sin recursión infinita
  - Todas las páginas del dashboard usan requireAuth() en lugar de ORG_ID hardcodeado
  - Todas las Server Actions usan getOrgId() inline (no importan lib/auth.ts para evitar error de bundler)
  - API Routes usan getAuthOrgId()
  - LogoutButton.tsx en sidebar con logoutAction
  - lib/plans.ts: createClient() importado dinámicamente dentro de checkPlanLimit() (no a nivel de módulo)
  - Usuario demo: demo@reunio.app / demo1234 (vinculado a org El Corte Perfecto)
  - Todas las rutas responden 200; login y dashboard verificados en browser

### Completado en Fase 6 (continuación)
- [x] Landing page / — hero slider, features, how it works, pricing preview, testimonios, directorio, CTA, footer
- [x] Páginas legales: /terminos, /privacidad, /contacto (con formulario conectado a Resend)
- [x] SEO: sitemap.ts (dinámico con páginas de negocios), robots.ts, OG + Twitter meta tags
- [x] Tests: 27/27 pasando
  - lib/whatsapp-bot.test.ts: global commands + session start + state transitions
  - app/api/bookings/route.test.ts: 400/201/409/reuse client/duplicate slot
  - Tests anteriores: engine (9), MP HMAC (4), WA HMAC (3)
- [x] CI: .github/workflows/ci.yml — type-check + vitest en push/PR
- [x] Deploy prep:
  - .env.example: template completo con todas las variables
  - next.config.mjs: security headers (HSTS, X-Frame-Options, X-Content-Type)
  - lib/rate-limit.ts: sliding window IP rate limiter
  - Rate limiting: bookings (10/min), availability (60/min), contact (5/hr)
  - vercel.json: crons + security headers en /api/*
- [x] /explorar: búsqueda full-text multi-tabla, scoring por relevancia, is_featured (plan Pro)
- [x] Página pública /{slug}: hero, sticky category nav, filtro por staff, fotos de perfil
- [x] Booking wizard: filtro staff por servicio, fotos en step 2, botón volver en step 1
- [x] Dashboard staff: upload de foto de perfil (Supabase Storage, bucket avatars)
- [x] Admin: /admin/categories (categorías de plataforma), /admin/organizations con filtros
- [x] Migraciones: staff_services, storage_avatars, org_is_featured, booking_unique_slot, etc.

### Completado en Deploy
- [x] Supabase producción: proyecto wqyfgbneozaylmrzspks, 22 migraciones aplicadas
- [x] Vercel deploy: reunio-app-web, conectado a GitHub main (auto-deploy)
- [x] Dominio: reunio.lat (Namecheap) → apuntado a Vercel, SSL activo
- [x] Bucket avatars creado en Supabase Storage producción
- [x] Usuario admin: plataforma con is_platform_admin en app_metadata
- [x] ~500 ciudades de Argentina (tabla cities) con autocompletado en registro
- [x] ~120 categorías de servicios cargadas en platform_categories
- [x] Fix engine: procesa múltiples bloques horarios por día (mañana + tarde)
- [x] CategorySelect: combobox con búsqueda para selección única en wizard

### Próximo paso
Beta privada: reclutar 5-10 negocios reales en Argentina

### Pasos manuales pendientes para deploy
1. `npx supabase login` → `npx supabase link --project-ref <ref>`
2. `npx supabase db push` (aplica las 21 migraciones en prod)
3. Crear bucket `avatars` en Supabase prod Storage (o incluirlo en migración)
4. Configurar variables de entorno en Vercel (ver .env.example)
5. Agregar `CRON_SECRET` en Vercel env vars
6. Conectar dominio reunio.app en Vercel → actualizar DNS
7. Crear productos en Stripe (Pro + Business) → copiar price IDs a env vars
8. Configurar webhook de Stripe apuntando a https://reunio.app/api/webhooks/stripe

### Decisiones tomadas
(actualizar a medida que se toman decisiones de arquitectura)

## Variables de entorno
Todas van en .env.local (nunca en el código ni en commits):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mercado Pago (pagos de clientes)
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

# Stripe (suscripciones SaaS)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# WhatsApp / 360dialog
WHATSAPP_API_TOKEN=
WHATSAPP_API_URL=https://waba.360dialog.io/v1

# Resend (emails)
RESEND_API_KEY=

# Inngest (jobs)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=
```

## Reglas de trabajo
1. Antes de cada tarea nueva, leé el archivo de fase correspondiente en /docs
2. Antes de implementar algo no especificado en los docs, consultame
3. Hacé commits descriptivos después de cada funcionalidad completa
4. Los tests son obligatorios para: motor de disponibilidad, webhooks de pago, bot de WA
5. Actualizá la sección "Estado actual" de este archivo al terminar cada sesión
6. Si algo de los docs es ambiguo o contradictorio, señalalo antes de proceder
