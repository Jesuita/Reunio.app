# Fase 4 — Pagos y WhatsApp

**Duración estimada:** semanas 10–14  
**Prerequisito:** Fase 3 completa (panel admin operativo)  
**Objetivo:** integrar Mercado Pago para el cobro de señas y Stripe para suscripciones, e implementar el canal de WhatsApp Business API con recordatorios automáticos y bot de agendamiento conversacional.

---

## Módulo A: Mercado Pago

### A.1 Configuración de la integración

Cada negocio conecta su propia cuenta de Mercado Pago (modelo marketplace):
- Reunio usa **Marketplace API** de MP: los pagos van directamente a la cuenta del negocio, Reunio puede cobrar una comisión de plataforma (opcional en v1)
- OAuth con Mercado Pago en `/dashboard/settings/integrations`
- Guardar `access_token` y `refresh_token` cifrados en `organizations.settings`
- Guardar `mp_user_id` para asociar pagos

### A.2 Flujo de pago de seña

```
1. POST /api/bookings
   → sistema detecta que el servicio requiere seña
   → crea booking en status 'pending' con payment_status 'unpaid'

2. Crear preferencia de pago en MP:
   POST https://api.mercadopago.com/checkout/preferences
   Body: {
     items: [{ title: "Seña - Corte + Tinte", quantity: 1, unit_price: 2000 }],
     back_urls: {
       success: "https://reunio.app/booking/{id}/confirm?status=success",
       failure: "https://reunio.app/booking/{id}/confirm?status=failure",
       pending: "https://reunio.app/booking/{id}/confirm?status=pending"
     },
     notification_url: "https://reunio.app/api/webhooks/mercadopago",
     external_reference: "{booking_id}",  // ← clave para idempotencia
     expires: true,
     expiration_date_to: "{ISO fecha 30 min desde ahora}"
   }
   → devolver init_point (URL de checkout) al cliente

3. Cliente paga en checkout de MP (fuera de Reunio)

4. MP llama al webhook de Reunio

5. Webhook procesa el pago y confirma el turno
```

### A.3 Webhook de Mercado Pago

Ruta: `POST /api/webhooks/mercadopago`

**Implementación con idempotencia:**

```typescript
export async function POST(req: Request) {
  // 1. Verificar firma del webhook (header x-signature)
  const signature = req.headers.get('x-signature')
  const isValid = verifyMercadoPagoSignature(signature, await req.text())
  if (!isValid) return new Response('Unauthorized', { status: 401 })

  const body = await req.json()
  
  // 2. Solo procesar eventos de tipo 'payment'
  if (body.type !== 'payment') return new Response('OK', { status: 200 })
  
  const paymentId = body.data.id
  
  // 3. Idempotencia: verificar si ya procesamos este payment_id
  const existing = await db.query.payments.findFirst({
    where: eq(payments.externalId, paymentId)
  })
  if (existing?.status === 'approved') return new Response('OK', { status: 200 })
  
  // 4. Consultar el pago a la API de MP para obtener datos reales
  const payment = await mercadopago.payment.get(paymentId)
  
  // 5. Obtener el booking por external_reference
  const bookingId = payment.external_reference
  
  // 6. Actualizar según status del pago
  if (payment.status === 'approved') {
    await confirmBookingWithPayment(bookingId, paymentId, payment.transaction_amount)
    // → booking.status = 'confirmed'
    // → booking.payment_status = 'deposit_paid'
    // → payments: insertar registro
    // → encolar recordatorios
  }
  
  if (payment.status === 'rejected') {
    await cancelPendingBooking(bookingId, 'payment_rejected')
    // → liberar el slot
  }
  
  return new Response('OK', { status: 200 })
}
```

**Seguridad del webhook:**
- Verificar header `x-signature` usando HMAC-SHA256 con el webhook secret de MP
- Siempre re-consultar el pago a la API de MP (no confiar solo en el body del webhook)
- Procesar en background (devolver 200 rápido, procesar async)

