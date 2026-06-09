import { createClient } from "@/lib/supabase/server";
import { Calendar, Users, TrendingUp, Clock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();

  // For now, use the demo org. In production this comes from session.
  const ORG_ID = "00000000-0000-0000-0000-000000000010";

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [
    { count: todayCount },
    { count: monthCount },
    { count: pendingCount },
    { count: staffCount },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ORG_ID)
      .gte("starts_at", today + "T00:00:00Z")
      .lte("starts_at", today + "T23:59:59Z"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ORG_ID)
      .gte("starts_at", monthStart + "T00:00:00Z"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ORG_ID)
      .eq("status", "pending"),
    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ORG_ID)
      .eq("is_active", true),
  ]);

  const stats = [
    { label: "Turnos hoy", value: todayCount ?? 0, icon: Calendar, color: "text-blue-600 bg-blue-50" },
    { label: "Turnos este mes", value: monthCount ?? 0, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Pendientes", value: pendingCount ?? 0, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Personal activo", value: staffCount ?? 0, icon: Users, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-background rounded-xl border p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
