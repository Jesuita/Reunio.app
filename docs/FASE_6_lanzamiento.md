# Fase 6 — Lanzamiento y crecimiento

**Duración estimada:** semanas 17–20  
**Prerequisito:** Fase 5 completa (producto SaaS funcional end-to-end)  
**Objetivo:** validar el producto con negocios reales en beta privada, corregir problemas críticos, lanzar públicamente y establecer los sistemas de métricas y crecimiento.

---

## Módulo 6.1 Beta privada

### 6.1.1 Selección de beta testers

Reclutar entre 5 y 10 negocios reales en Argentina para la beta privada. Criterios de selección:

- Al menos 2 rubros diferentes (ej: peluquería + psicólogo)
- Mix de tamaños: solopreneur + negocio con 2–3 profesionales
- Dueños dispuestos a dar feedback activo
- Preferencia por negocios que ya usan alguna herramienta digital (más receptivos)
- Ubicación: preferentemente Argentina (para probar MP + WA en producción real)

### 6.1.2 Plan de acompañamiento beta

**Semana 1:** onboarding personalizado
- Llamada de setup de 30 minutos con cada negocio
- Ayudar a configurar servicios, staff y horarios
- Conectar WhatsApp y Mercado Pago en su cuenta real

**Semana 2:** primer rodaje
- El negocio empieza a usar Reunio con clientes reales
- Canal de soporte dedicado (grupo de WhatsApp o Slack)
- Respuesta en menos de 2 horas durante horario laboral

**Semana 3:** entrevistas de feedback
- Llamada de 20 minutos con cada negocio
- Preguntas: ¿qué funcionó? ¿qué fue confuso? ¿qué falta? ¿pagarías por esto?

**Semana 4:** iteración y correcciones
- Priorizar bugs críticos y mejoras de UX más solicitadas
- Segunda ronda de validación con los mismos negocios

### 6.1.3 Métricas a monitorear durante la beta

- Tasa de completación del onboarding (objetivo: >80%)
- Tiempo desde registro hasta primer turno recibido (objetivo: <24h)
- Tasa de no-shows reportada (vs. antes de usar Reunio)
- Bugs críticos bloqueantes (objetivo: 0 al terminar la beta)
- Net Promoter Score (pregunta: "¿Recomendarías Reunio?" 0–10)

---

## Módulo 6.2 QA, performance y seguridad

### 6.2.1 QA funcional

Checklist a completar antes del lanzamiento público:

**Flujo de reserva:**
- [ ] Reserva sin seña (web)
- [ ] Reserva con seña (MP sandbox y producción)
- [ ] Reserva por WhatsApp (bot completo)
- [ ] Reprogramación desde link de WA
- [ ] Cancelación desde link de WA con reembolso
- [ ] Reserva con múltiples profesionales disponibles
- [ ] Reserva de clase grupal con cupo máximo

**Recordatorios:**
- [ ] Confirmación inmediata por WA
- [ ] Recordatorio 24h antes
- [ ] Recordatorio 2h antes
- [ ] Follow-up post-turno
- [ ] No se envían si el turno fue cancelado

**Admin:**
- [ ] Dashboard carga en < 2 segundos
- [ ] Creación manual de turno
- [ ] Reprogramación desde el dashboard
- [ ] Reporte de ingresos correcto
- [ ] Permisos: staff no ve datos de otros profesionales

**Pagos:**
- [ ] Webhook de MP es idempotente (duplicar el evento no crea dos pagos)
- [ ] Slot se libera si no se paga en 30 min
- [ ] Reembolso funciona desde el admin

### 6.2.2 Performance

Objetivos de performance (medidos con Lighthouse y Web Vitals):

| Métrica | Objetivo |
|---------|----------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP | < 200ms |
| CLS | < 0.1 |
| Time to first booking (carga) | < 3s en 3G |
| Dashboard (carga inicial) | < 2s |

Herramientas: Vercel Analytics + Sentry Performance.

### 6.2.3 Seguridad

Checklist de seguridad pre-lanzamiento:

- [ ] RLS activado en TODAS las tablas de Supabase (verificar con `supabase db lint`)
- [ ] Variables de entorno: ningún secret hardcodeado en el código
- [ ] Firmas de webhooks verificadas (MP y Stripe)
- [ ] Rate limiting en API pública y en el bot de WhatsApp
- [ ] Validación de inputs con Zod en todas las API routes
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad en Next.js (`X-Frame-Options`, `CSP`, etc.)
- [ ] Tokens de reprogramación/cancelación con expiración y uso único
- [ ] Datos sensibles (tokens MP/WA) cifrados en base de datos
- [ ] Backups automáticos de Supabase activados

---

## Módulo 6.3 Landing page y go-to-market

### 6.3.1 Landing page (`/`)

**Estructura:**
```
Hero: "Agendá turnos online. Reducí ausencias. Hacé crecer tu negocio."
  [CTA: Empezar gratis — sin tarjeta de crédito]

Social proof: "Usada por +X negocios en Argentina"

Problema → Solución: antes/después de usar Reunio

Features principales:
  - Reservas 24/7 (tu link, tu página)
  - Recordatorios por WhatsApp que reducen ausencias
  - Cobro de señas con Mercado Pago
  - Para cualquier rubro

Demo: video o gif animado del flujo de reserva

Testimonios de beta testers (con foto y nombre del negocio)

Precios: tabla de planes con CTA

Footer con links de ayuda, términos, contacto
```

