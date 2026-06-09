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
- [ ] Bloque D — reschedule/cancel por JWT, lista de espera, Google Calendar sync

### Próximo paso
Bloque D: links JWT para autogestión, luego Fase 3 (panel admin completo)

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
