import { createClient } from "@/lib/supabase/server";
import CalendarView from "./CalendarView";

const ORG_ID = "00000000-0000-0000-0000-000000000010";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const supabase = createClient();

  // Default to today in the org's timezone
  const targetDate = searchParams.date ?? new Date().toISOString().slice(0, 10);
  const dayStart = `${targetDate}T00:00:00`;
  const dayEnd = `${targetDate}T23:59:59`;

  const [{ data: bookings }, { data: staffMembers }] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id,
        starts_at,
        ends_at,
        status,
        notes,
        clients ( name, phone ),
        services ( name, color, duration_minutes ),
        staff ( name )
      `)
      .eq("organization_id", ORG_ID)
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd)
      .not("status", "eq", "cancelled")
      .order("starts_at"),
    supabase
      .from("staff")
      .select("id, name")
      .eq("organization_id", ORG_ID)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
      </div>
      <CalendarView
        date={targetDate}
        bookings={(bookings ?? []) as BookingRow[]}
        staffMembers={staffMembers ?? []}
        orgId={ORG_ID}
      />
    </div>
  );
}

export type BookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  clients: { name: string; phone: string } | null;
  services: { name: string; color: string; duration_minutes: number } | null;
  staff: { name: string } | null;
};
