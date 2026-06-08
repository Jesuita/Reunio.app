# Fase 5 — SaaS, onboarding y facturación

**Duración estimada:** semanas 14–17  
**Prerequisito:** Fase 4 completa (pagos y WhatsApp operativos)  
**Objetivo:** convertir Reunio en un producto SaaS completo: registro de nuevos negocios, onboarding guiado, sistema de planes con límites, facturación recurrente con Stripe, página pública de reservas y widget embebible.

---

## Módulo 5.1 Registro y onboarding de negocios

### 5.1.1 Registro (`/register`)

**Paso 1 — Cuenta:**
- Email + contraseña (o Google OAuth)
- Nombre y apellido
- Aceptar términos y condiciones + política de privacidad

**Paso 2 — Tu negocio:**
- Nombre del negocio (genera el slug automáticamente, editable)
- Categoría / rubro (selector con íconos: belleza, salud, fitness, otros)
- País y ciudad (determina timezone y moneda predeterminada)
- Teléfono del negocio

**Paso 3 — Tu primer servicio:**
- Nombre del servicio (ej: "Corte de cabello")
- Duración en minutos
- Precio
- ¿Requiere seña? sí/no + monto

**Paso 4 — Tu disponibilidad:**
- Selector visual de días laborables (lunes a domingo)
- Franja horaria (ej: 9:00 a 19:00)
- Descanso de mediodía (opcional)

Al finalizar:
- Crear organización + branch principal + staff (el propio dueño) + primer servicio + schedules
- Redirigir al dashboard con mensaje de bienvenida
- Mostrar checklist de pasos siguientes

### 5.1.2 Checklist de onboarding (dashboard)

Card visible en el dashboard hasta completar todos los pasos:

```
✓ Creaste tu negocio
□ Configurá WhatsApp (para recordatorios automáticos)
□ Conectá Mercado Pago (para cobrar señas)
□ Compartí tu link de reservas con tus clientes
□ Agregá más servicios
□ Invitá a tu equipo (si tenés staff)
```

Cada ítem lleva al lugar correspondiente. Card se oculta cuando todos están completos.

### 5.1.3 Welcome email

Al registrarse, enviar email de bienvenida con:
- Link al dashboard
- Link de reservas del negocio (para compartir)
- 3 próximos pasos recomendados
- Link a documentación/ayuda

---

## Módulo 5.2 Sistema de planes y límites

### 5.2.1 Definición de planes

```typescript
const PLANS = {
  free: {
    name: 'Free',
    price: { ars: 0, usd: 0 },
    limits: {
      maxStaff: 1,
      maxBookingsPerMonth: 30,
      maxServices: 5,
      whatsappReminders: false,
      onlinePayments: false,
      multiLocation: false,
      apiAccess: false,
      customBranding: false,
      reports: 'basic',        // solo dashboard, sin exportar
    }
  },
  pro: {
    name: 'Pro',
    price: { ars: 19000, usd: 19 },
    stripePriceId: 'price_xxx',
    limits: {
      maxStaff: 5,
      maxBookingsPerMonth: null,   // ilimitado
      maxServices: null,
      whatsappReminders: true,
      onlinePayments: true,
      multiLocation: false,
      apiAccess: false,
      customBranding: false,
      reports: 'full',
    }
  },
  business: {
    name: 'Business',
    price: { ars: 49000, usd: 49 },
    stripePriceId: 'price_yyy',
    limits: {
      maxStaff: null,
      maxBookingsPerMonth: null,
      maxServices: null,
      whatsappReminders: true,
      onlinePayments: true,
      multiLocation: true,
      apiAccess: true,
      customBranding: true,
      reports: 'full',
    }
  }
}
```

### 5.2.2 Enforcement de límites

Cada acción crítica verifica los límites del plan antes de ejecutarse:

```typescript
// Middleware de límites
async function checkPlanLimit(
  organizationId: string,
  action: 'add_staff' | 'create_booking' | 'add_service' | 'use_whatsapp' | 'process_payment'
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: string }> {
  const org = await getOrganizationWithPlan(organizationId)
  const plan = PLANS[org.plan.name]
  
  switch (action) {
    case 'add_staff':
      const staffCount = await countActiveStaff(organizationId)
      if (plan.limits.maxStaff && staffCount >= plan.limits.maxStaff) {
        return { allowed: false, reason: 'Límite de profesionales alcanzado', upgradeRequired: 'pro' }
      }
      break
    case 'use_whatsapp':
      if (!plan.limits.whatsappReminders) {
        return { allowed: false, reason: 'Recordatorios por WhatsApp no disponibles en plan Free', upgradeRequired: 'pro' }
      }
      break
    // ... otros casos
  }
  
  return { allowed: true }
}
```

**UX de límites alcanzados:**
- No mostrar errores técnicos → mostrar modal de upgrade amigable
- "Llegaste al límite de 1 profesional en tu plan Free. ¡Actualizá a Pro para agregar más!"
- Botón directo a la página de upgrade

### 5.2.3 Página de precios (`/pricing`)

- Tabla comparativa de los 3 planes
- Toggle mensual / anual (descuento 20% anual)
- CTA "Empezar gratis" (Free) y "Activar Pro / Business" (planes pagos)
- FAQs debajo de la tabla
- Testimonios de negocios reales (agregar post-lanzamiento)

---

## Módulo 5.3 Facturación con Stripe

### 5.3.1 Flujo de suscripción

