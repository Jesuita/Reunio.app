# Guía de configuración — Claude Code para Reunio

Esta guía está pensada para alguien sin experiencia técnica que quiere usar Claude Code como agente autónomo para construir Reunio. Seguí los pasos en orden.

---

## Paso 1 — Instalación de Claude Code

### ¿Qué sistema operativo tenés?

#### macOS
Abrí la aplicación **Terminal** (la encontrás en Aplicaciones → Utilidades o buscando "Terminal") y pegá este comando:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

#### Windows
Abrí el **Terminal de Windows** (buscá "Terminal" en el menú inicio) y pegá:

```powershell
irm https://claude.ai/install.ps1 | iex
```

> Si ves un error que dice que no reconoce el comando, instalá primero **Git for Windows** desde https://git-scm.com/downloads/win (instalación por defecto, siguiente, siguiente, finalizar) y volvé a intentar.

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Alternativa sin terminal — App de escritorio

Si el terminal te genera fricción, Claude Code tiene una **app de escritorio** con interfaz gráfica:
- macOS: https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect
- Windows: https://claude.com/download

La app de escritorio hace lo mismo que el terminal pero con ventanas. Recomendada si es tu primera vez.

### Verificar que se instaló bien

En el terminal escribí:
```bash
claude --version
```

Si te devuelve un número de versión, está listo. Si falla, ejecutá:
```bash
claude doctor
```

Ese comando te dice exactamente qué está mal.

---

## Paso 2 — Cuenta y autenticación

Claude Code requiere una cuenta de Claude con plan **Pro** (USD 20/mes) como mínimo. El plan gratuito no incluye Claude Code.

**Planes disponibles:**
| Plan | Precio | Recomendado para |
|------|--------|-----------------|
| Pro | USD 20/mes | Empezar, uso moderado |
| Max | USD 100/mes | Uso intensivo, proyecto grande |
| Max 20x | USD 200/mes | Solo si usás mucho |

Para Reunio, **empezá con Pro** y subí a Max cuando el agente esté trabajando muchas horas por día.

### Autenticarte

Una vez instalado, escribí en el terminal:
```bash
claude
```

Se va a abrir el navegador pidiendo que inicies sesión con tu cuenta de Claude. Completá el login y listo.

---

## Paso 3 — Crear el repositorio en GitHub

El repositorio es donde va a vivir todo el código de Reunio. El agente hace commits ahí automáticamente y vos podés ver cada cambio.

1. Creá una cuenta en **github.com** si no tenés
2. Click en el botón **"New repository"** (botón verde, arriba a la derecha)
3. Nombre del repo: `reunio`
4. Visibilidad: **Private** (privado)
5. Tick en "Add a README file"
6. Click en **"Create repository"**

Copiá la URL del repo, va a ser algo como:
```
https://github.com/tu-usuario/reunio
```

### Clonar el repo localmente

En el terminal:
```bash
git clone https://github.com/tu-usuario/reunio
cd reunio
```

Ahora tenés una carpeta `reunio` en tu computadora conectada a GitHub.

---

## Paso 4 — Estructura inicial del proyecto

Dentro de la carpeta `reunio`, creá la siguiente estructura de carpetas. Podés pedirle a Claude Code que lo haga por vos (ver Paso 6), o hacerlo manualmente:

```
reunio/
├── CLAUDE.md              ← contexto permanente para el agente (lo creamos abajo)
├── .claudeignore           ← archivos que el agente NO debe leer
├── docs/
│   ├── PLAN_MAESTRO.md    ← copiar desde los archivos entregados
│   ├── FASE_1_producto_arquitectura.md
│   ├── FASE_2_nucleo_turnos.md
│   ├── FASE_3_panel_admin.md
│   ├── FASE_4_pagos_whatsapp.md
│   ├── FASE_5_saas_onboarding.md
│   └── FASE_6_lanzamiento.md
└── README.md
```

**Copiá todos los archivos .md de fases a la carpeta `docs/`** — estos son los que le dan contexto al agente sobre qué construir.

---

## Paso 5 — Crear el archivo CLAUDE.md (el más importante)

