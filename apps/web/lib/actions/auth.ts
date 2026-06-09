"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const LoginSchema = z.object({
  email:    z.string().email("Email inválido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
  next:     z.string().optional(),
});

export type AuthActionResult = { error: string } | { success: true };

export async function loginAction(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = LoginSchema.safeParse({
    email:    formData.get("email"),
    password: formData.get("password"),
    next:     formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Datos inválidos." };
  }

  const { email, password, next } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("invalid login credentials")) {
      return { error: "Email o contraseña incorrectos." };
    }
    return { error: "Error al iniciar sesión. Intentá de nuevo." };
  }

  revalidatePath("/dashboard", "layout");
  redirect(next ?? "/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const RegisterSchema = z.object({
  email:            z.string().email(),
  password:         z.string().min(8, "Mínimo 8 caracteres."),
  confirmPassword:  z.string(),
  businessName:     z.string().min(2),
  businessSlug:     z.string().min(2).max(60),
  businessPhone:    z.string().optional(),
  businessTimezone: z.string(),
  serviceName:      z.string().min(2),
  serviceDuration:  z.coerce.number().int().min(5),
  servicePrice:     z.coerce.number().optional(),
  availableDays:    z.array(z.number().int().min(0).max(6)).min(1),
  openTime:         z.string().regex(/^\d{2}:\d{2}$/),
  closeTime:        z.string().regex(/^\d{2}:\d{2}$/),
  plan:             z.enum(["free", "pro", "business"]).default("free"),
});

export type RegisterActionResult = { error: string; field?: string } | { success: true; orgSlug: string };

export async function registerAction(data: unknown): Promise<RegisterActionResult> {
  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { error: firstError?.message ?? "Datos inválidos.", field: String(firstError?.path?.[0] ?? "") };
  }

  const d = parsed.data;
  if (d.password !== d.confirmPassword) {
    return { error: "Las contraseñas no coinciden.", field: "confirmPassword" };
  }

  const admin = createAdminClient();

  // 1. Check slug uniqueness
  const { data: existing } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", d.businessSlug)
    .single();

  if (existing) {
    return { error: "Ese identificador ya está en uso. Elegí otro.", field: "businessSlug" };
  }

  // 2. Create Supabase Auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email:    d.email,
    password: d.password,
    email_confirm: true, // Auto-confirm for now; enable email verification in prod
  });

  if (authError || !authData.user) {
    if (authError?.message?.includes("already registered")) {
      return { error: "Ese email ya está registrado. ¿Querés iniciar sesión?", field: "email" };
    }
    console.error("[register] auth error:", authError);
    return { error: "Error al crear la cuenta. Intentá de nuevo." };
  }

  const userId = authData.user.id;

  // 3. Get free plan id
  const { data: freePlan } = await admin.from("plans").select("id").eq("name", "free").single();
  if (!freePlan) return { error: "Error interno: plan no encontrado." };

  // 4. Create organization
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name:     d.businessName,
      slug:     d.businessSlug,
      timezone: d.businessTimezone,
      phone:    d.businessPhone ?? null,
      plan_id:  freePlan.id,
      settings: { onboarding_completed: false, owner_user_id: userId },
    })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("[register] org error:", orgError);
    // Cleanup auth user
    await admin.auth.admin.deleteUser(userId);
    return { error: "Error al crear el negocio." };
  }

  const orgId = org.id as string;

  // 5. Link user to org as owner
  await admin.from("organization_members").insert({
    organization_id: orgId,
    user_id:         userId,
    role:            "owner",
  });

  // 6. Create default staff (the owner)
  const { data: staff } = await admin
    .from("staff")
    .insert({ organization_id: orgId, name: d.businessName, email: d.email, color: "#6366f1", is_active: true })
    .select("id")
    .single();

  const staffId = (staff as { id: string } | null)?.id;

  // 7. Create first service
  await admin.from("services").insert({
    organization_id:  orgId,
    name:             d.serviceName,
    duration_minutes: d.serviceDuration,
    price:            d.servicePrice ? String(d.servicePrice) : "0",
    currency:         "ARS",
    is_active:        true,
  });

  // 8. Create schedules
  if (staffId) {
    await admin.from("staff_schedules").insert(
      d.availableDays.map((day) => ({
        staff_id:    staffId,
        day_of_week: day,
        start_time:  d.openTime + ":00",
        end_time:    d.closeTime + ":00",
        is_active:   true,
      }))
    );
  }

  // 9. Sign in the new user immediately
  const supabase = createClient();
  await supabase.auth.signInWithPassword({ email: d.email, password: d.password });

  return { success: true, orgSlug: d.businessSlug };
}
