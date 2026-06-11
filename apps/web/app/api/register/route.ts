import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const RegisterSchema = z.object({
  // Account
  email:            z.string().email(),
  password:         z.string().min(8),
  confirmPassword:  z.string(),
  // Business
  businessName:     z.string().min(2),
  businessSlug:     z.string().min(2).max(60),
  businessPhone:    z.string().optional(),
  businessTimezone: z.string(),
  // Service
  serviceName:      z.string().min(2),
  serviceDuration:  z.coerce.number().int().min(5),
  servicePrice:     z.coerce.number().optional(),
  // Availability
  availableDays:    z.array(z.number().int().min(0).max(6)).min(1),
  openTime:         z.string().regex(/^\d{2}:\d{2}$/),
  closeTime:        z.string().regex(/^\d{2}:\d{2}$/),
  // Plan
  plan:             z.enum(["free", "pro", "business"]).default("free"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const data = parsed.data;
  if (data.password !== data.confirmPassword) {
    return NextResponse.json({ error: "Las contraseñas no coinciden." }, { status: 422 });
  }

  const supabase = createClient();

  // 1. Check slug uniqueness
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", data.businessSlug)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Ese identificador de negocio ya está en uso. Elegí otro." },
      { status: 409 },
    );
  }

  // 2. Get free plan id
  const { data: freePlan } = await supabase
    .from("plans")
    .select("id")
    .eq("name", "free")
    .single();

  if (!freePlan) {
    return NextResponse.json({ error: "Error interno: plan no encontrado." }, { status: 500 });
  }

  // 3. Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name:      data.businessName,
      slug:      data.businessSlug,
      timezone:  data.businessTimezone,
      phone:     data.businessPhone ?? null,
      plan_id:   freePlan.id,
      is_listed: true,
      is_active: true,
      settings: {
        onboarding_completed: false,
        registered_email: data.email,
      },
    })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("[register] org insert error:", orgError);
    return NextResponse.json({ error: "Error al crear el negocio." }, { status: 500 });
  }

  const orgId = org.id as string;

  // 4. Create a default staff member (owner)
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .insert({
      organization_id: orgId,
      name:            data.businessName, // Use business name as default owner name
      email:           data.email,
      color:           "#6366f1",
      is_active:       true,
    })
    .select("id")
    .single();

  if (staffError || !staff) {
    console.error("[register] staff insert error:", staffError);
    // Non-fatal — org was created, user can add staff later
  }

  const staffId = (staff as { id: string } | null)?.id;

  // 5. Create first service
  const { error: serviceError } = await supabase
    .from("services")
    .insert({
      organization_id: orgId,
      name:            data.serviceName,
      duration_minutes: data.serviceDuration,
      price:           data.servicePrice ? String(data.servicePrice) : "0",
      currency:        "ARS",
      is_active:       true,
    });

  if (serviceError) {
    console.error("[register] service insert error:", serviceError);
  }

  // 6. Create default schedules for the staff member
  if (staffId) {
    const schedules = data.availableDays.map((day) => ({
      staff_id:        staffId,
      day_of_week:     day,
      start_time:      data.openTime + ":00",
      end_time:        data.closeTime + ":00",
      is_active:       true,
    }));

    const { error: schedError } = await supabase.from("schedules").insert(schedules);
    if (schedError) console.error("[register] schedule insert error:", schedError);
  }

  // 7. Seed business_hours with the same availability chosen in the wizard
  const businessHours = data.availableDays.map((day) => ({
    organization_id: orgId,
    day_of_week:     day,
    start_time:      data.openTime + ":00",
    end_time:        data.closeTime + ":00",
    is_active:       true,
  }));

  const { error: bhError } = await supabase.from("business_hours").insert(businessHours);
  if (bhError) console.error("[register] business_hours insert error:", bhError);

  // TODO: In a real app, create Supabase Auth user here:
  // const { error: authError } = await supabase.auth.admin.createUser({ email, password })
  // For now we return success and redirect to demo dashboard

  return NextResponse.json({
    success: true,
    orgId,
    orgSlug: data.businessSlug,
    message: "Cuenta creada exitosamente.",
  });
}
