"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Demo org — in production comes from session
const ORG_ID = "00000000-0000-0000-0000-000000000010";

const ServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0),
  deposit_amount: z.coerce.number().min(0).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  category: z.string().min(1).max(50),
  is_active: z.boolean().default(true),
});

export type ServiceFormState =
  | { success: true }
  | { success: false; error: string };

export async function createService(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
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
    .insert({ ...parsed.data, organization_id: ORG_ID });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateService(
  id: string,
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
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
    .eq("organization_id", ORG_ID);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteService(id: string): Promise<ServiceFormState> {
  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", ORG_ID);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}
