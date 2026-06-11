import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import GeneralForm from "./general/GeneralForm";

export const metadata = { title: "Configuración — Reunio" };

export default async function SettingsPage() {
  const { organizationId } = await requireAuth();
  const supabase = createClient();
  const { data: org } = await supabase.from("organizations").select("*").eq("id", organizationId).single();
  return <GeneralForm org={org} />;
}
