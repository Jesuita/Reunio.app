# Reunio — Plan Maestro

## Visión del producto

Reunio es un SaaS multi-rubro de agendamiento de turnos y citas online, orientado al mercado de Argentina y LATAM. Permite a cualquier negocio (peluquerías, spas, clínicas, consultorios, gimnasios, talleres, etc.) ofrecer reservas 24/7, reducir ausencias mediante recordatorios automatizados por WhatsApp, cobrar señas con Mercado Pago y gestionar su agenda desde un panel web.

---

## Modelo de negocio

- **Tipo:** SaaS B2B (el cliente es el negocio; el usuario final es el cliente del negocio)
- **Mercado primario:** Argentina y LATAM
- **Monetización:** suscripción mensual por plan (Free / Pro / Business)
- **Diferenciadores clave:** integración nativa con WhatsApp Business API, Mercado Pago, bot de agendamiento conversacional, multi-rubro desde el día uno

### Planes previstos

| Plan | Precio estimado | Límites |
|------|----------------|---------|
| Free | $0 | 1 profesional, 30 turnos/mes, sin pagos online |
| Pro | ~USD 19/mes | hasta 5 profesionales, turnos ilimitados, WhatsApp + pagos |
| Business | ~USD 49/mes | profesionales ilimitados, multi-sucursal, API, white-label parcial |

---

## Stack tecnológico recomendado

| Capa | Tecnología |
|------|-----------|
| Frontend web | Next.js 14+ (App Router) + Tailwind CSS |
| Backend / API | Next.js API Routes o FastAPI (Python) |
| Base de datos | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Autenticación | Supabase Auth (email, Google OAuth) |
| Pagos LATAM | Mercado Pago Checkout Pro + Payment Links + Webhooks |
| Pagos global | Stripe Billing (suscripciones SaaS) |
| WhatsApp | WhatsApp Business API vía BSP (360dialog o similar) |
| Emails | Resend o SendGrid |
| Deploy | Vercel (frontend) + Railway o Fly.io (backend workers) |
| Monitoreo | Sentry + Posthog |
| CI/CD | GitHub Actions |

---

## Arquitectura multi-tenant

Cada negocio registrado en Reunio es un **tenant** aislado. El aislamiento se implementa a nivel de base de datos mediante `organization_id` en cada tabla (row-level security en Supabase). No se usa una base de datos por tenant.

### Entidades principales del modelo de datos

```
Organization        → el negocio (tenant raíz)
├── Branch          → sucursal(es) del negocio
├── Staff           → profesionales / empleados
├── Service         → servicios ofrecidos (duración, precio, color)
├── Schedule        → horarios y disponibilidad por staff/sucursal
├── Booking         → turno reservado
│   ├── Payment     → seña o pago asociado al turno
│   └── Reminder    → recordatorios enviados
└── Client          → clientes del negocio (CRM básico)

User                → usuario de Reunio (dueño/admin/staff)
Plan                → plan SaaS activo de la organización
```

---

## Flujos principales

### Flujo del cliente final (reserva)
1. Ingresa a la página pública del negocio (`reunio.app/negocio-slug`)
2. Selecciona servicio → profesional → fecha y hora disponible
3. Completa sus datos (nombre, teléfono, email)
4. Si el negocio requiere seña: paga mediante link de Mercado Pago
5. Recibe confirmación por WhatsApp y/o email
6. Recibe recordatorio 24h y 2h antes del turno
7. Puede reprogramar o cancelar desde el link en el mensaje

### Flujo del negocio (administración)
1. Se registra en Reunio y completa el onboarding
2. Configura servicios, staff y horarios
3. Activa integraciones (WhatsApp, Mercado Pago)
4. Recibe y gestiona turnos desde el dashboard
5. Consulta reportes de ocupación, ingresos y no-shows
6. Elige y paga su plan mensual

