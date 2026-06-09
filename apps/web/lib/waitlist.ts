/**
 * Waitlist notification trigger.
 *
 * When a booking is cancelled, call notifyWaitlist() to find the first
 * waiting client for the same service/date and mark them as "notified".
 *
 * In Fase 4 this will send a WhatsApp message. For now it just updates
 * the status so the admin can see who to contact.
 */

import { createClient } from "@/lib/supabase/server";

export async function notifyWaitlist(params: {
  organizationId: string;
  serviceId: string;
  date: string; // "YYYY-MM-DD"
}) {
  const supabase = createClient();

  // Get oldest waiting entry for this service/date
  const { data: entry } = await supabase
    .from("waitlist")
    .select("id, client_id")
    .eq("organization_id", params.organizationId)
    .eq("service_id", params.serviceId)
    .eq("preferred_date", params.date)
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!entry) return null; // no one waiting

  // Mark as notified
  await supabase
    .from("waitlist")
    .update({ status: "notified", notified_at: new Date().toISOString() })
    .eq("id", entry.id);

  // Get client info for logging / future WhatsApp hook
  const { data: client } = await supabase
    .from("clients")
    .select("name, phone")
    .eq("id", entry.client_id)
    .single();

  return client;
}
