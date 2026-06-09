import { createClient } from "@/lib/supabase/server";
import ServicesList from "./ServicesList";

const ORG_ID = "00000000-0000-0000-0000-000000000010";

export default async function ServicesPage() {
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
