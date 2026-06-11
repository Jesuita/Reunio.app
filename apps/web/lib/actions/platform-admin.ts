"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

/** Elimina permanentemente un negocio y todos sus datos. Irreversible. */
export async function deleteOrg(orgId: string): Promise<AdminActionResult> {
  try {
    const admin = await assertPlatformAdmin();
    const { error } = await admin
      .from("organizations")
      .delete()
      .eq("id", orgId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/organizations");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ── Platform categories ───────────────────────────────────────────────────────

export type PlatformCategoryFormState =
  | { success: true }
  | { success: false; error: string };

export async function createPlatformCategory(
  _prev: PlatformCategoryFormState,
  formData: FormData,
): Promise<PlatformCategoryFormState> {
  try {
    const admin = await assertPlatformAdmin();
    const name  = formData.get("name") as string;
    const color = (formData.get("color") as string) || "#6366F1";
    if (!name?.trim()) return { success: false, error: "El nombre es obligatorio." };
    const { error } = await admin.from("platform_categories").insert({ name: name.trim(), color });
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updatePlatformCategory(
  id: string,
  _prev: PlatformCategoryFormState,
  formData: FormData,
): Promise<PlatformCategoryFormState> {
  try {
    const admin = await assertPlatformAdmin();
    const name  = formData.get("name") as string;
    const color = formData.get("color") as string;
    if (!name?.trim()) return { success: false, error: "El nombre es obligatorio." };
    const { error } = await admin.from("platform_categories").update({ name: name.trim(), color }).eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deletePlatformCategory(id: string): Promise<AdminActionResult> {
  try {
    const admin = await assertPlatformAdmin();
    const { error } = await admin.from("platform_categories").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
