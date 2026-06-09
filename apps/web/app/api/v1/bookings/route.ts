/**
 * GET /api/v1/bookings  — list bookings (paginated)
 * POST /api/v1/bookings — create a booking
 */
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateBookingSchema = z.object({
  service_id: z.string().uuid(),
  staff_id:   z.string().uuid(),
  starts_at:  z.string().datetime(),
  client: z.object({
    name:  z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = req.nextUrl;
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit    = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const status   = searchParams.get("status");
  const dateFrom = searchParams.get("date_from");
  const dateTo   = searchParams.get("date_to");

  const supabase = createClient();
  let query = supabase
    .from("bookings")
    .select(
      `id, status, starts_at, ends_at, notes, created_at,
       services(id, name, duration_minutes),
       staff(id, name),
       clients(id, name, email, phone)`,
      { count: "exact" }
    )
    .eq("organization_id", auth.organizationId)
    .order("starts_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("starts_at", dateFrom);
  if (dateTo) query = query.lte("starts_at", dateTo);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, limit, pages: Math.ceil((count ?? 0) / limit) },
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = CreateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { service_id, staff_id, starts_at, client: clientData, notes } = parsed.data;
  const supabase = createClient();

  // Verify service + staff belong to org
  const [{ data: service }, { data: staff }] = await Promise.all([
    supabase.from("services").select("id, duration_minutes").eq("id", service_id).eq("organization_id", auth.organizationId).single(),
    supabase.from("staff").select("id").eq("id", staff_id).eq("organization_id", auth.organizationId).single(),
  ]);

  if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  if (!staff)   return NextResponse.json({ error: "Staff not found." }, { status: 404 });

  const endsAt = new Date(new Date(starts_at).getTime() + (service.duration_minutes as number) * 60000).toISOString();

  // Find or create client
  let clientId: string;
  if (clientData.phone) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("organization_id", auth.organizationId)
      .eq("phone", clientData.phone)
      .single();

    if (existing) {
      clientId = existing.id as string;
    } else {
      const { data: created } = await supabase
        .from("clients")
        .insert({ organization_id: auth.organizationId, ...clientData })
        .select("id")
        .single();
      clientId = (created as { id: string }).id;
    }
  } else {
    const { data: created } = await supabase
      .from("clients")
      .insert({ organization_id: auth.organizationId, ...clientData })
      .select("id")
      .single();
    clientId = (created as { id: string }).id;
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      organization_id: auth.organizationId,
      service_id,
      staff_id,
      client_id: clientId,
      starts_at,
      ends_at:   endsAt,
      status:    "confirmed",
      source:    "api",
      notes:     notes ?? null,
    })
    .select("id, status, starts_at, ends_at")
    .single();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  return NextResponse.json({ data: booking }, { status: 201 });
}
