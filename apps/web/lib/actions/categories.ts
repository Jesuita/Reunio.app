"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

const CategorySchema = z.object({
  name:  z.string().min(1, "Ingresá un nombre").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366F1"),
});

export type CategoryFormState =
  | { success: true }
  | { success: false; error: string };

export async function createCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = CategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase.from("service_categories").insert({
    ...parsed.data,
    organization_id: auth.orgId,
  });

  if (error) {
    if (error.code === "23505") return { success: false, error: "Ya existe una categoría con ese nombre." };
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateCategory(
  id: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = CategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("service_categories")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", auth.orgId);

  if (error) {
    if (error.code === "23505") return { success: false, error: "Ya existe una categoría con ese nombre." };
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<CategoryFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createClient();

  // Check if any active services use this category
  const { count } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id)
    .eq("is_active", true);

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: `Esta categoría tiene ${count} servicio(s) activo(s). Reasignalos antes de eliminarla.`,
    };
  }

  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.orgId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/services");
  return { success: true };
}

/** Copia una categoría de plataforma al service_categories del negocio. */
export async function adoptPlatformCategory(platformCategoryId: string): Promise<CategoryFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createClient();

  // Fetch platform category
  const { data: pc, error: fetchErr } = await supabase
    .from("platform_categories")
    .select("name, color")
    .eq("id", platformCategoryId)
    .single();

  if (fetchErr || !pc) return { success: false, error: "Categoría de plataforma no encontrada." };

  // Check not already adopted (same name)
  const { count } = await supabase
    .from("service_categories")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", auth.orgId)
    .eq("name", pc.name);

  if ((count ?? 0) > 0) return { success: false, error: "Ya tenés una categoría con ese nombre." };

  const { error } = await supabase
    .from("service_categories")
    .insert({ organization_id: auth.orgId, name: pc.name, color: pc.color });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/categories");
  return { success: true };
}
