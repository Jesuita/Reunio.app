import { createClient } from "@/lib/supabase/server";
import BookingsList from "./BookingsList";

const ORG_ID = "00000000-0000-0000-0000-000000000010";

export type BookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  payment_status: string;
  source: string | null;
  notes: string | null;
  created_at: string;
  clients: { id: string; name: string; phone: string } | null;
  services: { id: string; name: string; color: string; price: number } | null;
  staff: { id: string; name: string } | null;
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    staffId?: string;
    serviceId?: string;
    from?: string;
    to?: string;
    source?: string;
  };
}) {
  const supabase = createClient();

  let query = supabase
    .from("bookings")
    .select(`
      id, starts_at, ends_at, status, payment_status, source, notes, created_at,
      clients(id, name, phone),
      services(id, name, color, price),
      staff(id, name)
    `)
    .eq("organization_id", ORG_ID)
    .order("starts_at", { ascending: false })
    .limit(200);

  if (searchParams.status)    query = query.eq("status", searchParams.status);
  if (searchParams.staffId)   query = query.eq("staff_id", searchParams.staffId);
  if (searchParams.serviceId) query = query.eq("service_id", searchParams.serviceId);
  if (searchParams.source)    query = query.eq("source", searchParams.source);
  if (searchParams.from)      query = query.gte("starts_at", `${searchParams.from}T00:00:00`);
  if (searchParams.to)        query = query.lte("starts_at", `${searchParams.to}T23:59:59`);

  const [{ data: bookings }, { data: staffMembers }, { data: services }] = await Promise.all([
    query,
    supabase.from("staff").select("id, name").eq("organization_id", ORG_ID).eq("is_active", true),
    supabase.from("services").select("id, name").eq("organization_id", ORG_ID).eq("is_active", true),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Turnos</h1>
        <p className="text-muted-foreground text-sm mt-1">{bookings?.length ?? 0} resultados</p>
      </div>
      <BookingsList
        bookings={(bookings ?? []) as BookingRow[]}
        staffMembers={staffMembers ?? []}
        services={services ?? []}
        currentFilters={searchParams}
      />
    </div>
  );
}
