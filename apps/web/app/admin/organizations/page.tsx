import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { ExternalLink } from "lucide-react";
import OrgActions from "./OrgActions";
import AdminOrgFilters from "./AdminOrgFilters";

export const metadata = { title: "Negocios — Admin Reunio" };

interface PageProps {
  searchParams: {
    q?: string;
    rubro?: string;
    active?: string;   // "true" | "false" | undefined (= todos)
    listed?: string;
    plan?: string;
    page?: string;
  };
}

const PAGE_SIZE = 25;

export default async function AdminOrganizationsPage({ searchParams }: PageProps) {
  const admin = createAdminClient();

  const q       = searchParams.q ?? "";
  const rubro   = searchParams.rubro ?? "";
  const active  = searchParams.active;   // undefined | "true" | "false"
  const listed  = searchParams.listed;
  const page    = Math.max(1, Number(searchParams.page ?? 1));
  const from    = (page - 1) * PAGE_SIZE;
  const to      = from + PAGE_SIZE - 1;

  // ── Build query ─────────────────────────────────────────────────────────────
  let query = admin
    .from("organizations")
    .select(`
      id, name, slug, rubro, city,
      is_active, is_listed, created_at,
      plan_id, settings,
      plans ( name )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q)               query = query.ilike("name", `%${q}%`);
  if (rubro)           query = query.eq("rubro", rubro);
  if (active === "true")  query = query.eq("is_active", true);
  if (active === "false") query = query.eq("is_active", false);
  if (listed === "true")  query = query.eq("is_listed", true);
  if (listed === "false") query = query.eq("is_listed", false);

  const { data: orgs, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  type OrgRow = {
    id: string; name: string; slug: string; rubro: string | null; city: string | null;
    is_active: boolean; is_listed: boolean; created_at: string;
    plan_id: string | null; settings: Record<string, unknown> | null;
    plans: { name: string } | null;
  };

  // ── Staff + bookings counts (for the visible page only) ─────────────────────
  const orgIds = (orgs as OrgRow[] ?? []).map((o) => o.id);

  const [{ data: staffRows }, { data: bookingRows }] = await Promise.all([
    orgIds.length
      ? admin.from("staff").select("organization_id").in("organization_id", orgIds).eq("is_active", true)
      : { data: [] },
    orgIds.length
      ? admin.from("bookings").select("organization_id").in("organization_id", orgIds)
      : { data: [] },
  ]);

  const staffCount   = new Map<string, number>();
  const bookingCount = new Map<string, number>();
  for (const s of (staffRows ?? [])) {
    staffCount.set(s.organization_id, (staffCount.get(s.organization_id) ?? 0) + 1);
  }
  for (const b of (bookingRows ?? [])) {
    bookingCount.set(b.organization_id, (bookingCount.get(b.organization_id) ?? 0) + 1);
  }

  // ── Helper: build filter URL ─────────────────────────────────────────────────
  function filterUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { q, rubro, active, listed, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/admin/organizations?${p.toString()}`;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Negocios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} en total
          </p>
        </div>
      </div>

      {/* ── Filters (Client Component — uses useRouter for onChange) ── */}
      <AdminOrgFilters q={q} rubro={rubro} active={active} listed={listed} />

      {/* ── Table ── */}
      <div className="bg-background border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Negocio</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Rubro · Ciudad</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Plan</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden xl:table-cell">Staff · Turnos</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Registro</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {(orgs ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  No se encontraron negocios con esos filtros.
                </td>
              </tr>
            )}
            {(orgs as OrgRow[] ?? []).map((org) => {
              const settings  = (org.settings ?? {}) as Record<string, unknown>;
              const plan      = org.plans as { name: string } | null;
              return (
                <tr key={org.id} className="hover:bg-muted/20 transition-colors">
                  {/* Name */}
                  <td className="px-5 py-3">
                    <Link href={`/admin/organizations/${org.id}`}
                      className="font-medium hover:text-primary transition-colors">
                      {org.name}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono">{org.slug}</p>
                  </td>
                  {/* Rubro · City */}
                  <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    <span>{org.rubro ?? "—"}</span>
                    {org.city && <><br /><span>{org.city}</span></>}
                  </td>
                  {/* Plan */}
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      plan?.name === "business" ? "bg-purple-100 text-purple-700"
                      : plan?.name === "pro"    ? "bg-blue-100 text-blue-700"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      {plan?.name ?? "free"}
                    </span>
                    {settings["stripe_customer_id"] ? (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {String(settings["stripe_customer_id"]).slice(0, 14)}…
                      </p>
                    ) : null}
                  </td>
                  {/* Staff · Bookings */}
                  <td className="px-5 py-3 text-muted-foreground text-xs hidden xl:table-cell">
                    <span>{staffCount.get(org.id) ?? 0} staff</span>
                    <br />
                    <span>{bookingCount.get(org.id) ?? 0} turnos</span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3">
                    <OrgActions
                      orgId={org.id}
                      isActive={org.is_active ?? true}
                      isListed={org.is_listed ?? true}
                    />
                  </td>
                  {/* Created at */}
                  <td className="px-5 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                    {new Date(org.created_at as string).toLocaleDateString("es-AR")}
                  </td>
                  {/* External link */}
                  <td className="px-5 py-3">
                    <Link href={`/${org.slug}`} target="_blank"
                      className="text-muted-foreground hover:text-foreground transition-colors" title="Ver página pública">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={filterUrl({ page: String(page - 1) })}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors">
                  ← Anterior
                </a>
              )}
              {page < totalPages && (
                <a href={filterUrl({ page: String(page + 1) })}
                  className="px-3 py-1.5 border rounded-lg hover:bg-muted transition-colors">
                  Siguiente →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
