"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );
}

const PlanSchema = z.object({
  name:                   z.string().min(1).regex(/^[a-z0-9_]+$/),
  label:                  z.string().min(1),
  price_ars:              z.coerce.number().int().min(0),
  price_usd:              z.coerce.number().int().min(0),
  stripe_price_id:        z.string().optional().nullable(),
  highlight:              z.string().optional().nullable(),
  is_active:              z.boolean().default(true),
  sort_order:             z.coerce.number().int().min(0),
  max_staff:              z.coerce.number().int().positive().optional().nullable(),
  max_bookings_per_month: z.coerce.number().int().positive().optional().nullable(),
  max_services:           z.coerce.number().int().positive().optional().nullable(),
  whatsapp_reminders:     z.boolean().default(false),
  online_payments:        z.boolean().default(false),
  multi_location:         z.boolean().default(false),
  api_access:             z.boolean().default(false),
  custom_branding:        z.boolean().default(false),
  reports:                z.enum(["basic", "full"]).default("basic"),
});

export async function savePlanAction(id: string | null, formData: FormData) {
  const raw = {
    name:                   formData.get("name"),
    label:                  formData.get("label"),
    price_ars:              formData.get("price_ars"),
    price_usd:              formData.get("price_usd"),
    stripe_price_id:        formData.get("stripe_price_id") || null,
    highlight:              formData.get("highlight") || null,
    is_active:              formData.get("is_active") === "true",
    sort_order:             formData.get("sort_order"),
    max_staff:              formData.get("max_staff") ? formData.get("max_staff") : null,
    max_bookings_per_month: formData.get("max_bookings_per_month") ? formData.get("max_bookings_per_month") : null,
    max_services:           formData.get("max_services") ? formData.get("max_services") : null,
    whatsapp_reminders:     formData.get("whatsapp_reminders") === "true",
    online_payments:        formData.get("online_payments") === "true",
    multi_location:         formData.get("multi_location") === "true",
    api_access:             formData.get("api_access") === "true",
    custom_branding:        formData.get("custom_branding") === "true",
    reports:                formData.get("reports"),
  };

  const parsed = PlanSchema.safeParse(raw);
  if (!parsed.success) return { error: "Datos inválidos: " + parsed.error.issues[0]?.message };

  const sb = getClient();

  if (id) {
    const { error } = await sb.from("plans").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await sb.from("plans").insert(parsed.data);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/plans");
  return { ok: true };
}

export async function togglePlanAction(id: string, isActive: boolean) {
  const sb = getClient();
  const { error } = await sb.from("plans").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/plans");
  return { ok: true };
}
