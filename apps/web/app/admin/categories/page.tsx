import { createAdminClient } from "@/lib/supabase/server";
import AdminCategoriesList from "./AdminCategoriesList";

export const metadata = { title: "Categorías de plataforma — Admin" };

export default async function AdminCategoriesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_categories")
    .select("id, name, color, sort_order")
    .order("sort_order")
    .order("name");

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Categorías de plataforma</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Estas categorías aparecen como sugerencias en el panel de cada negocio. Los negocios pueden adoptarlas o crear las propias.
        </p>
      </div>
      <AdminCategoriesList categories={data ?? []} />
    </div>
  );
}