```
1. Admin hace click en "Actualizar a Pro" desde el dashboard
2. Reunio crea o recupera el Customer de Stripe para esa organización
3. Crear Checkout Session de Stripe:
   POST /api/billing/create-checkout
   → stripe.checkout.sessions.create({
       customer: stripeCustomerId,
       line_items: [{ price: plan.stripePriceId, quantity: 1 }],
       mode: 'subscription',
       success_url: 'https://reunio.app/dashboard/billing?success=true',
       cancel_url: 'https://reunio.app/dashboard/billing',
       metadata: { organizationId }
     })
4. Redirect a Stripe Checkout
5. Cliente completa el pago
6. Stripe llama al webhook de Reunio
7. Webhook actualiza el plan de la organización
```

### 5.3.2 Webhook de Stripe

Ruta: `POST /api/webhooks/stripe`

Eventos a manejar:

```typescript
switch (event.type) {
  case 'checkout.session.completed':
    // Activar el plan pagado
    await activatePlan(organizationId, planId, subscriptionId)
    break
    
  case 'invoice.payment_succeeded':
    // Renovación exitosa → extender período
    await renewPlan(subscriptionId)
    break
    
  case 'invoice.payment_failed':
    // Pago fallido → enviar email de aviso, dar 3 días de gracia
    await handlePaymentFailed(subscriptionId)
    break
    
  case 'customer.subscription.deleted':
    // Cancelación → degradar a Free al fin del período
    await schedulePlanDowngrade(subscriptionId)
    break
}
```

### 5.3.3 Portal de facturación (`/dashboard/billing`)

- Plan actual y fecha de renovación
- Botón "Gestionar suscripción" → Stripe Customer Portal (permite cambiar tarjeta, cancelar, ver facturas)
- Historial de facturas (desde Stripe)
- Botón "Cambiar plan" → tabla de planes

---

## Módulo 5.4 Página pública de reservas

### 5.4.1 Subdominio vs. path

**Decisión recomendada:** path primero (`reunio.app/[slug]`), subdominios como feature de Business plan.

- Free/Pro: `reunio.app/mi-peluqueria`
- Business: `mi-peluqueria.reunio.app` o dominio propio (via CNAME)

### 5.4.2 Personalización de la página pública

El negocio puede configurar en `/dashboard/settings`:
- Logo y colores de marca (color primario y secundario)
- Foto de portada / banner
- Descripción del negocio
- Dirección y mapa (Google Maps embed)
- Redes sociales (Instagram, Facebook)
- Mensaje de bienvenida personalizado

La página aplica los colores de marca del negocio (CSS variables dinámicas generadas server-side).

### 5.4.3 Estructura de la página pública

```
[Banner/foto del negocio]
[Logo + Nombre + descripción]
[Servicios disponibles — cards]
[Staff disponible — cards con foto]
[Horario de atención]
[Ubicación + mapa]
[Botón flotante: "Reservar turno"]
```

**SEO:** generar metadata dinámica (`generateMetadata` en Next.js) con nombre del negocio, descripción y ciudad para indexación en Google.

### 5.4.4 Link de reservas para compartir

El negocio recibe su link único para compartir en:
- Bio de Instagram
- WhatsApp Business (mensaje de bienvenida automático)
- Google My Business
- Firma de email

---

## Módulo 5.5 Widget embebible

Un script que el negocio pega en su propio sitio web y renderiza un botón + modal de reservas.

```html
<!-- El negocio pega esto en su sitio -->
<script 
  src="https://cdn.reunio.app/widget.js" 
  data-organization="mi-peluqueria"
  data-color="#7C3AED"
  data-text="Reservar turno"
></script>
```

**Implementación:**
- `widget.js` es un script ligero (~10kb gzip) que inyecta un botón flotante
- Al hacer click → abre un iframe con el flujo de reserva de Reunio
- Comunicación padre↔iframe via `postMessage` (para saber cuando se completa la reserva)
- El widget respeta los colores configurados por el negocio

**Generador de código embed:** en `/dashboard/settings/integrations` mostrar el snippet con preview en vivo y opciones de personalización.

---

## Módulo 5.6 API pública (plan Business)

Para negocios que quieren integraciones custom:

**Autenticación:** API Keys (bearer token), generadas en `/dashboard/settings/api`

**Endpoints disponibles en v1:**
- `GET /api/v1/bookings` — listar turnos
- `POST /api/v1/bookings` — crear turno
- `GET /api/v1/availability` — consultar disponibilidad
- `GET /api/v1/clients` — listar clientes
- `GET /api/v1/services` — listar servicios

**Rate limiting:** 100 requests/minuto por API key (usando Upstash Redis)

---

## Entregables de esta fase

- [ ] Flujo de registro en 4 pasos con creación automática del negocio
- [ ] Checklist de onboarding en el dashboard
- [ ] Welcome email con instrucciones de primeros pasos
- [ ] Sistema de planes con enforcement de límites
- [ ] Modales de upgrade cuando se alcanza un límite
- [ ] Página de precios (`/pricing`)
- [ ] Integración con Stripe Checkout para suscripciones
- [ ] Webhook de Stripe con todos los eventos relevantes
- [ ] Portal de facturación con Stripe Customer Portal
- [ ] Página pública de reservas con personalización de marca
- [ ] Widget embebible con generador de código
- [ ] API pública v1 (plan Business)
- [ ] Gestión de subdominios custom (plan Business)

---

## Siguiente fase

Una vez completos los entregables → continuar con [`FASE_6_lanzamiento.md`](./FASE_6_lanzamiento.md)
