import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import GeneralForm from "./GeneralForm";

export const metadata = { title: "General — Configuración" };

export default async function SettingsGeneralPage() {
  const { organizationId } = await requireAuth();
  const supabase = createClient();
  const { data: org } = await supabase.from("organizations").select("*").eq("id", organizationId).single();
  return <GeneralForm org={org} />;
}
