/**
 * WhatsApp conversational booking bot.
 *
 * State machine per phone number, persisted in a `whatsapp_sessions` table.
 * Each session expires after 30 minutes of inactivity.
 *
 * Supported flows:
 *  - Full booking: service → staff → date → slot → confirm → (deposit if needed)
 *  - "MIS TURNOS" → list upcoming bookings
 *  - "CANCELAR"   → cancel next booking
 *  - "HABLAR"     → notify admin, pause bot
 */

import { createClient } from "@/lib/supabase/server";
import {
  sendText,
  sendButtons,
  sendList,
} from "@/lib/whatsapp";
import { computeAvailableSlots } from "@/lib/availability/engine";
import {
  fetchOrganization,
  fetchService,
  fetchStaff,
  fetchSchedules,
  fetchOverrides,
  fetchExistingBookings,
} from "@/lib/availability/queries";
import { createDepositPreference } from "@/lib/mercadopago";
import { signBookingToken, buildManageUrl } from "@/lib/booking-token";

const SESSION_TTL_MINUTES = 30;

type ConversationStep =
  | "idle"
  | "selecting_service"
  | "selecting_staff"
  | "selecting_date"
  | "selecting_time"
  | "confirming_name"
  | "awaiting_payment"
  | "completed";

type Session = {
  id: string;
  phone: string;
  org_id: string;
  step: ConversationStep;
  service_id: string | null;
  staff_id: string | null;
  date: string | null;
  slot: string | null;  // ISO string of starts_at
  client_name: string | null;
  expires_at: string;
};

async function getSession(phone: string, orgId: string): Promise<Session | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("phone", phone)
    .eq("org_id", orgId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data as Session | null;
}

async function saveSession(session: Partial<Session> & { phone: string; org_id: string }) {
  const supabase = createClient();
  const expires_at = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000).toISOString();
  await supabase.from("whatsapp_sessions").upsert(
    { ...session, expires_at },
    { onConflict: "phone,org_id" },
  );
}

async function clearSession(phone: string, orgId: string) {
  const supabase = createClient();
  await supabase
    .from("whatsapp_sessions")
    .delete()
    .eq("phone", phone)
    .eq("org_id", orgId);
}

