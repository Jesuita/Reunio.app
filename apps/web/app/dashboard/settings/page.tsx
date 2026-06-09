import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import SettingsForm from "./SettingsForm";


export default async function SettingsPage() {
  const { organizationId: ORG_ID } = await requireAuth();
  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", ORG_ID)
    .single();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Información del negocio y preferencias de reserva.</p>
      </div>
      <SettingsForm org={org} />
    </div>
  );
}
