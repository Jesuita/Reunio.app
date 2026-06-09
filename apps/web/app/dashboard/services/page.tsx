import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import ServicesList from "./ServicesList";


export default async function ServicesPage() {
  const { organizationId: ORG_ID } = await requireAuth();
  const supabase = createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("organization_id", ORG_ID)
    .order("category")
    .order("name");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {services?.length ?? 0} servicios configurados
          </p>
        </div>
      </div>
      <ServicesList services={services ?? []} />
    </div>
  );
}
