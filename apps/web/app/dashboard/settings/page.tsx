import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

const ORG_ID = "00000000-0000-0000-0000-000000000010";

export default async function SettingsPage() {
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
