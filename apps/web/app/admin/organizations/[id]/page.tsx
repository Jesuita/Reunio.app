import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { ExternalLink, ArrowLeft, Users, Calendar, Package, Tag } from "lucide-react";
import OrgActions from "../OrgActions";
import { getRubroConfig, getInitials } from "@/lib/rubros";

export const metadata = { title: "Detalle negocio — Admin Reunio" };

interface PageProps {
  params: { id: string };
}

export default async function AdminOrgDetailPage({ params }: PageProps) {
  const admin = createAdminClient();

  // ── Fetch org + plan in one query ────────────────────────────────────────────
  const { data: org } = await admin
    .from("organizations")
    .select(`*, plans ( id, name, price_monthly_ars )`)
    .eq("id", params.id)
    .single();

  if (!org) notFound();

  // ── Parallel stats ────────────────────────────────────────────────────────────
  const [
    { count: staffCount },
    { count: serviceCount },
    { count: bookingCount },
    { count: clientCount },
    { data: recentBookings },
    { data: staffList },
  ] = await Promise.all([
    admin.from("staff")   .select("*", { count: "exact", head: true }).eq("organization_id", org.id),
    admin.from("services").select("*", { count: "exact", head: true }).eq("organization_id", org.id).eq("is_active", true),
    admin.from("bookings").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
    admin.from("clients") .select("*", { count: "exact", head: true }).eq("organization_id", org.id),
    admin.from("bookings")
      .select("id, starts_at, status, services(name), clients(name)")
      .eq("organization_id", org.id)
      .order("starts_at", { ascending: false })
      .limit(5),
    admin.from("staff")
      .select("id, name, email, color, is_active, role")
      .eq("organization_id", org.id)
      .order("name"),
  ]);

  const settings     = (org.settings ?? {}) as Record<string, unknown>;
  const plan         = (org as unknown as { plans: { name: string; price_monthly_ars: number } | null }).plans;
  const rubroConfig  = getRubroConfig(org.rubro ?? undefined);
  const initials     = getInitials(org.name);

  const stripeCustomerId    = settings["stripe_customer_id"]    as string | undefined;
  const stripeSubscriptionId= settings["stripe_subscription_id"] as string | undefined;
  const stripeStatus        = settings["stripe_status"]         as string | undefined;
  const stripePriceId       = settings["stripe_price_id"]       as string | undefined;

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <Link href="/admin/organizations"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a Negocios
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: rubroConfig.color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <Link href={`/${org.slug}`} target="_blank"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
              <ExternalLink className="w-3.5 h-3.5" /> Ver página
            </Link>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {org.rubro ?? "Sin rubro"}{org.city ? ` · ${org.city}` : ""} · /{org.slug}
          </p>
          <div className="mt-2">
            <OrgActions orgId={org.id} isActive={org.is_active ?? true} isListed={org.is_listed ?? true} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: info + subscription ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Profesionales", value: staffCount ?? 0,   icon: Users },
              { label: "Servicios",     value: serviceCount ?? 0, icon: Package },
              { label: "Turnos",        value: bookingCount ?? 0, icon: Calendar },
              { label: "Clientes",      value: clientCount ?? 0,  icon: Tag },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-background border rounded-xl p-4 text-center">
                <Icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="bg-background border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">Información del negocio</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ["Nombre",      org.name],
                ["Slug",        org.slug],
                ["Email / Tel", org.phone ?? "—"],
                ["Dirección",   org.address ?? "—"],
                ["Ciudad",      org.city ?? "—"],
                ["Rubro",       org.rubro ?? "—"],
                ["Zona horaria",org.timezone],
                ["Creado",      new Date(org.created_at as string).toLocaleString("es-AR")],
                ["Descripción", org.description ?? "—"],
                ["Sitio web",   org.website ?? "—"],
              ].map(([k, v]) => (
                <div key={k as string} className="col-span-1">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Últimos turnos */}
          <div className="bg-background border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b">
              <h2 className="font-semibold text-sm">Últimos 5 turnos</h2>
            </div>
            {!recentBookings || recentBookings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Sin turnos aún.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-5 py-2 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-5 py-2 font-medium text-muted-foreground">Servicio</th>
                    <th className="text-left px-5 py-2 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-5 py-2 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(recentBookings as unknown as Array<{ id: string; starts_at: string; status: string; services: { name: string } | null; clients: { name: string } | null }>).map((b) => {
                    const svc = b.services;
                    const cli = b.clients;
                    return (
                      <tr key={b.id}>
                        <td className="px-5 py-2 text-xs">{new Date(b.starts_at as string).toLocaleString("es-AR")}</td>
                        <td className="px-5 py-2 text-xs">{svc?.name ?? "—"}</td>
                        <td className="px-5 py-2 text-xs">{cli?.name ?? "—"}</td>
                        <td className="px-5 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            b.status === "confirmed"  ? "bg-green-100 text-green-700"
                            : b.status === "cancelled"? "bg-red-100 text-red-600"
                            : b.status === "pending"  ? "bg-yellow-100 text-yellow-700"
                            : "bg-muted text-muted-foreground"
                          }`}>{b.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Right column: plan + staff ── */}
        <div className="space-y-5">

          {/* Suscripción */}
          <div className="bg-background border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">Suscripción</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Plan</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                  plan?.name === "business" ? "bg-purple-100 text-purple-700"
                  : plan?.name === "pro"   ? "bg-blue-100 text-blue-700"
                  : "bg-muted text-muted-foreground"
                }`}>{plan?.name ?? "free"}</span>
              </div>
              {plan?.price_monthly_ars && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio</span>
                  <span>${plan.price_monthly_ars.toLocaleString("es-AR")}/mes</span>
                </div>
              )}
              {stripeStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado Stripe</span>
                  <span className={`font-medium ${stripeStatus === "active" ? "text-green-600" : "text-muted-foreground"}`}>
                    {stripeStatus}
                  </span>
                </div>
              )}
              {stripeCustomerId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Customer ID</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">{stripeCustomerId}</p>
                </div>
              )}
              {stripeSubscriptionId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Subscription ID</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">{stripeSubscriptionId}</p>
                </div>
              )}
              {stripePriceId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Price ID</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">{stripePriceId}</p>
                </div>
              )}
              {!stripeCustomerId && (
                <p className="text-xs text-muted-foreground italic">Sin suscripción Stripe.</p>
              )}
            </div>
          </div>

          {/* Staff */}
          <div className="bg-background border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">Profesionales ({staffCount ?? 0})</h2>
            {!staffList || staffList.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin profesionales.</p>
            ) : (
              <ul className="space-y-2">
                {(staffList as Array<{ id: string; name: string; email: string | null; color: string | null; is_active: boolean; role: string }>).map((s) => (
                  <li key={s.id} className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: s.color ?? "#6366F1" }}
                    >
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.email ?? s.role}</p>
                    </div>
                    {!s.is_active && (
                      <span className="text-xs text-muted-foreground">inactivo</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Raw settings (collapsed) */}
          <details className="bg-background border rounded-xl p-5 text-xs">
            <summary className="font-semibold text-sm cursor-pointer select-none">
              Settings JSON (raw)
            </summary>
            <pre className="mt-3 bg-muted p-3 rounded overflow-x-auto text-xs leading-relaxed">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
