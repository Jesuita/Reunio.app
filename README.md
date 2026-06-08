# Reunio

SaaS de agendamiento de turnos online para el mercado LATAM. Permite a cualquier negocio ofrecer reservas 24/7, recordatorios por WhatsApp, cobro de señas con Mercado Pago y gestión de agenda desde un panel web.

## Stack

- **App:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Base de datos:** Supabase (PostgreSQL + Auth + Realtime)
- **ORM:** Drizzle ORM
- **Monorepo:** Turborepo + npm workspaces
- **Deploy:** Vercel

## Requisitos

- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (para desarrollo local)
- Docker Desktop (requerido por Supabase CLI)

## Setup inicial

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url> reunio
cd reunio
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example apps/web/.env.local
```

Editá `apps/web/.env.local` y completá los valores. Las variables mínimas para desarrollo local son:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ver output de supabase start>
SUPABASE_SERVICE_ROLE_KEY=<ver output de supabase start>
NEXT_PUBLIC_APP_URL=http://localhost:8000
JWT_SECRET=<cualquier string de 32+ caracteres>
```

Las variables de Mercado Pago, Stripe, WhatsApp, Resend, Inngest, Sentry y PostHog pueden dejarse vacías hasta que se trabaje en esos módulos. Para omitir la validación al iniciar:

```bash
# En apps/web/.env.local
SKIP_ENV_VALIDATION=1
```

### 3. Levantar Supabase local

```bash
npx supabase init       # solo la primera vez, crea la carpeta supabase/
npx supabase start      # levanta Postgres, Auth, Storage y Studio
```

El output de `supabase start` muestra las claves a copiar en `.env.local`.

Aplicar la migración inicial:

```bash
npx supabase db reset   # aplica todas las migraciones desde cero
```

O manualmente:

```bash
npx supabase migration up
```

Supabase Studio queda disponible en `http://localhost:54323`.

### 4. Levantar el servidor de desarrollo

```bash
npm run dev
```

La app corre en **http://localhost:8000**.

Para correr solo la app web sin Turborepo:

```bash
cd apps/web
npm run dev
```

## Estructura del repositorio

```
reunio/
├── apps/
│   └── web/                    # Next.js app (frontend + API routes)
│       ├── app/                # App Router: layouts, páginas, rutas API
│       ├── components/         # Componentes React
│       │   └── ui/             # shadcn/ui (no editar manualmente)
│       ├── lib/                # Utilidades y lógica compartida
│       │   ├── env.ts          # Variables de entorno tipadas con zod
│       │   └── utils.ts        # cn() y helpers generales
│       └── services/           # Lógica de negocio (bookings, staff, etc.)
├── packages/
│   ├── database/               # Schema Drizzle, migraciones SQL, cliente Supabase
│   │   ├── migrations/         # Archivos SQL de migración
│   │   └── src/
│   │       ├── client.ts       # Cliente Supabase
│   │       ├── schema.ts       # Tipos Drizzle exportados
│   │       └── index.ts        # Re-exports
│   ├── ui/                     # Componentes compartidos entre apps (futuro)
│   └── config/                 # tsconfig base y eslint compartidos
├── docs/                       # Especificación del producto por fase
├── .env.example                # Variables de entorno de referencia
├── package.json                # Root — workspaces + scripts Turborepo
└── turbo.json                  # Pipeline de Turborepo
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levanta todas las apps en modo desarrollo |
| `npm run build` | Build de producción de todas las apps |
| `npm run lint` | Lint en todos los paquetes |
| `npm run typecheck` | Type checking en todos los paquetes |

Desde `apps/web/`:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo en puerto 8000 |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |

Desde `packages/database/`:

| Comando | Descripción |
|---------|-------------|
| `npm run db:generate` | Genera migraciones Drizzle desde el schema |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:studio` | Abre Drizzle Studio |

## Convenciones de código

- TypeScript estricto (`strict: true`) en todos los paquetes
- Nomenclatura: `booking` (no appointment), `organization` (no tenant), `staff` (no employee)
- Fechas en UTC en la base de datos; conversión al timezone del negocio solo en el frontend
- Monedas como string ISO: `"ARS"`, `"MXN"`, `"USD"`
- Toda query a Supabase filtra por `organization_id` (multi-tenant)
- Server Components por defecto; Client Components solo cuando hay interactividad
- Lógica de negocio en `/lib` o `/services`, nunca en componentes
- Errores con Result pattern o `neverthrow`, no `try/catch` genérico
- Commits en inglés: `feat/fix/chore/docs/test: descripción`

## Documentación del producto

La especificación completa está en `/docs`:

| Archivo | Contenido |
|---------|-----------|
| `PLAN_MAESTRO.md` | Visión, modelo de negocio, arquitectura general |
| `FASE_1_producto_arquitectura.md` | Modelo de datos, mapa de pantallas, stack |
| `FASE_2_nucleo_turnos.md` | Motor de disponibilidad, API de bookings |
| `FASE_3_panel_admin.md` | Dashboard, CRM, reportes |
| `FASE_4_pagos_whatsapp.md` | Mercado Pago, WhatsApp API, bot |
| `FASE_5_saas_onboarding.md` | Planes, Stripe billing, onboarding |
| `FASE_6_lanzamiento.md` | Beta, QA, go-to-market |
