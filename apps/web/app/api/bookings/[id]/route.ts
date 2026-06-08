import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );
}

// ── GET /api/bookings/[id] ────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("bookings")
    .select(`
      id, status, payment_status, starts_at, ends_at, notes, source, created_at,
      services(id, name, duration_minutes, price),
      staff(id, name, avatar_url),
      clients(id, name, phone, email),
      branches(id, name, address)
    `)
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ booking: data });
}

// ── PATCH /api/bookings/[id] ──────────────────────────────────────────────────
const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("reschedule"), startsAt: z.string().datetime() }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sb = getServiceClient();

  // Fetch current booking
  const { data: existing, error: fetchError } = await sb
    .from("bookings")
    .select("id, organization_id, staff_id, service_id, starts_at, ends_at, status")
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (existing.status === "cancelled" || existing.status === "completed") {
    return NextResponse.json(
      { error: `Cannot modify a booking with status '${existing.status}'.` },
      { status: 422 }
    );
  }

  if (parsed.data.action === "cancel") {
    const { data, error } = await sb
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
    }

    return NextResponse.json({ booking: data });
  }

  // action === "reschedule"
  const { startsAt: startsAtStr } = parsed.data;
  const startsAt = new Date(startsAtStr);

  const { data: serviceData } = await sb
    .from("services")
    .select("duration_minutes")
    .eq("id", existing.service_id)
    .single();

  const durationMinutes = serviceData?.duration_minutes ?? 60;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);

  // Check for conflicts (exclude this booking itself)
  const { count } = await sb
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("staff_id", existing.staff_id)
    .neq("id", params.id)
    .in("status", ["pending", "confirmed"])
    .lte("starts_at", endsAt.toISOString())
    .gte("ends_at",   startsAt.toISOString());

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "El nuevo horario no está disponible." },
      { status: 409 }
    );
  }

  const { data, error } = await sb
    .from("bookings")
    .update({
      starts_at: startsAt.toISOString(),
      ends_at:   endsAt.toISOString(),
      status:    "confirmed",
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to reschedule booking" }, { status: 500 });
  }

  return NextResponse.json({ booking: data });
}
