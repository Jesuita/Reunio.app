# Fase 3 — Panel de administración

**Duración estimada:** semanas 7–10  
**Prerequisito:** Fase 2 completa (motor de turnos y flujo de reserva funcionando)  
**Objetivo:** construir el dashboard completo que usan los dueños y el staff del negocio para gestionar su operación diaria.

---

## Módulos a construir

### 3.1 Dashboard principal (`/dashboard`)

Pantalla de inicio al hacer login. Debe mostrar de un vistazo el estado del negocio.

**Métricas del día (cards superiores):**
- Turnos de hoy: total / confirmados / pendientes de pago
- Tasa de ocupación del día (%)
- Ingresos proyectados del día
- Próximo turno: en X minutos, nombre del cliente, servicio

**Sección central — Agenda rápida del día:**
- Vista de timeline del día actual, por profesional
- Indicador de turno en curso
- Acceso rápido para crear turno manual

**Sección inferior — Actividad reciente:**
- Últimas 5 reservas recibidas (canal, servicio, hora)
- Últimas 3 cancelaciones
- Clientes en lista de espera

**Indicadores de la semana (mini-charts):**
- Ocupación de los últimos 7 días (bar chart)
- No-shows de los últimos 7 días

### 3.2 CRM de clientes (`/dashboard/clients`)

**Vista lista:**
- Tabla con: nombre, teléfono, email, total de turnos, último turno, etiquetas, no-shows
- Búsqueda por nombre o teléfono
- Filtros: por etiqueta, por rango de fechas, solo con no-shows
- Exportar a CSV

**Vista ficha del cliente (`/dashboard/clients/[id]`):**
- Datos de contacto (editables)
- Notas internas del negocio (campo libre, no visible para el cliente)
- Historial completo de turnos (con estado, servicio, monto)
- Estadísticas: total turnos, tasa de asistencia, gasto total
- Etiquetas personalizables (ej: "cliente VIP", "alergia a X")
- Botón: nuevo turno para este cliente
- Botón: enviar mensaje por WhatsApp

**Acciones en lista:**
- Crear cliente manualmente
- Fusionar duplicados (mismo teléfono, distinto nombre)
- Blacklist: marcar cliente y exigir depósito o bloquear reservas

### 3.3 Lista de turnos (`/dashboard/bookings`)

**Filtros disponibles:**
- Por fecha (rango)
- Por profesional
- Por servicio
- Por estado (pendiente, confirmado, completado, cancelado, no-show)
- Por canal de origen (web, WhatsApp, admin)
- Por estado de pago

**Tabla de resultados:**
- Columnas: fecha/hora, cliente, servicio, profesional, estado, pago, origen
- Click en fila → panel lateral con detalle completo
- Acciones masivas: marcar como completado, exportar

**Detalle de turno (panel lateral o modal):**
- Todos los datos del turno
- Historial de cambios (log de estados)
- Estado del pago (si corresponde)
- Botones: confirmar, reprogramar, cancelar, marcar no-show
- Enviar recordatorio manual (WhatsApp/email)
- Notas del turno

### 3.4 Configuración del negocio (`/dashboard/settings`)

#### Información general
- Nombre, descripción, categoría/rubro
- Logo (upload a Supabase Storage)
- Teléfono, dirección, sitio web
- Timezone
- Días no laborables / feriados especiales

#### Configuración de reservas
- Anticipación mínima para reservar (ej: no se puede reservar con menos de 1 hora)
- Anticipación máxima (ej: no más de 60 días adelante)
- Política de cancelación: texto libre + horas mínimas para cancelación sin cargo
- Permitir reservas sin login del cliente: sí/no
- ¿Requerir confirmación manual del admin antes de confirmar turnos?

#### Notificaciones (`/dashboard/settings/notifications`)
- Activar/desactivar cada tipo de recordatorio (confirmación, 24h, 2h, post-turno)
- Editar plantillas de mensajes de WhatsApp y email
- Variables disponibles en plantillas: `{client_name}`, `{service_name}`, `{staff_name}`, `{date}`, `{time}`, `{address}`, `{reschedule_link}`, `{cancel_link}`
- Previsualización del mensaje con datos de prueba

