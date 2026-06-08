# Fase 2 — Núcleo del sistema de turnos

**Duración estimada:** semanas 3–7  
**Prerequisito:** Fase 1 completa (modelo de datos, stack y entorno configurados)  
**Objetivo:** construir el motor central de disponibilidad y el flujo completo de reserva del cliente. Al final de esta fase, un cliente real debe poder reservar un turno en un negocio demo.

---

## Módulos a construir

### 2.1 Motor de disponibilidad (`/lib/availability`)

Es el corazón del sistema. Dado un servicio, un rango de fechas y opcionalmente un profesional, devuelve todos los slots disponibles considerando:

- Horarios configurados por staff (`schedules`)
- Excepciones y días libres (`schedule_overrides`)
- Turnos ya reservados (`bookings` con status `confirmed` o `pending`)
- Duración del servicio
- Timezone del negocio
- Días no laborables (feriados: configurable por negocio)

**Función principal:**

```typescript
getAvailableSlots(params: {
  organizationId: string
  serviceId: string
  staffId?: string          // si no se pasa, busca en todos
  dateFrom: Date
  dateTo: Date
}): Promise<Slot[]>

type Slot = {
  staffId: string
  staffName: string
  startsAt: Date            // siempre en UTC
  endsAt: Date
  available: boolean
}
```

**Reglas del motor:**
- Los slots se generan cada N minutos (igual a la duración del servicio o configurable)
- Un slot está ocupado si hay un booking que se solapa en ese staff
- Un slot está ocupado si cae fuera del horario del staff ese día
- Un slot está ocupado si el staff tiene un override de día libre ese día
- Margen de tiempo: no mostrar slots con menos de X minutos de anticipación (configurable, default 60 min)
- Máximo de días adelante para reservar: configurable por negocio (default 60 días)

### 2.2 API de reservas (`/app/api/bookings`)

#### `GET /api/availability`
```
Query params:
  organizationId  string (required)
  serviceId       string (required)
  staffId         string (optional)
  date            string YYYY-MM-DD (required)

Response:
  { slots: Slot[] }
```

#### `POST /api/bookings`
```
Body:
  organizationId  string
  serviceId       string
  staffId         string
  startsAt        string ISO 8601
  client: {
    name          string
    phone         string
    email?        string
  }
  notes?          string

Response:
  { booking: Booking, paymentUrl?: string }
```

Lógica interna del POST:
1. Validar que el slot sigue disponible (race condition check con transacción)
2. Crear o encontrar el cliente por teléfono
3. Crear el booking en status `pending`
4. Si el servicio requiere seña → crear preferencia en Mercado Pago y devolver URL
5. Si no requiere seña → cambiar status a `confirmed` inmediatamente
6. Encolar recordatorios (confirmación + 24h + 2h)
7. Devolver respuesta

#### `PATCH /api/bookings/[id]`
Permite reprogramar (nuevo `startsAt`) o cancelar (`status: 'cancelled'`). Verifica política de cancelación.

#### `GET /api/bookings/[id]`
Datos públicos del turno (para la página de confirmación y los links de WA).

### 2.3 Flujo de reserva del cliente (frontend)

Ruta: `/[slug]/booking`

**Paso 1 — Selección de servicio**
- Lista de servicios activos del negocio
- Cada servicio muestra: nombre, duración, precio, si requiere seña
- UI: grilla de cards

**Paso 2 — Selección de profesional (opcional)**
- Si el negocio tiene múltiples staff, mostrar lista
- Opción "cualquier profesional disponible" siempre presente
- UI: cards con foto/avatar, nombre y especialidades

**Paso 3 — Selección de fecha y hora**
- Calendario mensual con días disponibles destacados
- Al seleccionar día → lista de slots horarios disponibles
- Llamada a `GET /api/availability` en tiempo real
- UI: calendar picker + lista de botones de horario

**Paso 4 — Datos del cliente**
- Nombre completo (required)
- Teléfono (required, formato LATAM)
- Email (optional)
- Notas / comentarios (optional)
- Checkbox de aceptación de política de cancelación

**Paso 5 — Confirmación / Pago**
- Resumen del turno: servicio, profesional, fecha, hora, precio
- Si hay seña: botón "Pagar seña con Mercado Pago" → redirect a checkout
- Si no hay seña: botón "Confirmar turno" → POST a `/api/bookings`

**Paso 6 — Éxito**
- Mensaje de confirmación con detalles del turno
- Botón "Agregar a Google Calendar" (link `webcal://`)
- Indicación de que recibirá recordatorio por WhatsApp

### 2.4 Gestión de concurrencia (race conditions)

Problema: dos clientes pueden intentar reservar el mismo slot al mismo tiempo.

Solución: usar una transacción PostgreSQL con `SELECT FOR UPDATE` o un advisory lock sobre el slot:

```sql
BEGIN;
  -- Verificar disponibilidad dentro de la transacción
  SELECT COUNT(*) FROM bookings
  WHERE staff_id = $1
    AND status IN ('pending', 'confirmed')
    AND tsrange(starts_at, ends_at) && tsrange($2, $3)
  FOR UPDATE;
  
  -- Si count = 0, insertar el booking
  INSERT INTO bookings (...) VALUES (...);
COMMIT;
```

