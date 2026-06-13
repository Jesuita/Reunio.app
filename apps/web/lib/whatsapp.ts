/**
 * WhatsApp Business API client via Meta Graph API.
 * BSP: 360dialog (or direct Meta API).
 *
 * For templates to work they must be approved in Meta Business Manager.
 * In dev/staging, messages are logged but not sent unless WA credentials are set.
 */

import crypto from "crypto";

const API_URL   = process.env["WHATSAPP_API_URL"] ?? "https://graph.facebook.com/v19.0";
const API_TOKEN = process.env["WHATSAPP_API_TOKEN"];
const PHONE_ID  = process.env["WHATSAPP_PHONE_NUMBER_ID"]; // Meta phone_number_id

function formatDate(date: Date, timezone: string) {
  return date.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", timeZone: timezone,
  });
}

function formatTime(date: Date, timezone: string) {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: timezone,
  });
}

// ── Low-level send ────────────────────────────────────────────────────────────
async function sendMessage(payload: Record<string, unknown>): Promise<string> {
  if (!API_TOKEN || !PHONE_ID) {
    console.log("[WhatsApp] DEV mode — would send:", JSON.stringify(payload, null, 2));
    return "dev-message-id";
  }

  const res = await fetch(`${API_URL}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.messages?.[0]?.id ?? "unknown";
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function sendText(to: string, text: string): Promise<string> {
  return sendMessage({
    to,
    type: "text",
    text: { body: text, preview_url: false },
  });
}

export async function sendTemplate(params: {
  to: string;
  templateName: string;
  language?: string;
  components: Array<{
    type: "header" | "body" | "button";
    parameters: Array<{ type: "text"; text: string }>;
    index?: number;
    sub_type?: string;
  }>;
}): Promise<string> {
  return sendMessage({
    to: params.to,
    type: "template",
    template: {
      name:     params.templateName,
      language: { code: params.language ?? "es_AR" },
      components: params.components,
    },
  });
}

export async function sendButtons(params: {
  to: string;
  body: string;
  buttons: Array<{ id: string; title: string }>;
}): Promise<string> {
  return sendMessage({
    to:   params.to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: params.body },
      action: {
        buttons: params.buttons.map((b) => ({
          type:  "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

export async function sendList(params: {
  to: string;
  body: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}): Promise<string> {
  return sendMessage({
    to:   params.to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: params.body },
      action: {
        button:   params.buttonText,
        sections: params.sections,
      },
    },
  });
}

// ── Reminder dispatcher ───────────────────────────────────────────────────────
export type ReminderContext = {
  clientName:  string;
  clientPhone: string;
  clientEmail: string | null;
  serviceName: string;
  staffName:   string;
  startsAt:    Date;
  endsAt:      Date;
  orgName:     string;
  orgAddress:  string;
  timezone:    string;
  bookingId:   string;
  reminderType: string;
};

const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";

export async function sendWhatsAppReminder(ctx: ReminderContext): Promise<void> {
  const phone = ctx.clientPhone.replace(/\D/g, "");
  const date  = formatDate(ctx.startsAt, ctx.timezone);
  const time  = formatTime(ctx.startsAt, ctx.timezone);

  switch (ctx.reminderType) {
    case "confirmation":
      await sendTemplate({
        to:           phone,
        templateName: "booking_confirmation",
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: ctx.clientName },
            { type: "text", text: ctx.serviceName },
            { type: "text", text: ctx.staffName },
            { type: "text", text: date },
            { type: "text", text: time },
            { type: "text", text: ctx.orgAddress || ctx.orgName },
          ],
        }],
      });
      break;

    case "24h":
      await sendTemplate({
        to:           phone,
        templateName: "booking_reminder_24h",
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: ctx.clientName },
            { type: "text", text: ctx.serviceName },
            { type: "text", text: ctx.staffName },
            { type: "text", text: date },
            { type: "text", text: time },
          ],
        }],
      });
      break;

    case "2h":
      await sendTemplate({
        to:           phone,
        templateName: "booking_reminder_2h",
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: ctx.clientName },
            { type: "text", text: ctx.serviceName },
            { type: "text", text: time },
            { type: "text", text: ctx.staffName },
            { type: "text", text: ctx.orgAddress || ctx.orgName },
          ],
        }],
      });
      break;

    case "followup":
      await sendText(
        phone,
        `Hola ${ctx.clientName}! 🌟 ¿Cómo te fue con tu ${ctx.serviceName}? Esperamos que hayas quedado contento/a. ¡Hasta la próxima en ${ctx.orgName}!`,
      );
      break;

    default:
      console.warn("[WhatsApp] unknown reminder type:", ctx.reminderType);
  }
}

// ── Immediate booking confirmation (fire-and-forget) ─────────────────────────
export async function sendBookingConfirmationWA(params: {
  phone: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  startsAt: Date;
  orgName: string;
  orgAddress?: string;
  timezone: string;
  manageUrl: string;
}): Promise<void> {
  const phone = params.phone.replace(/\D/g, "");
  const date  = formatDate(params.startsAt, params.timezone);
  const time  = formatTime(params.startsAt, params.timezone);

  const text =
    `✅ *Turno confirmado en ${params.orgName}*\n\n` +
    `Hola ${params.clientName}!\n\n` +
    `📋 *Servicio:* ${params.serviceName}\n` +
    `👤 *Con:* ${params.staffName}\n` +
    `📅 *Fecha:* ${date}\n` +
    `🕐 *Hora:* ${time} hs\n` +
    (params.orgAddress ? `📍 *Dirección:* ${params.orgAddress}\n` : "") +
    `\nPodés consultar o cancelar tu turno en:\n${params.manageUrl}`;

  await sendText(phone, text);
}

// ── Webhook verification ──────────────────────────────────────────────────────
export function verifyWhatsAppSignature(
  xHubSignature: string | null,
  rawBody: Buffer,
): boolean {
  const secret = process.env["WHATSAPP_WEBHOOK_SECRET"];
  if (!secret) return true; // skip in dev

  if (!xHubSignature?.startsWith("sha256=")) return false;

  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (xHubSignature.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(xHubSignature),
    Buffer.from(expected),
  );
}