### A.4 Vencimiento de slots reservados sin pago

Si el cliente no paga la seña en el tiempo límite (configurable, default 30 minutos):

```typescript
// Cron job cada 5 minutos (Vercel Cron o Inngest)
async function releaseExpiredPendingBookings() {
  const expiredBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.status, 'pending'),
      eq(bookings.paymentStatus, 'unpaid'),
      lt(bookings.createdAt, new Date(Date.now() - 30 * 60 * 1000))
    )
  })
  
  for (const booking of expiredBookings) {
    await db.update(bookings)
      .set({ status: 'cancelled', cancelReason: 'payment_timeout' })
      .where(eq(bookings.id, booking.id))
    
    // Notificar a clientes en waitlist
    await notifyWaitlist(booking)
  }
}
```

### A.5 Reembolsos

Ruta: `POST /api/bookings/[id]/refund`

```typescript
// Solo accesible para admins
async function refundDeposit(bookingId: string, amount?: number) {
  const payment = await getPaymentForBooking(bookingId)
  
  // Refund total o parcial según política de cancelación
  await mercadopago.refund.create({
    payment_id: payment.externalId,
    amount: amount ?? payment.amount  // null = reembolso total
  })
  
  await db.update(payments)
    .set({ status: 'refunded' })
    .where(eq(payments.id, payment.id))
}
```

---

## Módulo B: WhatsApp Business API

### B.1 Arquitectura de la integración

**BSP recomendado:** 360dialog (alternativas: Wati, Interakt, Twilio)  
**Número:** cada negocio puede usar su propio número (embedded signup de Meta) o un número compartido de Reunio en planes bajos

**Flujo de configuración:**
1. Admin va a `/dashboard/settings/integrations`
2. Click "Conectar WhatsApp" → embedded signup de Meta (OAuth con Facebook Business)
3. Reunio recibe el `waba_id` y `phone_number_id`
4. Reunio registra el webhook en Meta apuntando a `/api/webhooks/whatsapp`
5. Guardar credenciales cifradas en `organizations.settings`

### B.2 Servicio de mensajería (`/lib/whatsapp`)

```typescript
// Wrapper sobre la Graph API de Meta
class WhatsAppService {
  // Enviar mensaje de template (para notificaciones proactivas)
  async sendTemplate(params: {
    to: string           // número en formato internacional: 5491155551234
    templateName: string
    language: string     // 'es_AR'
    components: TemplateComponent[]
  }): Promise<{ messageId: string }>

  // Enviar mensaje de texto libre (dentro de ventana de 24h)
  async sendText(params: {
    to: string
    text: string
    replyToMessageId?: string
  }): Promise<{ messageId: string }>

  // Enviar mensaje con botones interactivos
  async sendButtons(params: {
    to: string
    body: string
    buttons: Array<{ id: string; title: string }>
  }): Promise<{ messageId: string }>

  // Enviar lista interactiva
  async sendList(params: {
    to: string
    body: string
    buttonText: string
    sections: ListSection[]
  }): Promise<{ messageId: string }>
}
```

### B.3 Templates de mensajes (deben aprobarse en Meta)

#### Template: `booking_confirmation`
```
Hola {{1}}! ✓ Tu turno está confirmado.

Servicio: {{2}}
Profesional: {{3}}
Fecha: {{4}}
Hora: {{5}}
Dirección: {{6}}

¿Necesitás cambiar algo?
[Reprogramar] [Cancelar]
```

#### Template: `booking_reminder_24h`
```
Hola {{1}}! Te recordamos tu turno mañana.

{{2}} con {{3}}
{{4}} a las {{5}}

¿Vas a poder asistir?
[Sí, confirmo] [Necesito reprogramar]
```

#### Template: `booking_reminder_2h`
```
Hola {{1}}! En 2 horas tenés turno.

{{2}} a las {{3}} con {{4}}

Te esperamos en {{5}} 📍
```

