"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";

async function assertPlatformAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();
  if (!data) throw new Error("Forbidden");

  return admin;
}

export type AdminActionResult = { success: true } | { success: false; error: string };

/** Activa o desactiva un negocio. Los negocios inactivos no pueden recibir reservas. */
export async function setOrgActive(
  orgId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  try {
    const admin = await assertPlatformAdmin();
    const { error } = await admin
      .from("organizations")
      .update({ is_active: isActive })
      .eq("id", orgId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Muestra u oculta un negocio del directorio público. */
export async function setOrgListed(
  orgId: string,
  isListed: boolean,
): Promise<AdminActionResult> {
  try {
    const admin = await assertPlatformAdmin();
    const { error } = await admin
      .from("organizations")
      .update({ is_listed: isListed })
      .eq("id", orgId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