El archivo `CLAUDE.md` es la "memoria permanente" del agente. Cada vez que iniciás una sesión, Claude Code lo lee primero. Es lo que hace que el agente sepa exactamente qué es Reunio sin que vos lo tengas que explicar cada vez.

Creá el archivo `CLAUDE.md` en la raíz del proyecto con este contenido (editá lo que corresponda):

```markdown
# Reunio — Contexto del proyecto para Claude Code

## Qué es este proyecto
Reunio es un SaaS multi-rubro de agendamiento de turnos online para el mercado LATAM (principalmente Argentina). Lee docs/PLAN_MAESTRO.md para el contexto completo del producto.

## Stack tecnológico
- Frontend/Backend: Next.js 14 con App Router (TypeScript estricto)
- Base de datos: Supabase (PostgreSQL + Auth + Realtime)
- Estilos: Tailwind CSS + shadcn/ui
- Deploy: Vercel
- Pagos LATAM: Mercado Pago
- Pagos SaaS: Stripe
- WhatsApp: WhatsApp Business API vía 360dialog
- Emails: Resend
- Jobs: Inngest
- Monitoreo: Sentry + PostHog

## Documentación de fases
Toda la especificación del producto está en la carpeta /docs:
- PLAN_MAESTRO.md — visión, modelo de datos, arquitectura general
- FASE_1 a FASE_6 — especificaciones detalladas por fase

## Convenciones de código obligatorias
- TypeScript estricto (strict: true en tsconfig)
- Nomenclatura: booking (no appointment), organization (no tenant), staff (no employee)
- Fechas siempre en UTC en la base de datos
- Toda query a Supabase debe filtrar por organization_id (multi-tenant)
- Webhooks siempre idempotentes (verificar external_id antes de procesar)
- Nunca guardar datos de tarjetas — solo IDs de pago del proveedor
- Errores manejados con Result pattern, no try/catch genérico

## Estado actual del proyecto
[ACTUALIZAR ESTO en cada sesión con lo que se completó]
- Fase actual: Fase 1
- Completado: nada aún
- En progreso: setup inicial del repositorio
- Próximo paso: crear el proyecto Next.js con la estructura de monorepo

## Variables de entorno necesarias
Las variables de entorno van en .env.local (nunca en el código):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_WEBHOOK_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- WHATSAPP_API_TOKEN (360dialog)
- INNGEST_EVENT_KEY
- SENTRY_DSN

## Cómo trabajamos
- Antes de cada tarea, leé el archivo de la fase correspondiente en /docs
- Hacé commits descriptivos en inglés después de cada funcionalidad completa
- Si hay una decisión de arquitectura que no está clara en los docs, preguntame antes de implementar
- Los tests son obligatorios para el motor de disponibilidad y los webhooks de pago
```

---

## Paso 6 — Crear el .claudeignore

Este archivo le dice al agente qué carpetas y archivos ignorar (para no desperdiciar contexto ni leer cosas sensibles):

```
.env
.env.local
.env.*
node_modules/
.next/
dist/
build/
.git/
*.lock
coverage/
.vercel/
```

---

## Paso 7 — Primera sesión con Claude Code

Abrí el terminal, entrá a la carpeta del proyecto y lanzá el agente:

```bash
cd reunio
claude
```

### Tu primer prompt para empezar la Fase 1

Copiá y pegá este mensaje para iniciar el trabajo:

```
Leé el archivo CLAUDE.md y luego docs/FASE_1_producto_arquitectura.md completo.

Cuando hayas leído ambos, iniciá la Fase 1 de Reunio:

1. Creá el proyecto Next.js 14 con App Router y TypeScript estricto usando create-next-app
2. Configurá Tailwind CSS y shadcn/ui
3. Creá la estructura de carpetas del monorepo según lo especificado en la Fase 1
4. Iniciá Supabase con supabase init y creá la migración inicial con todas las tablas del modelo de datos (las encontrás en PLAN_MAESTRO.md y FASE_1)
5. Configurá el archivo .env.local con todas las variables de entorno necesarias (con valores de ejemplo/placeholder)
6. Hacé un commit con el mensaje "feat: initial project setup and database schema"

Antes de cada paso, explicame brevemente qué vas a hacer y por qué.
```