#### Template: `deposit_request`
```
Hola {{1}}! Para confirmar tu turno de {{2}} el {{3}} a las {{4}}, necesitamos una seña de ${{5}}.

Podés pagar acá (válido por 30 min):
{{6}}

Ante cualquier duda, escribinos.
```

#### Template: `booking_cancelled_waitlist`
```
Hola {{1}}! Se liberó un turno de {{2}} el {{3}} a las {{4}}.

Como estabas en lista de espera, te avisamos primero. Reservá ahora (disponible por 15 min):
{{5}}
```

### B.4 Sistema de recordatorios automáticos

**Worker de recordatorios** (cron cada 15 minutos usando Inngest o Vercel Cron):

```typescript
async function processReminders() {
  const now = new Date()
  
  // Recordatorios pendientes cuyo scheduled_at ya pasó
  const pendingReminders = await db.query.reminders.findMany({
    where: and(
      eq(reminders.status, 'pending'),
      lte(reminders.scheduledAt, now)
    ),
    with: { booking: { with: { client: true, service: true, staff: true } } },
    limit: 50
  })
  
  for (const reminder of pendingReminders) {
    try {
      await sendReminder(reminder)
      await db.update(reminders)
        .set({ status: 'sent', sentAt: now })
        .where(eq(reminders.id, reminder.id))
    } catch (err) {
      await db.update(reminders)
        .set({ status: 'failed', error: err.message })
        .where(eq(reminders.id, reminder.id))
    }
  }
}
```

**Cuándo se encolan los recordatorios** (al confirmar un booking):
```typescript
async function scheduleReminders(booking: Booking) {
  const remindersToCreate = [
    // Confirmación: inmediata
    { type: 'confirmation', scheduledAt: new Date() },
    // 24 horas antes
    { type: '24h', scheduledAt: subHours(booking.startsAt, 24) },
    // 2 horas antes
    { type: '2h', scheduledAt: subHours(booking.startsAt, 2) },
    // Follow-up post-turno (2 horas después): pedir reseña
    { type: 'followup', scheduledAt: addHours(booking.endsAt, 2) },
  ].filter(r => r.scheduledAt > new Date())  // solo futuros
  
  await db.insert(reminders).values(
    remindersToCreate.map(r => ({
      bookingId: booking.id,
      channel: 'whatsapp',
      ...r,
      status: 'pending'
    }))
  )
}
```

### B.5 Bot conversacional de agendamiento

Webhook entrante: `POST /api/webhooks/whatsapp`

El bot maneja el agendamiento completo desde WhatsApp. Usa un máquina de estados por conversación.

**Estados de la conversación** (guardados en Redis o en tabla `whatsapp_sessions`):

```typescript
type ConversationState = {
  phoneNumber: string
  organizationId: string
  step: 'idle' | 'selecting_service' | 'selecting_staff' | 
        'selecting_date' | 'selecting_time' | 'confirming_client_data' |
        'awaiting_payment' | 'completed'
  selectedServiceId?: string
  selectedStaffId?: string
  selectedDate?: string
  selectedTime?: string
  clientData?: { name: string; email?: string }
  expiresAt: Date
}
```

**Flujo del bot:**

```
[Cliente escribe cualquier mensaje al número del negocio]
  → Bot: "Hola! Soy el asistente de {negocio}. ¿Qué servicio querés reservar?"
    [lista de servicios como botones o lista]

[Cliente selecciona servicio]
  → (si hay múltiples staff): "¿Con quién querés atenderte?"
    [lista de profesionales]
  → (si hay uno): skip al siguiente paso

[Cliente selecciona staff o se asigna automáticamente]
  → "¿Para qué fecha? Enviame el día o elegí una opción:"
    [botones: Hoy / Mañana / Esta semana / Otra fecha]

[Cliente elige fecha]
  → "Estos son los horarios disponibles para el {fecha}:"
    [lista de slots disponibles]

[Cliente elige horario]
  → "¿A qué nombre reservo?"

[Cliente envía su nombre]
  → (si necesita seña): 
    "Perfecto {nombre}! Para confirmar tu turno de {servicio} el {fecha} a las {hora} con {staff}, necesitamos una seña de ${monto}."
    [botón: Pagar seña]
  → (si no necesita seña):
    "Listo {nombre}! Tu turno de {servicio} el {fecha} a las {hora} con {staff} está confirmado."
    → crear booking → enviar confirmación → fin

[Cliente paga seña]
  → webhook MP confirma pago → bot envía confirmación → fin

[Cliente escribe algo no reconocido]
  → "No entendí bien. ¿Querés reservar un turno? Respondé SÍ para empezar."
```

