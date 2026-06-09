import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

export const metadata = { title: "Configuración — Reunio" };

export default async function SettingsPage() {
  const { organizationId } = await requireAuth();
  const supabase = createClient();

  const [{ data: org }, { data: businessHours }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", organizationId).single(),
    supabase
      .from("business_hours")
      .select("day_of_week, start_time, end_time")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("day_of_week")
      .order("start_time"),
  ]);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Información del negocio, horario de apertura y preferencias de reserva.
        </p>
      </div>
      <SettingsForm
        org={org}
        businessHours={(businessHours ?? []) as { day_of_week: number; start_time: string; end_time: string }[]}
      />
    </div>
  );
}
