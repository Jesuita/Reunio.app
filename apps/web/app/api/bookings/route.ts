import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { computeAvailableSlots } from "@/lib/availability/engine";
import { signBookingToken, buildManageUrl } from "@/lib/booking-token";
import {
  fetchOrganization,
  fetchService,
  fetchStaff,
  fetchSchedules,
  fetchOverrides,
  fetchExistingBookings,
} from "@/lib/availability/queries";
import { format } from "date-fns";

const bodySchema = z.object({
  organizationId: z.string().uuid(),
  serviceId:      z.string().uuid(),
  staffId:        z.string().uuid(),
  startsAt:       z.string().datetime(),
  client: z.object({
    name:  z.string().min(1),
    phone: z.string().min(6),
    email: z.string().email().optional(),
  }),
  notes: z.string().optional(),
});

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { organizationId, serviceId, staffId, startsAt: startsAtStr, client, notes } = parsed.data;
  const startsAt = new Date(startsAtStr);
  const sb = getServiceClient();

  try {
    const [organization, service] = await Promise.all([
      fetchOrganization(organizationId),
      fetchService(organizationId, serviceId),
    ]);

    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    const dateStr = format(startsAt, "yyyy-MM-dd");

    // ── 1. Race-condition check: verify slot is still available ──────────
    const [staffList, schedules, overrides, existingBookings] = await Promise.all([
      fetchStaff(organizationId, staffId),
      fetchSchedules(organizationId, [staffId]),
      fetchOverrides([staffId], dateStr, dateStr),
      fetchExistingBookings(organizationId, [staffId], dateStr, dateStr, organization.timezone),
    ]);

    const slots = computeAvailableSlots({
      params:      { organizationId, serviceId, staffId, dateFrom: dateStr, dateTo: dateStr },
      organization,
      service,
      staffList,
      schedules,
      overrides,
      existingBookings,
    });

    const requestedSlot = slots.find(
      (s) => s.available && s.startsAt.getTime() === startsAt.getTime()
    );

    if (!requestedSlot) {
      return NextResponse.json(
        { error: "El turno solicitado ya no está disponible." },
        { status: 409 }
      );
    }

    // ── 2. Find-or-create client by phone ────────────────────────────────
    let clientId: string;
    {
      const { data: existing } = await sb
        .from("clients")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("phone", client.phone)
        .maybeSingle();

      if (existing) {
        clientId = existing.id;
      } else {
        const { data: created, error } = await sb
          .from("clients")
          .insert({
            organization_id: organizationId,
            name:  client.name,
            phone: client.phone,
            email: client.email ?? null,
          })
          .select("id")
          .single();
        if (error) throw new Error(`create client: ${error.message}`);
        clientId = created.id;
      }
    }

    // ── 3. Determine booking status ───────────────────────────────────────
    const requiresDeposit = service.depositAmount != null || service.depositPercent != null;
    const bookingStatus   = requiresDeposit ? "pending" : "confirmed";
    const paymentStatus   = "unpaid";

    // ── 4. Insert booking ─────────────────────────────────────────────────
    const { data: booking, error: bookingError } = await sb
      .from("bookings")
      .insert({
        organization_id: organizationId,
        staff_id:        staffId,
        service_id:      serviceId,
        client_id:       clientId,
        starts_at:       startsAt.toISOString(),
        ends_at:         endsAt.toISOString(),
        status:          bookingStatus,
        payment_status:  paymentStatus,
        notes:           notes ?? null,
        source:          "web",
      })
      .select()
      .single();

    if (bookingError) throw new Error(`create booking: ${bookingError.message}`);

    // ── 5. Enqueue reminders ───────────────────────────────────────────────
    await sb.from("reminders").insert([
      { booking_id: booking.id, channel: "whatsapp", type: "confirmation", status: "pending" },
      { booking_id: booking.id, channel: "whatsapp", type: "24h",          status: "pending" },
      { booking_id: booking.id, channel: "whatsapp", type: "2h",           status: "pending" },
    ]);

    // ── 6. Generate self-service management token ─────────────────────────
    const manageToken = await signBookingToken(booking.id, organizationId);
    const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";
    const manageUrl = buildManageUrl(baseUrl, manageToken);

    // ── 7. TODO: Mercado Pago payment URL if deposit required ─────────────
    // Will be implemented in Fase 4 (Pagos y WhatsApp)
    const paymentUrl: string | null = null;

    return NextResponse.json({ booking, paymentUrl, manageUrl }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
