import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import ServicesList from "./ServicesList";

export const metadata = { title: "Servicios — Reunio" };

export default async function ServicesPage() {
  const { organizationId } = await requireAuth();
  const supabase = createClient();

  const [{ data: services }, { data: categories }] = await Promise.all([
    supabase
      .from("services")
      .select("*, service_categories(id, name, color)")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("service_categories")
      .select("id, name, color")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">Servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {services?.length ?? 0} servicios configurados
          </p>
        </div>
      </div>
      {(categories ?? []).length === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-6 max-w-xl">
          ⚠️ No tenés categorías creadas. <Link href="/dashboard/categories" className="underline font-medium">Creá una categoría</Link> antes de agregar servicios.
        </p>
      )}
      <ServicesList
        services={services ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
