import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import CategoriesList from "./CategoriesList";
import DbDown from "@/components/DbDown";

export const metadata = { title: "Categorías — Reunio" };

export default async function CategoriesPage() {
  try {
    const { organizationId } = await requireAuth();
    const supabase = createClient();

    const [{ data: categories }, { data: platformCategories }] = await Promise.all([
      supabase
        .from("service_categories")
        .select("id, name, color, services(count)")
        .eq("organization_id", organizationId)
        .order("sort_order")
        .order("name"),
      supabase
        .from("platform_categories")
        .select("id, name, color")
        .order("sort_order")
        .order("name"),
    ]);

    const mapped = (categories ?? []).map((c) => ({
      id:            c.id as string,
      name:          c.name as string,
      color:         c.color as string,
      service_count: Array.isArray(c.services)
        ? (c.services[0] as { count: number } | undefined)?.count ?? 0
        : 0,
    }));

    // Filter out platform categories already adopted (same name)
    const orgNames = new Set(mapped.map((c) => c.name.toLowerCase()));
    const suggestions = (platformCategories ?? []).filter(
      (pc) => !orgNames.has(pc.name.toLowerCase()),
    );

    return (
      <div className="p-8">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">Categorías de servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organizá tus servicios en grupos para que los clientes los encuentren más fácil.
          </p>
        </div>
        <p className="text-xs text-muted-foreground mb-6 bg-muted/40 border rounded-md px-3 py-2 max-w-xl">
          💡 Las categorías agrupan los servicios en tu página pública. Creálas acá y luego asignálas al crear o editar servicios.
        </p>
        <CategoriesList categories={mapped} suggestions={suggestions} />
      </div>
    );
  } catch (err) {
    return <DbDown context="categories" errorMessage={String(err)} />;
  }
}