#### Integraciones (`/dashboard/settings/integrations`)
- **WhatsApp:** conectar número (instrucciones BSP), estado de la conexión, test de envío
- **Mercado Pago:** conectar cuenta (OAuth MP), activar señas, definir % o monto de seña por defecto
- **Google Calendar:** OAuth con Google, seleccionar calendario a sincronizar
- **Widget embebible:** copiar código HTML para pegar en sitio externo

### 3.5 Reportes (`/dashboard/reports`)

#### Reporte de ocupación
- Tasa de ocupación por día/semana/mes
- Horas pico (heatmap hora × día de semana)
- Ocupación por profesional
- Ocupación por servicio

#### Reporte de ingresos
- Ingresos totales por período
- Desglose por servicio
- Desglose por profesional (útil para comisiones)
- Comparativa mes anterior

#### Reporte de no-shows
- Tasa de no-shows total
- No-shows por servicio, por profesional, por hora del día
- Top clientes con más no-shows
- Tendencia mensual

#### Reporte de clientes
- Nuevos clientes por mes
- Clientes recurrentes vs únicos
- Retención (cliente volvió dentro de 30/60/90 días)

**Exportación:** todos los reportes exportables a CSV. Reporte de ingresos exportable a PDF.

### 3.6 Gestión de permisos por rol

**Roles del sistema:**

| Rol | Acceso |
|-----|--------|
| `owner` | acceso total, incluido billing y configuración |
| `admin` | acceso total excepto billing y cambio de plan |
| `staff` | solo su propia agenda, sus turnos y datos básicos de sus clientes |

**Implementación:**
- Middleware de Next.js verifica rol en cada ruta de `/dashboard`
- RLS en Supabase como segunda capa de seguridad
- Staff no puede ver turnos de otros profesionales
- Staff no puede ver reportes financieros

### 3.7 Creación manual de turnos (desde el admin)

Los admins deben poder crear turnos directamente desde el dashboard sin pasar por el flujo público.

**Flujo:**
1. Click en slot vacío del calendario o botón "Nuevo turno"
2. Modal: seleccionar cliente (buscar por nombre/teléfono o crear nuevo)
3. Seleccionar servicio, profesional, fecha y hora
4. Opción: enviar confirmación por WhatsApp al cliente
5. Opción: cobrar seña o marcar como pagado
6. Guardar → turno aparece en agenda

### 3.8 Bloqueo de tiempo

Staff y admins pueden bloquear franjas horarias en la agenda:
- Tipo: "almuerzo", "reunión interna", "vacaciones", "preparación"
- Duración: desde 15 min hasta días completos
- Visible en el calendario como franja bloqueada
- No disponible para reservas de clientes

---

## Requisitos de UX para esta fase

- **Responsive:** el dashboard debe funcionar en tablet (mínimo 768px). En mobile solo las vistas críticas (agenda del día, lista de turnos de hoy).
- **Tiempo real:** la vista de agenda debe actualizarse automáticamente cuando llega un nuevo turno (Supabase Realtime).
- **Estados de carga:** skeleton loaders en todas las secciones, no spinners globales.
- **Feedback inmediato:** todas las acciones (confirmar, cancelar, reprogramar) dan feedback visual antes de esperar la respuesta del servidor (optimistic updates).
- **Atajos de teclado:** `N` = nuevo turno, `/` = buscar cliente, `Esc` = cerrar modal.

---

## Entregables de esta fase

- [ ] Dashboard principal con métricas del día y agenda rápida
- [ ] CRM de clientes (lista + ficha) con historial de turnos
- [ ] Lista de turnos con filtros y detalle en panel lateral
- [ ] Creación manual de turnos desde el admin
- [ ] Bloqueo de tiempo en agenda
- [ ] Configuración general del negocio
- [ ] Configuración de política de cancelación
- [ ] Editor de plantillas de notificaciones
- [ ] Gestión de permisos (owner / admin / staff)
- [ ] Reportes básicos (ocupación + ingresos + no-shows)
- [ ] Exportación a CSV

---

## Siguiente fase

Una vez completos los entregables → continuar con [`FASE_4_pagos_whatsapp.md`](./FASE_4_pagos_whatsapp.md)
