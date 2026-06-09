import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Verifica si el usuario autenticado es platform admin.
 * Redirige a /login si no está autenticado, a /dashboard si no es admin.
 * Usar en layouts y pages de /admin/*.
 */
export async function requirePlatformAdmin(): Promise<{ userId: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  // Verificamos contra la tabla platform_admins usando service role (sin RLS)
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    // Usuario autenticado pero no es platform admin → volver a su dashboard
    redirect("/dashboard");
  }

  return { userId: user.id };
}

/**
 * Retorna true si el usuario es platform admin (sin redirigir).
 * Útil para mostrar/ocultar UI condicionalmente.
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  return !!data;
}