async function getOrgByPhone(orgPhone: string) {
  const supabase = createClient();
  // The org's WA number is stored in organizations.settings.whatsapp_phone
  // For demo we return the seed org
  const { data } = await supabase
    .from("organizations")
    .select("id, name, slug, timezone, settings")
    .limit(1)
    .single();
  return data;
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function processConversation(params: {
  from: string;
  input: string;
  orgPhone: string;
}) {
  const { from, input, orgPhone } = params;
  const normalInput = input.trim().toUpperCase();

  const org = await getOrgByPhone(orgPhone);
  if (!org) return;

  // ── Global commands (always available) ────────────────────────────────────
  if (normalInput === "MIS TURNOS") {
    await handleMyBookings(from, org.id, org.timezone);
    return;
  }
  if (normalInput === "CANCELAR") {
    await handleCancelNextBooking(from, org.id, org.timezone);
    await clearSession(from, org.id);
    return;
  }
  if (normalInput === "HABLAR" || normalInput === "HABLAR CON ALGUIEN") {
    await sendText(from, "Entendido. Un miembro del equipo se comunicará con vos pronto. ¡Gracias por tu paciencia!");
    await clearSession(from, org.id);
    return;
  }

  const session = await getSession(from, org.id);

  // ── No session → start greeting ───────────────────────────────────────────
  if (!session || session.step === "idle") {
    await startBookingFlow(from, org);
    return;
  }

  // ── Resume session ────────────────────────────────────────────────────────
  switch (session.step) {
    case "selecting_service": await handleServiceSelection(from, input, session, org); break;
    case "selecting_staff":   await handleStaffSelection(from, input, session, org);   break;
    case "selecting_date":    await handleDateSelection(from, input, session, org);    break;
    case "selecting_time":    await handleTimeSelection(from, input, session, org);    break;
    case "confirming_name":   await handleNameConfirmation(from, input, session, org); break;
    default:
      await sendText(from, `Hola! Para reservar un turno, escribí *HOLA*. Para ver tus turnos escribí *MIS TURNOS*.`);
      await clearSession(from, org.id);
  }
}

// ── Flow steps ────────────────────────────────────────────────────────────────
async function startBookingFlow(from: string, org: { id: string; name: string }) {
  const supabase = createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, category")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .order("category")
    .order("name");

  if (!services?.length) {
    await sendText(from, `Hola! En este momento no hay servicios disponibles. Contactanos directamente.`);
    return;
  }

  // Group by category for list widget
  const byCat: Record<string, typeof services> = {};
  for (const s of services) {
    (byCat[s.category] ??= []).push(s);
  }

  await sendList({
    to:         from,
    body:       `Hola! Soy el asistente de *${org.name}*. ¿Qué servicio querés reservar?`,
    buttonText: "Ver servicios",
    sections:   Object.entries(byCat).map(([cat, items]) => ({
      title: cat,
      rows:  items.map((s) => ({
        id:          s.id,
        title:       s.name,
        description: `${s.duration_minutes} min · $${s.price.toLocaleString("es-AR")}`,
      })),
    })),
  });

  await saveSession({ phone: from, org_id: org.id, step: "selecting_service" });
}

async function handleServiceSelection(
  from: string,
  serviceId: string,
  session: Session,
  org: { id: string; name: string; timezone: string },
) {
  const supabase = createClient();
  const { data: service } = await supabase
    .from("services")
    .select("id, name")
    .eq("id", serviceId)
    .eq("organization_id", org.id)
    .maybeSingle();

  if (!service) {
    await sendText(from, "No reconocí esa opción. Por favor elegí un servicio de la lista.");
    return;
  }

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name")
    .eq("organization_id", org.id)
    .eq("is_active", true);

  if (!staffList?.length) {
    await sendText(from, "No hay profesionales disponibles. Intentá más tarde.");
    await clearSession(from, org.id);
    return;
  }

  if (staffList.length === 1) {
    // Auto-select single staff, go to date
    await saveSession({ phone: from, org_id: org.id, step: "selecting_date", service_id: service.id, staff_id: staffList[0].id });
    await askForDate(from, service.name);
  } else {
    await sendButtons({
      to:      from,
      body:    `Elegiste *${service.name}*. ¿Con quién querés atenderte?`,
      buttons: staffList.slice(0, 3).map((s) => ({ id: s.id, title: s.name })),
    });
    await saveSession({ phone: from, org_id: org.id, step: "selecting_staff", service_id: service.id });
  }
}

async function handleStaffSelection(
  from: string,
  staffId: string,
  session: Session,
  org: { id: string; timezone: string },
) {
  const supabase = createClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("id, name")
    .eq("id", staffId)
    .eq("organization_id", org.id)
    .maybeSingle();

  if (!staff) {
    await sendText(from, "No reconocí esa opción. Por favor elegí un profesional de los botones.");
    return;
  }

  const { data: svc } = await supabase.from("services").select("name").eq("id", session.service_id!).single();
  await saveSession({ ...session, step: "selecting_date", staff_id: staffId });
  await askForDate(from, svc?.name ?? "el servicio");
}

async function askForDate(from: string, serviceName: string) {
  const today    = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const fmt = (d: Date) => d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  await sendButtons({
    to:   from,
    body: `¿Para qué día querés *${serviceName}*?`,
    buttons: [
      { id: `date:${today.toISOString().slice(0, 10)}`,    title: `Hoy (${fmt(today)})` },
      { id: `date:${tomorrow.toISOString().slice(0, 10)}`, title: `Mañana (${fmt(tomorrow)})` },
      { id: "date:other", title: "Otra fecha" },
    ],
  });
}

async function handleDateSelection(
  from: string,
  input: string,
  session: Session,
  org: { id: string; timezone: string },
) {
  let dateStr: string;

  if (input.startsWith("date:")) {
    const val = input.slice(5);
    if (val === "other") {
      await sendText(from, "Enviame la fecha en formato DD/MM (por ejemplo: 15/07)");
      await saveSession({ ...session, step: "selecting_date" });
      return;
    }
    dateStr = val;
  } else {
    // Try to parse "DD/MM" or "DD/MM/YYYY"
    const match = input.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    if (!match) {
      await sendText(from, `No entendí la fecha. Enviame el día en formato DD/MM (ej: 15/07) o elegí una opción:`);
      await askForDate(from, "el servicio");
      return;
    }
    const year  = match[3] ? parseInt(match[3]) : new Date().getFullYear();
    const month = parseInt(match[2]) - 1;
    const day   = parseInt(match[1]);
    dateStr = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
  }

  // Fetch available slots
  try {
    const [organization, service, staffList, schedules, overrides, existingBookings] = await Promise.all([
      fetchOrganization(org.id),
      fetchService(org.id, session.service_id!),
      fetchStaff(org.id, session.staff_id!),
      fetchSchedules(org.id, [session.staff_id!]),
      fetchOverrides([session.staff_id!], dateStr, dateStr),
      fetchExistingBookings(org.id, [session.staff_id!], dateStr, dateStr, org.timezone),
    ]);

    const slots = computeAvailableSlots({
      params: { organizationId: org.id, serviceId: session.service_id!, staffId: session.staff_id!, dateFrom: dateStr, dateTo: dateStr },
      organization, service, staffList, schedules, overrides, existingBookings,
    }).filter((s) => s.available);

    if (slots.length === 0) {
      await sendButtons({
        to:   from,
        body: `No hay turnos disponibles para el ${dateStr}. ¿Querés buscar otro día?`,
        buttons: [
          { id: `date:${new Date(new Date(dateStr).getTime() + 86400000).toISOString().slice(0, 10)}`, title: "Día siguiente" },
          { id: "date:other", title: "Otra fecha" },
        ],
      });
      return;
    }

    const timeStr = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    const rows = slots.slice(0, 10).map((s) => ({
      id:    `slot:${s.startsAt.toISOString()}`,
      title: timeStr(s.startsAt),
    }));

    await sendList({
      to:         from,
      body:       `Horarios disponibles para el *${dateStr}*:`,
      buttonText: "Ver horarios",
      sections:   [{ title: "Turnos disponibles", rows }],
    });

    await saveSession({ ...session, step: "selecting_time", date: dateStr });
  } catch (err) {
    console.error("[bot] date selection error:", err);
    await sendText(from, "Hubo un error al buscar los horarios. Intentá de nuevo.");
  }
}

async function handleTimeSelection(
  from: string,
  input: string,
  session: Session,
  org: { id: string },
) {
  if (!input.startsWith("slot:")) {
    await sendText(from, "Por favor elegí un horario de la lista.");
    return;
  }
  const slotIso = input.slice(5);
  await saveSession({ ...session, step: "confirming_name", slot: slotIso });
  await sendText(from, "¿A qué nombre reservo el turno?");
}

async function handleNameConfirmation(
  from: string,
  name: string,
  session: Session,
  org: { id: string; name: string; timezone: string },
) {
  if (name.trim().length < 2) {
    await sendText(from, "Por favor enviame tu nombre completo.");
    return;
  }

  const supabase = createClient();
  const startsAt = new Date(session.slot!);

  // Fetch service for deposit info
  const { data: service } = await supabase
    .from("services")
    .select("name, duration_minutes, price, deposit_amount")
    .eq("id", session.service_id!)
    .single();

  if (!service) {
    await sendText(from, "Hubo un error. Empezá de nuevo escribiendo *HOLA*.");
    await clearSession(from, org.id);
    return;
  }

  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);

  // Find-or-create client
  let clientId: string;
  {
    const { data: existing } = await supabase.from("clients").select("id")
      .eq("organization_id", org.id).eq("phone", from).maybeSingle();
    if (existing) {
      clientId = existing.id;
    } else {
      const { data: created } = await supabase.from("clients")
        .insert({ organization_id: org.id, name: name.trim(), phone: from })
        .select("id").single();
      clientId = created!.id;
    }
  }

  // Create booking
  const requiresDeposit = service.deposit_amount != null && service.deposit_amount > 0;
  const { data: booking } = await supabase
    .from("bookings")
    .insert({
      organization_id: org.id,
      service_id:      session.service_id,
      staff_id:        session.staff_id,
      client_id:       clientId,
      starts_at:       startsAt.toISOString(),
      ends_at:         endsAt.toISOString(),
      status:          requiresDeposit ? "pending" : "confirmed",
      payment_status:  "unpaid",
      source:          "whatsapp",
    })
    .select("id")
    .single();

  if (!booking) {
    await sendText(from, "Hubo un error al crear el turno. Intentá de nuevo.");
    await clearSession(from, org.id);
    return;
  }

  if (requiresDeposit) {
    // Create MP preference
    const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";
    const { initPoint } = await createDepositPreference({
      bookingId:     booking.id,
      serviceTitle:  service.name,
      depositAmount: service.deposit_amount!,
      backUrlBase:   BASE_URL,
    });

    await sendText(
      from,
      `Perfecto ${name.trim()}! 🎉\n\nPara confirmar tu turno de *${service.name}* necesitamos una seña de $${service.deposit_amount!.toLocaleString("es-AR")}.\n\nPagá acá (válido 30 min):\n${initPoint}`,
    );
    await saveSession({ ...session, step: "awaiting_payment", client_name: name.trim() });
  } else {
    // Confirmed directly
    const manageToken = await signBookingToken(booking.id, org.id);
    const BASE_URL    = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";
    const manageUrl   = buildManageUrl(BASE_URL, manageToken);

    const date = startsAt.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    const time = startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

    await sendText(
      from,
      `✅ ¡Listo ${name.trim()}! Tu turno de *${service.name}* el *${date} a las ${time}* está confirmado.\n\nSi necesitás cancelar o cambiar: ${manageUrl}`,
    );
    await clearSession(from, org.id);
  }
}

