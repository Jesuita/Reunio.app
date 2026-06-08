# Fase 1 — Producto y arquitectura

**Duración estimada:** semanas 1–2  
**Objetivo:** tomar todas las decisiones de diseño, definir el modelo de datos completo, mapear cada pantalla del producto y configurar el entorno de desarrollo antes de escribir código de negocio.

---

## Tareas de esta fase

### 1.1 Definición de personas y casos de uso

Identificar los tres actores del sistema y sus necesidades principales:

**Actor 1: Dueño del negocio (admin)**
- Registrar su negocio en Reunio
- Configurar servicios, staff, horarios y precios
- Ver y gestionar todos los turnos
- Consultar reportes de ingresos y ocupación
- Activar integraciones (WhatsApp, Mercado Pago)
- Elegir y pagar su plan mensual

**Actor 2: Staff / profesional**
- Ver su propia agenda del día/semana
- Gestionar sus propios turnos (confirmar, reprogramar, cancelar)
- Ver datos básicos del cliente que tiene asignado
- Bloquear tiempo en su agenda (vacaciones, pausas)

**Actor 3: Cliente final**
- Reservar un turno 24/7 desde web o WhatsApp
- Pagar la seña si se requiere
- Recibir confirmación y recordatorios
- Reprogramar o cancelar su turno self-service

### 1.2 Rubros a soportar desde el día uno

El sistema debe ser configurable para cubrir al menos:

| Rubro | Particularidades |
|-------|-----------------|
| Peluquería / barbería | múltiples servicios, múltiples profesionales, duración variable |
| Spa / estética | servicios con preparación previa, salas/cabinas como recurso |
| Clínica / consultorio médico | datos sensibles del cliente, posibles turnos recurrentes |
| Psicólogo / nutricionista | sesiones semanales recurrentes, citas virtuales (Zoom) |
| Gimnasio / pilates / yoga | clases grupales con cupo máximo |
| Taller mecánico / fotografía | recursos adicionales (equipos, vehículo) |

### 1.3 Modelo de datos completo

#### Tabla: `organizations`
```sql
id                  uuid PRIMARY KEY
name                text NOT NULL
slug                text UNIQUE NOT NULL        -- ej: "peluqueria-maria"
category            text                        -- ej: "beauty", "health", "fitness"
timezone            text DEFAULT 'America/Argentina/Buenos_Aires'
phone               text
address             text
logo_url            text
settings            jsonb DEFAULT '{}'          -- configuración flexible
plan_id             uuid REFERENCES plans(id)
created_at          timestamptz DEFAULT now()
```

#### Tabla: `branches`
```sql
id                  uuid PRIMARY KEY
organization_id     uuid REFERENCES organizations(id)
name                text NOT NULL
address             text
phone               text
is_main             boolean DEFAULT false
created_at          timestamptz DEFAULT now()
```

#### Tabla: `staff`
```sql
id                  uuid PRIMARY KEY
organization_id     uuid REFERENCES organizations(id)
branch_id           uuid REFERENCES branches(id)
user_id             uuid REFERENCES auth.users(id)  -- puede ser null si no tiene login
name                text NOT NULL
email               text
phone               text
avatar_url          text
role                text DEFAULT 'staff'            -- 'admin' | 'staff'
is_active           boolean DEFAULT true
created_at          timestamptz DEFAULT now()
```

#### Tabla: `services`
```sql
id                  uuid PRIMARY KEY
organization_id     uuid REFERENCES organizations(id)
name                text NOT NULL
description         text
duration_minutes    integer NOT NULL
price               numeric(10,2)
deposit_amount      numeric(10,2)               -- monto de seña (null = sin seña)
deposit_percent     integer                     -- alternativa: % del precio
color               text                        -- para el calendario
is_active           boolean DEFAULT true
category            text
created_at          timestamptz DEFAULT now()
```

#### Tabla: `schedules`
```sql
id                  uuid PRIMARY KEY
organization_id     uuid REFERENCES organizations(id)
staff_id            uuid REFERENCES staff(id)
day_of_week         integer                     -- 0=domingo, 6=sábado
start_time          time NOT NULL
end_time            time NOT NULL
is_active           boolean DEFAULT true
```

#### Tabla: `schedule_overrides`
```sql
id                  uuid PRIMARY KEY
staff_id            uuid REFERENCES staff(id)
date                date NOT NULL
is_day_off          boolean DEFAULT false
start_time          time
end_time            time
reason              text
```

#### Tabla: `clients`
```sql
id                  uuid PRIMARY KEY
organization_id     uuid REFERENCES organizations(id)
name                text NOT NULL
email               text
phone               text NOT NULL               -- para WhatsApp
notes               text
no_show_count       integer DEFAULT 0
tags                text[]
created_at          timestamptz DEFAULT now()
```

#### Tabla: `bookings`
```sql
id                  uuid PRIMARY KEY
organization_id     uuid REFERENCES organizations(id)
branch_id           uuid REFERENCES branches(id)
staff_id            uuid REFERENCES staff(id)
service_id          uuid REFERENCES services(id)
client_id           uuid REFERENCES clients(id)
starts_at           timestamptz NOT NULL
ends_at             timestamptz NOT NULL
status              text DEFAULT 'pending'      -- 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
payment_status      text DEFAULT 'unpaid'       -- 'unpaid' | 'deposit_paid' | 'paid'
notes               text
source              text DEFAULT 'web'          -- 'web' | 'whatsapp' | 'admin' | 'widget'
created_at          timestamptz DEFAULT now()
```

