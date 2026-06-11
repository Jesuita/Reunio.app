import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import StaffList from "./StaffList";

export default async function StaffPage() {
  const { organizationId: ORG_ID } = await requireAuth();
  const supabase = createClient();

  const [{ data: staffMembers }, { data: schedules }, { data: services }, { data: staffServices }] =
    await Promise.all([
      supabase.from("staff").select("*").eq("organization_id", ORG_ID).order("name"),
      supabase.from("schedules").select("*").eq("organization_id", ORG_ID).eq("is_active", true).order("day_of_week"),
      supabase.from("services").select("id, name, category").eq("organization_id", ORG_ID).eq("is_active", true).order("name"),
      supabase.from("staff_services").select("staff_id, service_id"),
    ]);

  // Group schedules by staff_id
  const schedulesByStaff: Record<string, typeof schedules> = {};
  for (const sched of schedules ?? []) {
    (schedulesByStaff[sched.staff_id] ??= []).push(sched);
  }

  // Group service_ids by staff_id
  const servicesByStaff: Record<string, string[]> = {};
  for (const ss of staffServices ?? []) {
    (servicesByStaff[ss.staff_id] ??= []).push(ss.service_id);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Personal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {staffMembers?.filter((s) => s.is_active).length ?? 0} activos
          </p>
        </div>
      </div>
      <StaffList
        staffMembers={staffMembers ?? []}
        schedulesByStaff={schedulesByStaff as Record<string, Array<{ id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean }>>}
        services={services ?? []}
        servicesByStaff={servicesByStaff}
      />
    </div>
  );
}
