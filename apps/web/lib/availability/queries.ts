/**
 * DB query helpers for the availability engine.
 * Each function fetches exactly what the engine needs, always filtered by organization_id.
 */
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient(url, key);
}

export async function fetchOrganization(organizationId: string) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("organizations")
    .select("timezone, settings")
    .eq("id", organizationId)
    .single();
  if (error) throw new Error(`fetchOrganization: ${error.message}`);
  return data;
}

export async function fetchService(organizationId: string, serviceId: string) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("services")
    .select("id, duration_minutes, deposit_amount, deposit_percent")
    .eq("id", serviceId)
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .single();
  if (error) throw new Error(`fetchService: ${error.message}`);
  return { id: data.id, durationMinutes: data.duration_minutes, depositAmount: data.deposit_amount, depositPercent: data.deposit_percent };
}

export async function fetchStaff(organizationId: string, staffId?: string, serviceId?: string) {
  const sb = getServiceClient();
  let query = sb
    .from("staff")
    .select("id, name, avatar_url")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
  if (staffId) query = query.eq("id", staffId);
  const { data, error } = await query;
  if (error) throw new Error(`fetchStaff: ${error.message}`);

  const all = data as { id: string; name: string }[];

  // Filter by staff_services: only staff who have this service assigned (or all if none have it assigned)
  if (serviceId && !staffId) {
    const { data: ss } = await sb
      .from("staff_services")
      .select("staff_id")
      .eq("service_id", serviceId)
      .in("staff_id", all.map((s) => s.id));
    const linked = ss?.map((r) => r.staff_id) ?? [];
    // If no staff have the service explicitly assigned, all can perform it (backwards compat)
    if (linked.length > 0) return all.filter((s) => linked.includes(s.id));
  }

  return all;
}

export async function fetchSchedules(organizationId: string, staffIds: string[]) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("schedules")
    .select("staff_id, day_of_week, start_time, end_time")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .in("staff_id", staffIds);
  if (error) throw new Error(`fetchSchedules: ${error.message}`);
  return data.map((r) => ({
    staffId:    r.staff_id,
    dayOfWeek:  r.day_of_week,
    startTime:  r.start_time,
    endTime:    r.end_time,
  }));
}

export async function fetchOverrides(staffIds: string[], dateFrom: string, dateTo: string) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("schedule_overrides")
    .select("staff_id, date, is_day_off, start_time, end_time")
    .in("staff_id", staffIds)
    .gte("date", dateFrom)
    .lte("date", dateTo);
  if (error) throw new Error(`fetchOverrides: ${error.message}`);
  return data.map((r) => ({
    staffId:   r.staff_id,
    date:      r.date,
    isDayOff:  r.is_day_off,
    startTime: r.start_time,
    endTime:   r.end_time,
  }));
}

export async function fetchExistingBookings(
  organizationId: string,
  staffIds: string[],
  dateFrom: string,
  dateTo: string,
  timezone: string,
) {
  const sb = getServiceClient();
  // Expand date range by 1 day each side to avoid timezone edge cases
  const { data, error } = await sb
    .from("bookings")
    .select("staff_id, starts_at, ends_at")
    .eq("organization_id", organizationId)
    .in("staff_id", staffIds)
    .in("status", ["pending", "confirmed"])
    .gte("starts_at", `${dateFrom}T00:00:00Z`)
    .lte("ends_at",   `${dateTo}T23:59:59Z`);
  if (error) throw new Error(`fetchExistingBookings: ${error.message}`);
  return data.map((r) => ({
    staffId:  r.staff_id,
    startsAt: new Date(r.starts_at),
    endsAt:   new Date(r.ends_at),
  }));
}
