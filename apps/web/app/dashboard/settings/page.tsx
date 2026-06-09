import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

export const metadata = { title: "Configuración — Reunio" };

export default async function SettingsPage() {
  const { organizationId } = await requireAuth();
  const supabase = createClient();

  const [{ data: org }, { data: staffList }, { data: schedules }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", organizationId).single(),
    supabase.from("staff").select("id, name").eq("organization_id", organizationId).eq("is_active", true).order("name"),
    supabase.from("schedules").select("*").eq("organization_id", organizationId).eq("is_active", true).order("day_of_week"),
  ]);

  // Build weekSchedule per staff_id
  type ScheduleRow = { staff_id: string; day_of_week: number; start_time: string; end_time: string };
  const schedulesByStaff: Record<string, ScheduleRow[]> = {};
  for (const s of (schedules ?? []) as ScheduleRow[]) {
    (schedulesByStaff[s.staff_id] ??= []).push(s);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Información del negocio, horarios de atención y preferencias de reserva.
        </p>
      </div>
      <SettingsForm
        org={org}
        staffList={(staffList ?? []) as { id: string; name: string }[]}
        schedulesByStaff={schedulesByStaff}
      />
    </div>
  );
}
