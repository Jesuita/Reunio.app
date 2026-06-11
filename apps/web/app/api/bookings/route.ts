import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { computeAvailableSlots } from "@/lib/availability/engine";
import { signBookingToken, buildManageUrl } from "@/lib/booking-token";
import { createDepositPreference } from "@/lib/mercadopago";
import { scheduleReminders } from "@/lib/reminders";
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
  const rl = rateLimit(getClientIp(req), { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Esperá un momento e intentá de nuevo." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

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

    if (bookingError) {
      if (bookingError.code === "23505") {
        return NextResponse.json(
          { error: "Ese turno acaba de ser tomado por otro cliente. Por favor elegí otro horario." },
          { status: 409 },
        );
      }
      throw new Error(`create booking: ${bookingError.message}`);
    }

    // ── 5. Schedule reminders (only for confirmed bookings; pending wait for payment) ──
    if (bookingStatus === "confirmed") {
      await scheduleReminders({
        bookingId: booking.id,
        startsAt:  startsAt,
        endsAt:    endsAt,
      });
    }

    // ── 6. Generate self-service management token ─────────────────────────
    const manageToken = await signBookingToken(booking.id, organizationId);
    const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";
    const manageUrl = buildManageUrl(baseUrl, manageToken);

    // ── 7. Mercado Pago payment URL if deposit required ───────────────────
    let paymentUrl: string | null = null;
    if (requiresDeposit) {
      try {
        // Fetch additional service fields for MP preference
        const sb2 = createClient(process.env["NEXT_PUBLIC_SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!);
        const { data: svcFull } = await sb2.from("services").select("name, price").eq("id", serviceId).single();
        const depositAmount = service.depositAmount ?? Math.round(Number(svcFull?.price ?? 0) * (service.depositPercent ?? 0) / 100);
        const { initPoint } = await createDepositPreference({
          bookingId:        booking.id,
          serviceTitle:     svcFull?.name ?? "Servicio",
          depositAmount,
          clientEmail:      client.email,
          backUrlBase:      baseUrl,
          expiresInMinutes: 30,
        });
        paymentUrl = initPoint;
      } catch (err) {
        console.error("[bookings] MP preference error:", err);
        // Non-fatal: booking was created, client can pay later
      }
    }

    return NextResponse.json({ booking, paymentUrl, manageUrl }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
