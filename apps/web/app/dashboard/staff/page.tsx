import { createClient } from "@/lib/supabase/server";
import StaffList from "./StaffList";

const ORG_ID = "00000000-0000-0000-0000-000000000010";

export default async function StaffPage() {
  const supabase = createClient();

  const [{ data: staffMembers }, { data: schedules }] = await Promise.all([
    supabase
      .from("staff")
      .select("*")
      .eq("organization_id", ORG_ID)
      .order("name"),
    supabase
      .from("schedules")
      .select("*")
      .eq("organization_id", ORG_ID)
      .eq("is_active", true)
      .order("day_of_week"),
  ]);

  // Group schedules by staff_id
  const schedulesByStaff: Record<string, typeof schedules> = {};
  for (const sched of schedules ?? []) {
    (schedulesByStaff[sched.staff_id] ??= []).push(sched);
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
      />
    </div>
  );
}
