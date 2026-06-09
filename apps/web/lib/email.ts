/**
 * Email transactional service using Resend.
 * Templates are plain-text friendly HTML built inline (no React Email needed at this stage).
 *
 * In dev mode (no RESEND_API_KEY), emails are logged to console.
 */

import { Resend } from "resend";
import type { ReminderContext } from "@/lib/whatsapp";

function getResend() {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  return new Resend(key);
}

const FROM_EMAIL = "Reunio <noreply@reunio.app>";

function formatDate(date: Date, timezone: string) {
  return date.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: timezone,
  });
}
function formatTime(date: Date, timezone: string) {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: timezone,
  });
}

function baseHtml(content: string, orgName: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${orgName}</title></head>
<body style="font-family:system-ui,sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5">
    <div style="background:#1a1a2e;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">${orgName}</h1>
    </div>
    <div style="padding:32px">
      ${content}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center">
      <p style="color:#999;font-size:12px;margin:0">Reunio · Sistema de turnos online</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.log("[Email] DEV mode — would send to:", params.to, "Subject:", params.subject);
    return;
  }
  await resend.emails.send({ from: FROM_EMAIL, ...params });
}

// ── Templates ─────────────────────────────────────────────────────────────────
export async function sendEmailReminder(ctx: ReminderContext) {
  if (!ctx.clientEmail) return;

  const date = formatDate(ctx.startsAt, ctx.timezone);
  const time = formatTime(ctx.startsAt, ctx.timezone);
  const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";

  if (ctx.reminderType === "confirmation") {
    await sendEmail({
      to:      ctx.clientEmail,
      subject: `✓ Turno confirmado — ${ctx.serviceName}`,
      html: baseHtml(`
        <h2 style="font-size:22px;margin:0 0 8px">¡Turno confirmado! ✓</h2>
        <p style="color:#555;margin:0 0 24px">Hola ${ctx.clientName}, tu turno está reservado.</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:0 0 24px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#888;padding:6px 0;font-size:14px">Servicio</td><td style="font-weight:600;font-size:14px">${ctx.serviceName}</td></tr>
            <tr><td style="color:#888;padding:6px 0;font-size:14px">Profesional</td><td style="font-weight:600;font-size:14px">${ctx.staffName}</td></tr>
            <tr><td style="color:#888;padding:6px 0;font-size:14px">Fecha</td><td style="font-weight:600;font-size:14px;text-transform:capitalize">${date}</td></tr>
            <tr><td style="color:#888;padding:6px 0;font-size:14px">Hora</td><td style="font-weight:600;font-size:14px">${time}</td></tr>
            ${ctx.orgAddress ? `<tr><td style="color:#888;padding:6px 0;font-size:14px">Dirección</td><td style="font-weight:600;font-size:14px">${ctx.orgAddress}</td></tr>` : ""}
          </table>
        </div>
        <p style="font-size:13px;color:#888;margin:0">¿Necesitás cambiar algo? Usá el link que te enviamos por WhatsApp.</p>
      `, ctx.orgName),
    });
  } else if (ctx.reminderType === "24h") {
    await sendEmail({
      to:      ctx.clientEmail,
      subject: `⏰ Tu turno es mañana — ${ctx.serviceName}`,
      html: baseHtml(`
        <h2 style="font-size:22px;margin:0 0 8px">Tu turno es mañana</h2>
        <p style="color:#555;margin:0 0 24px">Hola ${ctx.clientName}, te recordamos que mañana tenés turno.</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:0 0 24px">
          <p style="margin:0;font-size:18px;font-weight:700">${ctx.serviceName}</p>
          <p style="margin:4px 0 0;color:#555;font-size:14px">${date} a las ${time} · ${ctx.staffName}</p>
          ${ctx.orgAddress ? `<p style="margin:4px 0 0;color:#888;font-size:13px">📍 ${ctx.orgAddress}</p>` : ""}
        </div>
      `, ctx.orgName),
    });
  } else if (ctx.reminderType === "2h") {
    await sendEmail({
      to:      ctx.clientEmail,
      subject: `⏰ En 2 horas tenés turno — ${ctx.serviceName}`,
      html: baseHtml(`
        <h2 style="font-size:22px;margin:0 0 8px">¡En 2 horas es tu turno!</h2>
        <p style="color:#555;margin:0 0 24px">Hola ${ctx.clientName}, ¡ya casi!</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:20px">
          <p style="margin:0;font-size:18px;font-weight:700">${time} — ${ctx.serviceName}</p>
          <p style="margin:4px 0 0;color:#555;font-size:14px">con ${ctx.staffName}</p>
          ${ctx.orgAddress ? `<p style="margin:8px 0 0;color:#888;font-size:13px">📍 ${ctx.orgAddress}</p>` : ""}
        </div>
      `, ctx.orgName),
    });
  }
}

export async function sendBookingCancelledEmail(params: {
  to: string;
  clientName: string;
  serviceName: string;
  startsAt: Date;
  orgName: string;
  orgSlug: string;
  timezone: string;
  refunded: boolean;
}) {
  const date = formatDate(params.startsAt, params.timezone);
  const time = formatTime(params.startsAt, params.timezone);
  const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";

  await sendEmail({
    to:      params.to,
    subject: `Turno cancelado — ${params.serviceName}`,
    html: baseHtml(`
      <h2 style="font-size:22px;margin:0 0 8px">Turno cancelado</h2>
      <p style="color:#555;margin:0 0 24px">
        Hola ${params.clientName}, tu turno de ${params.serviceName} del ${date} a las ${time} fue cancelado.
        ${params.refunded ? "El reembolso de tu seña se procesará en los próximos días hábiles." : ""}
      </p>
      <a href="${BASE_URL}/${params.orgSlug}" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
        Reservar nuevo turno
      </a>
    `, params.orgName),
  });
}
