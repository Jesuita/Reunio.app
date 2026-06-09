import { createClient } from "@/lib/supabase/server";
import ReportsView from "./ReportsView";

const ORG_ID = "00000000-0000-0000-0000-000000000010";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const supabase = createClient();
  const period = searchParams.period ?? "month";

  const now = new Date();
  let fromDate: string;

  if (period === "week") {
    fromDate = new Date(now.getTime() - 7 * 86400000).toISOString();
  } else if (period === "month") {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else {
    // year
    fromDate = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  const [{ data: bookings }, { data: staffMembers }, { data: services }] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id, starts_at, status, payment_status,
        services(id, name, price),
        staff(id, name)
      `)
      .eq("organization_id", ORG_ID)
      .gte("starts_at", fromDate)
      .order("starts_at"),
    supabase.from("staff").select("id, name").eq("organization_id", ORG_ID).eq("is_active", true),
    supabase.from("services").select("id, name, color").eq("organization_id", ORG_ID).eq("is_active", true),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reportes</h1>
      </div>
      <ReportsView
        bookings={(bookings ?? []) as ReportBooking[]}
        staffMembers={staffMembers ?? []}
        services={services ?? []}
        period={period}
      />
    </div>
  );
}

export type ReportBooking = {
  id: string;
  starts_at: string;
  status: string;
  payment_status: string;
  services: { id: string; name: string; price: number } | null;
  staff: { id: string; name: string } | null;
};
