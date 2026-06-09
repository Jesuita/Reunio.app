import { createAdminClient } from "@/lib/supabase/server";
import { Building2, Users, Calendar, TrendingUp, AlertCircle } from "lucide-react";

export const metadata = { title: "Admin — Reunio" };

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="bg-background border rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${accent ?? "bg-primary/10"}`}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const admin = createAdminClient();

  // ── Fetch all metrics in parallel ──────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso   = today.toISOString();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [
    { count: totalOrgs },
    { count: activeOrgs },
    { count: inactiveOrgs },
    { count: freeOrgs },
    { count: todayBookings },
    { count: monthBookings },
    { count: totalClients },
    { data: recentOrgs },
  ] = await Promise.all([
    admin.from("organizations").select("*", { count: "exact", head: true }),
    admin.from("organizations").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("organizations").select("*", { count: "exact", head: true }).eq("is_active", false),
    admin.from("organizations").select("*", { count: "exact", head: true })
      .is("plan_id", null),
    admin.from("bookings").select("*", { count: "exact", head: true })
      .gte("created_at", todayIso),
    admin.from("bookings").select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
    admin.from("clients").select("*", { count: "exact", head: true }),
    admin.from("organizations")
      .select("id, name, slug, rubro, city, is_active, is_listed, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Métricas globales de la plataforma Reunio.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Negocios totales"  value={totalOrgs ?? 0}    sub={`${activeOrgs ?? 0} activos`}   icon={Building2} />
        <StatCard label="Clientes totales"  value={totalClients ?? 0}                                       icon={Users} />
        <StatCard label="Turnos hoy"        value={todayBookings ?? 0} sub="desde medianoche"               icon={Calendar} />
        <StatCard label="Turnos este mes"   value={monthBookings ?? 0}                                      icon={TrendingUp} />
      </div>

      {/* Warnings */}
      {(inactiveOrgs ?? 0) > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{inactiveOrgs}</strong> {inactiveOrgs === 1 ? "negocio suspendido" : "negocios suspendidos"}.</span>
          <a href="/admin/organizations?active=false" className="underline ml-1">Ver →</a>
        </div>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-background border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Por estado</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Activos</span>
              <span className="font-semibold">{activeOrgs ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Suspendidos</span>
              <span className="font-semibold">{inactiveOrgs ?? 0}</span>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Por plan</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Free</span>
              <span className="font-semibold">{freeOrgs ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Pro / Business</span>
              <span className="font-semibold">{Math.max(0, (totalOrgs ?? 0) - (freeOrgs ?? 0))}</span>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">En directorio</p>
          <div className="text-2xl font-bold">
            {/* we'd need another query; placeholder */}
            —
          </div>
          <p className="text-xs text-muted-foreground mt-1">Ver en <a href="/admin/organizations" className="underline">Negocios</a></p>
        </div>
      </div>

      {/* Recent orgs */}
      <div className="bg-background border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Últimos negocios registrados</h2>
          <a href="/admin/organizations" className="text-xs text-primary hover:underline">Ver todos →</a>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">Negocio</th>
              <th className="text-left px-5 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Rubro</th>
              <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-5 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(recentOrgs as Array<{ id: string; name: string; slug: string; rubro: string | null; is_active: boolean; created_at: string }> ?? []).map((org) => (
              <tr key={org.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3">
                  <a href={`/admin/organizations/${org.id}`} className="font-medium hover:text-primary transition-colors">
                    {org.name}
                  </a>
                  <p className="text-xs text-muted-foreground">{org.slug}</p>
                </td>
                <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{org.rubro ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    org.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {org.is_active ? "Activo" : "Suspendido"}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                  {new Date(org.created_at as string).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
