import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { Calendar, Users, TrendingUp, Clock, ArrowRight, AlertCircle } from "lucide-react";


function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const { organizationId: ORG_ID } = await requireAuth();
  const supabase = createClient();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStart = todayStr.slice(0, 7) + "-01";
  const nowIso = now.toISOString();

  const [
    { data: todayBookings },
    { data: recentBookings },
    { data: recentCancels },
    { count: staffCount },
    { data: waitlistEntries },
    { data: weekData },
  ] = await Promise.all([
    // Today's bookings with full details
    supabase
      .from("bookings")
      .select(`id, starts_at, ends_at, status, clients(name), services(name, price), staff(name)`)
      .eq("organization_id", ORG_ID)
      .gte("starts_at", `${todayStr}T00:00:00`)
      .lte("starts_at", `${todayStr}T23:59:59`)
      .not("status", "eq", "cancelled")
      .order("starts_at"),
    // Recent bookings (last 5 confirmed)
    supabase
      .from("bookings")
      .select(`id, starts_at, status, source, clients(name), services(name), staff(name)`)
      .eq("organization_id", ORG_ID)
      .in("status", ["confirmed", "pending"])
      .order("created_at", { ascending: false })
      .limit(5),
    // Recent cancellations
    supabase
      .from("bookings")
      .select(`id, starts_at, clients(name), services(name)`)
      .eq("organization_id", ORG_ID)
      .eq("status", "cancelled")
      .order("updated_at", { ascending: false })
      .limit(3),
    // Active staff count
    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", ORG_ID)
      .eq("is_active", true),
    // Waitlist
    supabase
      .from("waitlist")
      .select(`preferred_date, clients(name), services(name)`)
      .eq("organization_id", ORG_ID)
      .eq("status", "waiting")
      .order("created_at", { ascending: true })
      .limit(5),
    // Last 7 days occupancy data
    supabase
      .from("bookings")
      .select("starts_at, status")
      .eq("organization_id", ORG_ID)
      .gte("starts_at", new Date(now.getTime() - 7 * 86400000).toISOString())
      .lte("starts_at", nowIso)
      .not("status", "eq", "cancelled"),
  ]);

  // Compute today metrics
  const confirmed = todayBookings?.filter((b) => b.status === "confirmed").length ?? 0;
  const pending   = todayBookings?.filter((b) => b.status === "pending").length ?? 0;
  const total     = todayBookings?.length ?? 0;

  // Projected revenue = sum of service prices for today's non-cancelled bookings
  const projectedRevenue = (todayBookings ?? []).reduce((sum, b) => {
    const price = (b.services as { price?: number } | null)?.price ?? 0;
    return sum + price;
  }, 0);

  // Occupancy: assume 8h/day * staff = available slots of 30min each
  const availableSlots = (staffCount ?? 1) * 16;
  const occupancyPct = availableSlots > 0 ? Math.round((total / availableSlots) * 100) : 0;

  // Next booking
  const nextBooking = (todayBookings ?? []).find((b) => new Date(b.starts_at) > now);

  // Week bar chart data
  const weekDays: { label: string; date: string; count: number; noShows: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dayStr = d.toISOString().slice(0, 10);
    const dayBookings = (weekData ?? []).filter((b) => b.starts_at.slice(0, 10) === dayStr);
    weekDays.push({
      label: d.toLocaleDateString("es-AR", { weekday: "short" }),
      date: dayStr,
      count: dayBookings.filter((b) => b.status !== "no_show").length,
      noShows: dayBookings.filter((b) => b.status === "no_show").length,
    });
  }
  const maxCount = Math.max(...weekDays.map((d) => d.count), 1);

  const SOURCE_LABEL: Record<string, string> = { web: "Web", whatsapp: "WhatsApp", admin: "Admin" };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">
          {now.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Mobile date header */}
      <div className="md:hidden">
        <p className="text-xs text-muted-foreground capitalize">
          {now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-xl font-bold mt-0.5">Tu día de hoy</h1>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-background rounded-2xl border p-4 md:p-5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2 md:mb-3 text-blue-600 bg-blue-50">
            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="text-2xl md:text-3xl font-bold">{total}</div>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">Turnos hoy</div>
          <div className="text-xs text-muted-foreground mt-1">
            {confirmed} confirm. · {pending} pend.
          </div>
        </div>

        <div className="bg-background rounded-2xl border p-4 md:p-5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2 md:mb-3 text-green-600 bg-green-50">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="text-xl md:text-3xl font-bold leading-tight">{formatPrice(projectedRevenue)}</div>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">Ingresos hoy</div>
          <div className="text-xs text-muted-foreground mt-1">proyectados</div>
        </div>

        <div className="bg-background rounded-2xl border p-4 md:p-5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2 md:mb-3 text-amber-600 bg-amber-50">
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="text-2xl md:text-3xl font-bold">{occupancyPct}%</div>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">Ocupación</div>
          <div className="w-full bg-muted rounded-full h-1 mt-2">
            <div
              className="bg-amber-500 h-1 rounded-full transition-all"
              style={{ width: `${Math.min(occupancyPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-background rounded-2xl border p-4 md:p-5">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2 md:mb-3 text-purple-600 bg-purple-50">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="text-2xl md:text-3xl font-bold">{staffCount ?? 0}</div>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">Personal</div>
          {nextBooking && (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              Próx: {formatTime(nextBooking.starts_at)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Week bar chart */}
        <div className="bg-background rounded-xl border p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold mb-4">Ocupación últimos 7 días</h2>
          <div className="flex items-end gap-1.5 h-24">
            {weekDays.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                  <div
                    className="w-full bg-primary/80 rounded-sm transition-all"
                    style={{ height: `${(day.count / maxCount) * 72}px` }}
                    title={`${day.count} turnos`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground capitalize">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's agenda quick view */}
        <div className="bg-background rounded-xl border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Agenda de hoy</h2>
            <Link href="/dashboard/calendar" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver completo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {(todayBookings?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin turnos para hoy.</p>
          ) : (
            <div className="space-y-2">
              {(todayBookings ?? []).slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
                    {formatTime(b.starts_at)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{(b.clients as unknown as {name:string}|null)?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{(b.services as unknown as {name:string}|null)?.name} · {(b.staff as unknown as {name:string}|null)?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" :
                    b.status === "pending" ? "bg-amber-100 text-amber-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {b.status === "confirmed" ? "Confirmado" : b.status === "pending" ? "Pendiente" : b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent bookings */}
        <div className="bg-background rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Últimas reservas</h2>
            <Link href="/dashboard/bookings" className="text-xs text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {(recentBookings ?? []).map((b) => (
              <div key={b.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{(b.clients as unknown as {name:string}|null)?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(b.services as unknown as {name:string}|null)?.name} · {formatTime(b.starts_at)}
                    {b.source && ` · ${SOURCE_LABEL[b.source] ?? b.source}`}
                  </p>
                </div>
              </div>
            ))}
            {(recentBookings?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Sin reservas recientes.</p>
            )}
          </div>
        </div>

        {/* Recent cancellations */}
        <div className="bg-background rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Cancelaciones recientes</h2>
          </div>
          <div className="space-y-3">
            {(recentCancels ?? []).map((b) => (
              <div key={b.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{(b.clients as unknown as {name:string}|null)?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(b.services as unknown as {name:string}|null)?.name} · {formatTime(b.starts_at)}
                  </p>
                </div>
              </div>
            ))}
            {(recentCancels?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Sin cancelaciones recientes.</p>
            )}
          </div>
        </div>

        {/* Waitlist */}
        <div className="bg-background rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Lista de espera</h2>
            {(waitlistEntries?.length ?? 0) > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {waitlistEntries!.length}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {(waitlistEntries ?? []).map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{(w.clients as unknown as {name:string}|null)?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(w.services as unknown as {name:string}|null)?.name} · {w.preferred_date}
                  </p>
                </div>
              </div>
            ))}
            {(waitlistEntries?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Lista de espera vacía.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
