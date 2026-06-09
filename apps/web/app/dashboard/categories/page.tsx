import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import CategoriesList from "./CategoriesList";

export const metadata = { title: "Categorías — Reunio" };

export default async function CategoriesPage() {
  const { organizationId } = await requireAuth();
  const supabase = createClient();

  // Fetch categories with count of active services in each
  const { data: categories } = await supabase
    .from("service_categories")
    .select(`
      id,
      name,
      color,
      services(count)
    `)
    .eq("organization_id", organizationId)
    .order("sort_order")
    .order("name");

  const mapped = (categories ?? []).map((c) => ({
    id:            c.id as string,
    name:          c.name as string,
    color:         c.color as string,
    service_count: Array.isArray(c.services) ? (c.services[0] as { count: number } | undefined)?.count ?? 0 : 0,
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">Categorías de servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organizá tus servicios en grupos para que los clientes los encuentren más fácil.
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-6 bg-muted/40 border rounded-md px-3 py-2 max-w-xl">
        💡 Las categorías agrupan los servicios en tu página pública. Por ejemplo: <em>Cortes</em>, <em>Coloración</em>, <em>Tratamientos</em>. Creá las categorías acá y luego asignálas al crear o editar servicios.
      </p>
      <CategoriesList categories={mapped} />
    </div>
  );
}