#### Tabla: `payments`
```sql
id                  uuid PRIMARY KEY
booking_id          uuid REFERENCES bookings(id)
organization_id     uuid REFERENCES organizations(id)
provider            text NOT NULL               -- 'mercadopago' | 'stripe'
external_id         text UNIQUE                 -- ID del proveedor (idempotencia)
amount              numeric(10,2) NOT NULL
currency            text DEFAULT 'ARS'
status              text DEFAULT 'pending'      -- 'pending' | 'approved' | 'rejected' | 'refunded'
type                text DEFAULT 'deposit'      -- 'deposit' | 'full'
metadata            jsonb DEFAULT '{}'
created_at          timestamptz DEFAULT now()
```

#### Tabla: `reminders`
```sql
id                  uuid PRIMARY KEY
booking_id          uuid REFERENCES bookings(id)
channel             text NOT NULL               -- 'whatsapp' | 'email' | 'sms'
type                text NOT NULL               -- 'confirmation' | '24h' | '2h' | 'followup'
status              text DEFAULT 'pending'      -- 'pending' | 'sent' | 'failed'
sent_at             timestamptz
created_at          timestamptz DEFAULT now()
```

#### Tabla: `plans`
```sql
id                  uuid PRIMARY KEY
name                text NOT NULL               -- 'free' | 'pro' | 'business'
max_staff           integer                     -- null = ilimitado
max_bookings_month  integer                     -- null = ilimitado
features            jsonb DEFAULT '{}'
price_ars           numeric(10,2)
price_usd           numeric(10,2)
stripe_price_id     text
```

### 1.4 Mapa de pantallas

#### Área pública (sin login)

```
/                           Landing page de Reunio (marketing)
/pricing                    Página de planes y precios
/register                   Registro de nuevo negocio
/login                      Login
/[slug]                     Página pública de reservas del negocio
/[slug]/booking             Flujo de reserva (paso a paso)
/[slug]/booking/confirm     Confirmación post-reserva
/booking/[id]/reschedule    Reprogramar turno (desde link en WA/email)
/booking/[id]/cancel        Cancelar turno (desde link en WA/email)
```

#### Área privada — Admin / Staff

```
/dashboard                  Dashboard principal con métricas
/dashboard/calendar         Vista de agenda (día/semana/mes)
/dashboard/bookings         Lista de todos los turnos
/dashboard/bookings/[id]    Detalle de un turno
/dashboard/clients          Lista de clientes (CRM)
/dashboard/clients/[id]     Ficha del cliente
/dashboard/services         Gestión de servicios
/dashboard/staff            Gestión de staff
/dashboard/staff/[id]       Horarios y perfil del profesional
/dashboard/settings         Configuración del negocio
/dashboard/settings/integrations  WhatsApp, Mercado Pago, Google Cal
/dashboard/settings/notifications  Plantillas de mensajes
/dashboard/reports          Reportes e indicadores
/dashboard/billing          Plan actual y facturación
```

### 1.5 Decisiones de stack (confirmar)

- [ ] **Framework:** Next.js 14 con App Router (full-stack, un solo repositorio)
- [ ] **Base de datos:** Supabase (PostgreSQL + RLS + Realtime)
- [ ] **Auth:** Supabase Auth
- [ ] **ORM:** Drizzle ORM o Prisma sobre Supabase
- [ ] **Estilos:** Tailwind CSS + shadcn/ui
- [ ] **Estado cliente:** Zustand o Jotai
- [ ] **Fechas:** date-fns + timezone support
- [ ] **Testing:** Vitest (unit) + Playwright (e2e)
- [ ] **Deploy:** Vercel
- [ ] **Workers/Crons:** Vercel Cron Jobs o Inngest (para recordatorios programados)

### 1.6 Configuración del entorno de desarrollo

```bash
# Estructura de repositorio
reunio/
├── apps/
│   └── web/                # Next.js app
├── packages/
│   ├── database/           # schema, migrations, tipos compartidos
│   ├── ui/                 # componentes de diseño compartidos
│   └── config/             # eslint, tsconfig compartidos
├── .github/
│   └── workflows/          # CI/CD pipelines
└── README.md
```

**Entornos:**
- `development` → Supabase local (`supabase start`)
- `staging` → proyecto Supabase separado + Vercel preview
- `production` → proyecto Supabase producción + Vercel producción

### 1.7 Convenciones de código para agentes

- Lenguaje: TypeScript estricto (`strict: true`)
- Carpetas en kebab-case, componentes en PascalCase, funciones en camelCase
- Server Components por defecto; Client Components solo cuando se necesite interactividad
- Toda lógica de negocio va en `/lib` o `/services`, nunca en componentes
- Variables de entorno tipadas con `zod` en `/lib/env.ts`
- Errores manejados con Result pattern o `neverthrow`, no con try/catch genérico

---

## Entregables de esta fase

- [ ] Modelo de datos validado y migración inicial escrita
- [ ] Mapa de pantallas aprobado
- [ ] Repositorio configurado con monorepo (Turborepo)
- [ ] Supabase local funcionando con seed de datos de prueba
- [ ] README con instrucciones de setup para el equipo
- [ ] Decisiones de stack documentadas y cerradas

---

## Siguiente fase

Una vez completos los entregables → continuar con [`FASE_2_nucleo_turnos.md`](./FASE_2_nucleo_turnos.md)
