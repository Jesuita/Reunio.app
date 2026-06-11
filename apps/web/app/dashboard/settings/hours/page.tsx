import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import HoursClient from "./HoursClient";

export const metadata = { title: "Horario — Configuración" };

export default async function SettingsHoursPage() {
  const { organizationId } = await requireAuth();
  const supabase = createClient();
  const { data: businessHours } = await supabase
    .from("business_hours")
    .select("day_of_week, start_time, end_time")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("day_of_week")
    .order("start_time");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold mb-0.5">Horario de atención</h2>
        <p className="text-sm text-muted-foreground">
          Los días y horarios en que está abierto tu negocio. Se muestra en tu página pública.
        </p>
        <p className="text-xs text-muted-foreground mt-2 bg-muted/40 border rounded-lg px-3 py-2">
          💡 Este es el horario general del negocio. Para editar el horario de cada profesional, andá a{" "}
          <strong>Personal</strong>.
        </p>
      </div>
      <HoursClient initialRows={(businessHours ?? []) as { day_of_week: number; start_time: string; end_time: string }[]} />
    </div>
  );
}