**Comandos siempre disponibles:**
- "MIS TURNOS" → lista de próximos turnos del cliente
- "CANCELAR" → iniciar flujo de cancelación del próximo turno
- "HABLAR CON ALGUIEN" → enviar alerta al admin y pasar a atención humana

### B.6 Webhook entrante de WhatsApp

```typescript
export async function POST(req: Request) {
  // 1. Verificar firma (header x-hub-signature-256)
  
  const body = await req.json()
  
  // 2. Extraer mensaje
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (!message) return new Response('OK', { status: 200 })
  
  const from = message.from              // número del cliente
  const text = message.text?.body || ''
  const buttonReply = message.interactive?.button_reply?.id
  const listReply = message.interactive?.list_reply?.id
  
  const input = buttonReply || listReply || text
  
  // 3. Identificar a qué organización pertenece este número
  const org = await getOrganizationByWhatsAppNumber(message.to)
  if (!org) return new Response('OK', { status: 200 })
  
  // 4. Procesar con el bot
  await processConversation({ from, input, organizationId: org.id })
  
  return new Response('OK', { status: 200 })
}
```

---

## Módulo C: Emails transaccionales

**Proveedor:** Resend (`npm install resend`)  
**Templates:** React Email (componentes React que se renderizan como HTML de email)

Emails a implementar:
- Confirmación de turno
- Recordatorio 24h
- Cancelación (con o sin reembolso)
- Reprogramación confirmada
- Resumen semanal para el negocio (todos los turnos de la semana)

---

## Módulo D: Stripe (facturación de planes Reunio)

Ver detalle en Fase 5. En esta fase solo integrar los webhooks básicos para no bloquear el trabajo posterior.

---

## Consideraciones de costos para el negocio

Documentar en la UI los costos aproximados de WhatsApp para que el negocio los entienda:

| Tipo de mensaje | Costo aprox. (Argentina) |
|----------------|--------------------------|
| Confirmación de turno (Utility) | ~USD 0.007 por mensaje |
| Recordatorio 24h (Utility) | ~USD 0.007 por mensaje |
| Respuesta dentro de 24h (Service) | Gratis |
| Campaña de marketing | ~USD 0.026–0.062 por mensaje |

Con 200 turnos/mes: costo MP estimado ~USD 1.5–5 en mensajes Utility.

---

## Entregables de esta fase

- [ ] OAuth con Mercado Pago funcionando por negocio
- [ ] Flujo completo de seña (preferencia → checkout → webhook → confirmación)
- [ ] Idempotencia y verificación de firma en webhook de MP
- [ ] Cron job de vencimiento de slots sin pago
- [ ] Reembolsos desde el panel admin
- [ ] Conexión de WhatsApp Business API por negocio
- [ ] 6 templates de WhatsApp aprobados en Meta
- [ ] Sistema de recordatorios automáticos (cron + worker)
- [ ] Bot conversacional básico (flujo de reserva completo)
- [ ] Comandos "MIS TURNOS" y "CANCELAR" en el bot
- [ ] Emails transaccionales (confirmación, recordatorio, cancelación)
- [ ] Tests: flujo de pago completo (sandbox MP), envío de templates, bot

---

## Siguiente fase

Una vez completos los entregables → continuar con [`FASE_5_saas_onboarding.md`](./FASE_5_saas_onboarding.md)