// ── "MIS TURNOS" command ──────────────────────────────────────────────────────
async function handleMyBookings(from: string, orgId: string, timezone: string) {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients").select("id").eq("organization_id", orgId).eq("phone", from).maybeSingle();

  if (!client) {
    await sendText(from, "No encontré turnos registrados con este número.");
    return;
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("starts_at, services(name), staff(name)")
    .eq("client_id", client.id)
    .eq("organization_id", orgId)
    .in("status", ["confirmed", "pending"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(3);

  if (!bookings?.length) {
    await sendText(from, "No tenés turnos próximos.");
    return;
  }

  const lines = bookings.map((b) => {
    const date = new Date(b.starts_at).toLocaleDateString("es-AR", {
      weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
    });
    const time = new Date(b.starts_at).toLocaleTimeString("es-AR", {
      hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    });
    return `• ${date} ${time} — ${(b.services as {name:string}|null)?.name} con ${(b.staff as {name:string}|null)?.name}`;
  });

  await sendText(from, `Tus próximos turnos:\n\n${lines.join("\n")}`);
}

// ── "CANCELAR" command ────────────────────────────────────────────────────────
async function handleCancelNextBooking(from: string, orgId: string, timezone: string) {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients").select("id").eq("organization_id", orgId).eq("phone", from).maybeSingle();

  if (!client) {
    await sendText(from, "No encontré turnos registrados con este número.");
    return;
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, starts_at, services(name)")
    .eq("client_id", client.id)
    .eq("organization_id", orgId)
    .in("status", ["confirmed", "pending"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(1)
    .maybeSingle();

  if (!booking) {
    await sendText(from, "No tenés turnos próximos para cancelar.");
    return;
  }

  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);

  const date = new Date(booking.starts_at).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
  await sendText(
    from,
    `Tu turno de *${(booking.services as {name:string}|null)?.name}* del *${date}* fue cancelado. ¡Hasta la próxima!`,
  );
}