### Flujo del bot de WhatsApp (agendamiento conversacional)
1. Cliente escribe al número del negocio
2. Bot muestra servicios disponibles
3. Cliente selecciona servicio → fecha → hora
4. Bot solicita seña si aplica y envía link de pago
5. Al confirmar pago → turno creado automáticamente en la agenda
6. Confirmación y recordatorios automáticos

---

## Fases del proyecto

| # | Fase | Semanas | Entregable principal |
|---|------|---------|---------------------|
| 1 | Producto y arquitectura | 1–2 | Decisiones de diseño, modelo de datos, mapa de pantallas |
| 2 | Núcleo del sistema de turnos | 3–7 | Motor de disponibilidad + flujo de reserva funcional |
| 3 | Panel de administración | 7–10 | Dashboard completo para negocios |
| 4 | Pagos y WhatsApp | 10–14 | Mercado Pago + bot WA + recordatorios |
| 5 | SaaS, onboarding y facturación | 14–17 | Planes, suscripciones, página pública de reservas |
| 6 | Lanzamiento y crecimiento | 17–20 | Beta privada → lanzamiento público |

Cada fase tiene su propio archivo de especificación detallada:

- [`FASE_1_producto_arquitectura.md`](./FASE_1_producto_arquitectura.md)
- [`FASE_2_nucleo_turnos.md`](./FASE_2_nucleo_turnos.md)
- [`FASE_3_panel_admin.md`](./FASE_3_panel_admin.md)
- [`FASE_4_pagos_whatsapp.md`](./FASE_4_pagos_whatsapp.md)
- [`FASE_5_saas_onboarding.md`](./FASE_5_saas_onboarding.md)
- [`FASE_6_lanzamiento.md`](./FASE_6_lanzamiento.md)

---

## Reglas para agentes IA

Estas instrucciones aplican a cualquier agente que trabaje sobre este proyecto:

1. **Nunca romper el aislamiento multi-tenant.** Toda query a la base de datos debe filtrar por `organization_id`. Usar RLS (Row Level Security) de Supabase como segunda línea de defensa.
2. **WhatsApp y Mercado Pago son ciudadanos de primera clase.** No son features opcionales; son parte del core para el mercado LATAM.
3. **Mobile-first.** El flujo de reserva del cliente debe funcionar perfectamente en mobile. El panel admin puede ser desktop-first pero debe ser responsivo.
4. **Consistencia de nomenclatura:** usar `booking` (no `appointment`, no `turno`) en el código; usar `organization` (no `tenant`, no `negocio`) en el modelo de datos; usar `staff` (no `professional`, no `employee`) para los profesionales.
5. **Internacionalización desde el día uno.** Fechas en UTC en la base de datos; conversión a timezone del negocio en el frontend. Monedas como string (`"ARS"`, `"MXN"`, etc.).
6. **No guardar datos de tarjetas.** Toda la tokenización la maneja Mercado Pago o Stripe. Reunio solo guarda el ID de preferencia/intención de pago.
7. **Idempotencia en webhooks.** Los webhooks de pago deben ser idempotentes — guardar el `payment_id` externo y verificar antes de procesar.

---

## Métricas de éxito (SaaS KPIs)

- **MRR** (Monthly Recurring Revenue): objetivo mes 6 post-lanzamiento → USD 2.000
- **Churn mensual:** objetivo < 5%
- **Tasa de no-shows de clientes:** reducción del 40%+ vs. sin sistema
- **Time to first booking:** < 10 minutos desde registro del negocio
- **NPS:** > 40 al mes 3

---

## Decisiones pendientes (a resolver en fase 1)

- [ ] ¿Next.js full-stack o separar backend en FastAPI?
- [ ] ¿BSP de WhatsApp: 360dialog, Wati, Twilio o directo con Meta?
- [ ] ¿Subdominio por negocio (`peluqueria-xyz.reunio.app`) o slug en path (`reunio.app/peluqueria-xyz`)?
- [ ] ¿App móvil nativa en fase 1 o PWA primero?
- [ ] ¿Facturación SaaS en Stripe o en Mercado Pago Subscriptions?