**SEO keywords a atacar:**
- "sistema de turnos online Argentina"
- "agenda online para peluquería"
- "recordatorio de turnos por WhatsApp"
- "aplicación turnos médicos Argentina"

### 6.3.2 Estrategia de lanzamiento LATAM

**Canal 1 — Comunidades y grupos:**
- Grupos de Facebook de dueños de peluquerías, salones y spas en Argentina
- Grupos de Instagram/WhatsApp de profesionales de la salud
- Foros de emprendedores (Reddit, LinkedIn)
- Post de "build in public" en Twitter/X

**Canal 2 — Outreach directo:**
- DMs a negocios locales en Instagram con muchos followers pero sin sistema de turnos
- Mensaje template: "Vi que agendás turnos por WhatsApp manualmente. Creé una herramienta gratis para automatizarlo en 10 minutos. ¿Te muestro?"

**Canal 3 — Contenido:**
- Post en LinkedIn: "Cómo reducir ausencias en tu negocio un 50% con recordatorios automáticos"
- Reels de Instagram mostrando el flujo de reserva (desde el punto de vista del cliente)
- Guía en blog: "Cómo cobrar señas por WhatsApp paso a paso"

**Canal 4 — Product Hunt:**
- Lanzar en Product Hunt en semana 3 post-beta (martes o miércoles a las 12:01 AM PST)
- Preparar hunter, assets, descripción y comentarios de respuesta

### 6.3.3 Programa de referidos (post-lanzamiento)

- Negocio que refiere a otro negocio → 1 mes gratis para ambos
- Integrado en el dashboard: "Compartí Reunio y ganá 1 mes gratis"
- Tracking con código de referido único por organización

---

## Módulo 6.4 Métricas SaaS y dashboards internos

### 6.4.1 KPIs a medir desde el día 1

**Adquisición:**
- Nuevos registros por día/semana
- Fuente de tráfico (UTM tracking)
- Tasa de completación del onboarding

**Activación:**
- % de negocios que reciben su primer turno en los primeros 7 días
- Tiempo promedio hasta primer turno

**Retención:**
- Retención a 30, 60, 90 días
- Churn mensual (% de planes pagos cancelados)

**Revenue:**
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV estimado

**Producto:**
- Turnos creados por día (indicador de salud)
- Recordatorios enviados por día
- Tasa de no-shows de clientes de Reunio

### 6.4.2 Herramientas de monitoreo

| Herramienta | Uso |
|-------------|-----|
| PostHog | Product analytics, funnels, session replay |
| Sentry | Error tracking y performance |
| Vercel Analytics | Web vitals y tráfico |
| Stripe Dashboard | MRR, churn, revenue |
| Dashboard interno en Reunio | métricas del negocio para el equipo |

### 6.4.3 Alertas operacionales

Configurar alertas en Sentry/Slack para:
- Error rate > 1% en cualquier API endpoint
- Webhook de MP con tasa de fallo > 5%
- Cron de recordatorios no ejecutado en > 20 minutos
- Tiempo de respuesta del motor de disponibilidad > 500ms
- Cualquier error 500 en el flujo de reserva del cliente

---

## Módulo 6.5 Soporte y documentación

### 6.5.1 Centro de ayuda

Publicar antes del lanzamiento público al menos:
- Guía de inicio rápido (video + texto)
- Cómo conectar WhatsApp paso a paso
- Cómo conectar Mercado Pago paso a paso
- Cómo configurar señas
- FAQ de los 10 problemas más comunes (identificados en la beta)

### 6.5.2 Soporte in-app

- Chat de soporte embebido (Intercom o Crisp) en el dashboard
- Bot de soporte con respuestas automáticas a preguntas frecuentes
- Escalada a humano para problemas complejos

---

## Criterios de lanzamiento público

El lanzamiento público se habilita cuando se cumplen TODOS estos criterios:

- [ ] 0 bugs críticos bloqueantes en la beta
- [ ] NPS de beta testers ≥ 7/10 promedio
- [ ] Tiempo de completación del onboarding < 15 minutos en promedio
- [ ] Al menos 1 negocio de la beta actualiza a plan Pro (validación de pago)
- [ ] Checklist de seguridad 100% completo
- [ ] Landing page publicada
- [ ] Centro de ayuda con al menos 5 guías
- [ ] Sistema de alertas operacionales activo

---

## Plan de iteración post-lanzamiento

Las primeras 4 semanas post-lanzamiento son de escucha activa e iteración rápida. Ciclos de 2 semanas:

**Ciclo 1 (semanas 21–22):** bugs y fricción del onboarding  
**Ciclo 2 (semanas 23–24):** mejoras de retención (qué hace que los negocios no vuelvan en la semana 2)  
**Ciclo 3 (semanas 25–26):** primera feature de expansión según feedback (ej: clases grupales, turnos recurrentes, app móvil)

---

## Entregables de esta fase

- [ ] Beta privada con 5–10 negocios reales completada
- [ ] Informe de feedback de la beta con aprendizajes clave
- [ ] Checklist de QA 100% completo
- [ ] Checklist de seguridad 100% completo
- [ ] Performance targets alcanzados (LCP < 2.5s, dashboard < 2s)
- [ ] Landing page publicada y optimizada para SEO
- [ ] Estrategia go-to-market ejecutada (comunidades + outreach)
- [ ] Centro de ayuda con guías básicas
- [ ] Soporte in-app activo
- [ ] Dashboard de métricas SaaS interno
- [ ] Alertas operacionales configuradas
- [ ] Lanzamiento público en Product Hunt
- [ ] Criterios de lanzamiento verificados y documentados
