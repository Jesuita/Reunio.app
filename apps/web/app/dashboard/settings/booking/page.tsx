import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import BookingForm from "./BookingForm";

export const metadata = { title: "Reservas — Configuración" };

export default async function SettingsBookingPage() {
  const { organizationId } = await requireAuth();
  const supabase = createClient();
  const { data: org } = await supabase.from("organizations").select("*").eq("id", organizationId).single();
  return <BookingForm org={org} />;
}