---

## Paso 8 — Cómo supervisar el trabajo del agente

### Ver los cambios en GitHub
Cada vez que el agente hace un commit, entrá a `github.com/tu-usuario/reunio` y click en "Commits" para ver qué cambió. Cada commit muestra exactamente qué líneas se agregaron o modificaron.

### Conectar Vercel para preview automático
1. Entrá a **vercel.com** y creá una cuenta (gratis)
2. Click en "Add New Project"
3. Conectá con tu GitHub y seleccioná el repo `reunio`
4. Vercel detecta automáticamente que es un proyecto Next.js
5. Click en Deploy

A partir de ahí, cada commit que haga el agente genera una URL de preview automática. Podés ver el resultado en el navegador sin tocar nada más.

### Correr el proyecto localmente (para ver cambios al instante)
Mientras el agente trabaja, podés ver los cambios en tiempo real:

```bash
npm run dev
```

Abrí `http://localhost:3000` en el navegador.

---

## Paso 9 — Flujo de trabajo diario

Esta es la rutina recomendada para trabajar con el agente:

### Al empezar el día
1. Abrí el terminal y entrá al proyecto: `cd reunio && claude`
2. Actualizá el estado en CLAUDE.md (qué completaron ayer, qué sigue hoy)
3. Pedile al agente que continúe desde donde quedaron

### Prompt para retomar trabajo
```
Leé CLAUDE.md para ver el estado actual del proyecto.
Luego continuá con [la tarea específica que sigue según la fase actual].
Antes de empezar, confirmame qué vas a hacer.
```

### Al terminar el día
1. Pedile al agente que actualice CLAUDE.md con el estado actual
2. Verificá que los cambios están en GitHub
3. Revisá el preview en Vercel

---

## Paso 10 — Orden de configuración de servicios externos

Hacé esto en este orden (algunos los va a necesitar el agente para avanzar):

| # | Servicio | Cuándo | Qué crear |
|---|----------|--------|-----------|
| 1 | GitHub | Ya | Repositorio `reunio` |
| 2 | Supabase | Fase 1 | Proyecto nuevo, copiar URL y keys |
| 3 | Vercel | Fase 1 | Conectar con GitHub |
| 4 | Resend | Fase 4 | Cuenta + API key |
| 5 | Mercado Pago | Fase 4 | Cuenta developer, crear app, copiar keys |
| 6 | 360dialog | Fase 4 | Cuenta, conectar número de WA |
| 7 | Stripe | Fase 5 | Cuenta, crear productos/precios para planes |
| 8 | Sentry | Fase 5 | Proyecto Next.js, copiar DSN |
| 9 | PostHog | Fase 5 | Proyecto web, copiar API key |
| 10 | Inngest | Fase 4 | Cuenta, copiar event key |

---

## Tips para trabajar con el agente

**Sé específico en los prompts.** En lugar de "hacé el login", decí "implementá el flujo de autenticación con Supabase Auth: registro con email/contraseña, login, y protección de rutas en /dashboard usando middleware de Next.js".

**Pedile que explique antes de actuar.** Agregá "antes de implementar, explicame el enfoque que vas a usar" para entender qué va a hacer.

**Si algo sale mal**, describí exactamente qué ves: "el componente X muestra el error Y cuando hago Z". El agente puede debuggear si le das el contexto correcto.

**Actualizá CLAUDE.md regularmente.** La sección "Estado actual" es crucial para que el agente no repita trabajo ya hecho.

**Guardá las variables de entorno en un lugar seguro** (1Password, Bitwarden o similar) — el agente las va a necesitar en cada sesión y no las recuerda entre conversaciones.

---

## Links de referencia

- Documentación oficial de Claude Code: https://code.claude.com/docs/en/setup
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Mercado Pago developers: https://developers.mercadopago.com
- 360dialog: https://www.360dialog.com
- Resend: https://resend.com/docs
- Inngest: https://www.inngest.com/docs
- Vercel: https://vercel.com/docs
```