Alternativamente, usar un lock Redis/Supabase por `staff_id:date:time` durante el proceso de reserva.

### 2.5 Gestión de staff y horarios (admin)

Pantallas: `/dashboard/staff` y `/dashboard/staff/[id]`

**Funcionalidades:**
- Crear/editar/desactivar profesionales
- Asignar servicios a cada profesional
- Configurar horario semanal (días y franjas horarias)
- Agregar excepciones: días libres, horarios especiales, vacaciones
- Vista previa de disponibilidad

### 2.6 Gestión de servicios (admin)

Pantalla: `/dashboard/services`

**Funcionalidades:**
- Crear/editar/desactivar servicios
- Configurar: nombre, descripción, duración, precio, color, categoría
- Configurar seña: monto fijo o porcentaje
- Asignar qué staff puede realizar el servicio
- Reordenar servicios (drag & drop)

### 2.7 Vista de agenda (admin)

Pantalla: `/dashboard/calendar`

**Vistas disponibles:**
- **Día:** columnas por profesional, filas por hora (timeline)
- **Semana:** vista clásica de calendario
- **Mes:** grid mensual con puntos de ocupación

**Funcionalidades:**
- Click en slot vacío → crear turno manualmente
- Click en turno existente → ver detalle, reprogramar, cancelar
- Drag & drop para reprogramar (nice-to-have en fase 2, obligatorio en fase 3)
- Filtro por profesional
- Código de colores por servicio

**Tiempo real:** suscripción a cambios de `bookings` vía Supabase Realtime para actualizar la vista sin recargar.

### 2.8 Reprogramación y cancelación self-service

Los clientes reciben un link único en el WhatsApp/email de confirmación:

```
https://reunio.app/booking/[booking-id]/reschedule?token=[jwt-firmado]
https://reunio.app/booking/[booking-id]/cancel?token=[jwt-firmado]
```

El token es un JWT firmado con el secret del proyecto, con expiración de 48 horas antes del turno. Al acceder:
- **Reprogramar:** muestra el flujo de selección de fecha/hora (pasos 3 y 5) con los datos del cliente pre-completos
- **Cancelar:** muestra política de cancelación y botón de confirmación

### 2.9 Lista de espera

Si todos los slots de un día están ocupados, ofrecer al cliente unirse a la lista de espera:

```typescript
// Tabla: waitlist
id              uuid
booking_id      uuid      -- el booking cancelado que libera el slot
organization_id uuid
service_id      uuid
staff_id        uuid?
client_id       uuid
preferred_date  date
status          text      -- 'waiting' | 'notified' | 'booked' | 'expired'
created_at      timestamptz
```

Cuando se cancela un turno → buscar clientes en waitlist para ese slot → notificar por WhatsApp con link para reservar.

### 2.10 Sincronización con Google Calendar

**Flujo:**
1. Admin conecta su Google Calendar en `/dashboard/settings/integrations`
2. OAuth2 con Google, guardar refresh token cifrado en `organizations.settings`
3. Al crear un booking → crear evento en Google Calendar del staff correspondiente
4. Al cancelar/reprogramar → actualizar o eliminar el evento
5. Suscripción a cambios en Google Calendar (webhooks) → actualizar disponibilidad en Reunio

**Librería:** `googleapis` (npm)

---

## Tests requeridos para esta fase

### Unit tests (`/lib/availability`)
- Slot disponible en horario normal
- Slot ocupado por booking existente
- Slot fuera del horario del staff
- Slot en día libre del staff
- Correcta conversión de timezones
- Race condition: dos requests simultáneos al mismo slot

### Integration tests (API)
- `POST /api/bookings` crea booking y cliente correctamente
- `POST /api/bookings` rechaza slot ya ocupado
- `PATCH /api/bookings/[id]` cancela y libera el slot
- Booking con seña devuelve URL de pago

### E2E tests (Playwright)
- Flujo completo de reserva sin seña
- Flujo completo de reserva con seña (mock de Mercado Pago)
- Reprogramación desde link

---

## Entregables de esta fase

- [ ] Motor de disponibilidad funcionando con tests
- [ ] API de bookings completa (`GET availability`, `POST`, `PATCH`, `GET by id`)
- [ ] Flujo de reserva del cliente (6 pasos) en `/[slug]/booking`
- [ ] Vista de agenda en `/dashboard/calendar`
- [ ] Gestión de servicios en `/dashboard/services`
- [ ] Gestión de staff y horarios en `/dashboard/staff`
- [ ] Reprogramación y cancelación self-service desde link
- [ ] Lista de espera básica
- [ ] Sincronización Google Calendar (básica)
- [ ] Demo funcional con datos de un negocio de prueba

---

## Siguiente fase

Una vez completos los entregables → continuar con [`FASE_3_panel_admin.md`](./FASE_3_panel_admin.md)
