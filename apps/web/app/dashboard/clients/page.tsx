import { createClient } from "@/lib/supabase/server";
import ClientsList from "./ClientsList";

const ORG_ID = "00000000-0000-0000-0000-000000000010";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();

  // Get clients with aggregated booking stats
  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id, name, phone, email, tags, notes, is_blacklisted, created_at,
      bookings(id, status, starts_at, services(name, price))
    `)
    .eq("organization_id", ORG_ID)
    .order("name");

  // Enrich with stats
  const enriched = (clients ?? []).map((c) => {
    const bookings = (c.bookings ?? []) as Array<{
      id: string; status: string; starts_at: string;
      services: { name: string; price: number } | null;
    }>;
    const total = bookings.filter((b) => b.status !== "cancelled").length;
    const noShows = bookings.filter((b) => b.status === "no_show").length;
    const totalSpent = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.services?.price ?? 0), 0);
    const lastBooking = bookings
      .filter((b) => b.status !== "cancelled")
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0];

    return { ...c, total, noShows, totalSpent, lastBooking: lastBooking?.starts_at ?? null };
  });

  // Filter by search query
  const q = searchParams.q?.toLowerCase() ?? "";
  const filtered = q
    ? enriched.filter((c) =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? "").toLowerCase().includes(q)
      )
    : enriched;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">{filtered.length} clientes</p>
      </div>
      <ClientsList clients={filtered} searchQuery={q} />
    </div>
  );
}

export type ClientRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[] | null;
  notes: string | null;
  is_blacklisted: boolean | null;
  created_at: string;
  total: number;
  noShows: number;
  totalSpent: number;
  lastBooking: string | null;
};
