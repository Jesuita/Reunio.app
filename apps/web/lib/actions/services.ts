"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Inline helper — avoids importing lib/auth.ts (server-only) from this "use server" file */
async function getOrgId(): Promise<{ orgId: string } | { error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();
  if (!member) return { error: "No organization found" };
  return { orgId: member.organization_id as string };
}

const ServiceSchema = z.object({
  name:             z.string().min(1).max(100),
  description:      z.string().max(500).optional(),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  price:            z.coerce.number().min(0),
  deposit_amount:   z.coerce.number().min(0).optional().nullable(),
  color:            z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  category:         z.string().min(1).max(50),
  category_id:      z.string().uuid().optional().nullable(),
  is_active:        z.boolean().default(true),
});

export type ServiceFormState =
  | { success: true }
  | { success: false; error: string };

export async function createService(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const raw = Object.fromEntries(formData);
  const parsed = ServiceSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "true",
    deposit_amount: raw.deposit_amount === "" ? null : raw.deposit_amount,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .insert({ ...parsed.data, organization_id: auth.orgId });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateService(
  id: string,
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const raw = Object.fromEntries(formData);
  const parsed = ServiceSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "true",
    deposit_amount: raw.deposit_amount === "" ? null : raw.deposit_amount,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", auth.orgId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteService(id: string): Promise<ServiceFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", auth.orgId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}
