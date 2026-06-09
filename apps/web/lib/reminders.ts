/**
 * Reminder scheduling and processing.
 *
 * scheduleReminders(): called when a booking is confirmed — creates/replaces
 *   reminders with proper scheduled_at timestamps.
 *
 * processReminders(): called by the cron job — finds due reminders and sends them.
 */

import { subHours, addHours } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppReminder } from "@/lib/whatsapp";
import { sendEmailReminder } from "@/lib/email";

export async function scheduleReminders(params: {
  bookingId: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const supabase = createClient();
  const now = new Date();

  const reminders = [
    { type: "confirmation", scheduledAt: now },
    { type: "24h",          scheduledAt: subHours(params.startsAt, 24) },
    { type: "2h",           scheduledAt: subHours(params.startsAt, 2) },
    { type: "followup",     scheduledAt: addHours(params.endsAt, 2) },
  ].filter((r) => r.scheduledAt > now); // only future reminders

  // Cancel old pending reminders for this booking
  await supabase
    .from("reminders")
    .update({ status: "failed", error: "rescheduled" })
    .eq("booking_id", params.bookingId)
    .eq("status", "pending");

  if (reminders.length === 0) return;

  await supabase.from("reminders").insert(
    reminders.map((r) => ({
      booking_id:   params.bookingId,
      channel:      "whatsapp",
      type:         r.type,
      status:       "pending",
      scheduled_at: r.scheduledAt.toISOString(),
    })),
  );
}

export type ReminderRow = {
  id: string;
  type: string;
  channel: string;
  booking_id: string;
  bookings: {
    starts_at: string;
    ends_at: string;
    organization_id: string;
    clients: { name: string; phone: string; email: string | null } | null;
    services: { name: string; price: number } | null;
    staff: { name: string } | null;
    organizations: { name: string; address: string | null; timezone: string } | null;
  } | null;
};

/**
 * Process due reminders — called by cron every 15 minutes.
 * Returns number of processed reminders.
 */
export async function processReminders(): Promise<{ sent: number; failed: number }> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data: due } = await supabase
    .from("reminders")
    .select(`
      id, type, channel, booking_id,
      bookings (
        starts_at, ends_at, organization_id,
        clients  ( name, phone, email ),
        services ( name, price ),
        staff    ( name ),
        organizations ( name, address, timezone )
      )
    `)
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .order("scheduled_at")
    .limit(50);

  let sent = 0;
  let failed = 0;

  for (const reminder of due ?? []) {
    try {
      await dispatchReminder(reminder as unknown as ReminderRow);
      await supabase
        .from("reminders")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", reminder.id);
      sent++;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await supabase
        .from("reminders")
        .update({ status: "failed", error })
        .eq("id", reminder.id);
      console.error("[reminders] failed:", reminder.id, error);
      failed++;
    }
  }

  return { sent, failed };
}

async function dispatchReminder(reminder: ReminderRow) {
  const booking = reminder.bookings;
  if (!booking || !booking.clients) {
    throw new Error("Missing booking or client data");
  }

  const ctx = {
    clientName:   booking.clients.name,
    clientPhone:  booking.clients.phone,
    clientEmail:  booking.clients.email,
    serviceName:  booking.services?.name ?? "Turno",
    staffName:    booking.staff?.name ?? "",
    startsAt:     new Date(booking.starts_at),
    endsAt:       new Date(booking.ends_at),
    orgName:      booking.organizations?.name ?? "",
    orgAddress:   booking.organizations?.address ?? "",
    timezone:     booking.organizations?.timezone ?? "UTC",
    bookingId:    reminder.booking_id,
    reminderType: reminder.type,
  };

  // Send via the configured channel
  if (reminder.channel === "whatsapp") {
    await sendWhatsAppReminder(ctx);
  } else if (reminder.channel === "email" && ctx.clientEmail) {
    await sendEmailReminder(ctx);
  }
}
