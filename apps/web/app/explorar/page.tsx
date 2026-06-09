import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/server";
import { getRubroConfig, getOrgCover, getInitials } from "@/lib/rubros";
import ExplorarFilters from "./ExplorarFilters";
import { MapPin, Calendar, ChevronRight } from "lucide-react";

export const metadata = { title: "Explorar negocios — Reunio" };

// ─── Types ─────────────────────────────────────────────────────────────────

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rubro: string | null;
  city: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  logo_url: string | null;
  services: { id: string; price: number | null }[];
};

// ─── Business card ──────────────────────────────────────────────────────────

function BusinessCard({ org }: { org: OrgRow }) {
  const config    = getRubroConfig(org.rubro);
  const cover     = getOrgCover(org.cover_url, org.rubro);
  const initials  = getInitials(org.name);
  const prices    = org.services.map((s) => s.price ?? 0).filter(Boolean);
  const minPrice  = prices.length ? Math.min(...prices) : null;
  const maxPrice  = prices.length ? Math.max(...prices) : null;
  const svcCount  = org.services.length;

  return (
    <Link
      href={`/${org.slug}`}
      className="group flex flex-col bg-background border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-muted">
        <Image
          src={cover}
          alt={org.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized // allow external Unsplash URLs without next.config domain whitelist
        />
        {/* Rubro badge */}
        <span
          className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full text-white shadow-sm"
          style={{ backgroundColor: config.color + "ee" }}
        >
          {config.emoji} {org.rubro ?? "Otro"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 -mt-7 ring-2 ring-background"
            style={{ backgroundColor: config.color }}
          >
            {org.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-semibold text-sm leading-snug truncate group-hover:text-primary transition-colors">
              {org.name}
            </h3>
            {org.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {org.city}
              </p>
            )}
          </div>
        </div>

        {org.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{org.description}</p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground border-t">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {svcCount} {svcCount === 1 ? "servicio" : "servicios"}
          </span>
          {minPrice !== null && (
            <span className="font-medium text-foreground">
              {minPrice === maxPrice
                ? `$${minPrice.toLocaleString("es-AR")}`
                : `$${minPrice.toLocaleString("es-AR")} – $${maxPrice!.toLocaleString("es-AR")}`
              }
            </span>
          )}
          <span className="text-primary flex items-center gap-0.5 font-medium">
            Reservar <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { q?: string; rubro?: string; city?: string };
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const supabase = createAdminClient(); // bypass RLS – we use is_listed filter manually
  const { q, rubro, city } = searchParams;

  // Fetch orgs and their services separately to include orgs with 0 services
  let orgsQuery = supabase
    .from("organizations")
    .select("id, name, slug, description, rubro, city, avatar_url, cover_url, logo_url")
    .eq("is_listed", true)
    .order("name");

  if (q)     orgsQuery = orgsQuery.ilike("name", `%${q}%`);
  if (rubro) orgsQuery = orgsQuery.eq("rubro", rubro);
  if (city)  orgsQuery = orgsQuery.eq("city", city);

  const { data: orgs } = await orgsQuery.limit(60);

  type OrgDbRow = { id: string; name: string; slug: string; description: string | null; rubro: string | null; city: string | null; avatar_url: string | null; cover_url: string | null; logo_url: string | null };

  // Fetch services for those orgs
  const orgIds = (orgs as OrgDbRow[] ?? []).map((o) => o.id);
  const { data: services } = orgIds.length
    ? await supabase
        .from("services")
        .select("id, organization_id, price")
        .in("organization_id", orgIds)
        .eq("is_active", true)
    : { data: [] };

  // Fetch all cities for the filter dropdown
  const { data: cityRows } = await supabase
    .from("organizations")
    .select("city")
    .eq("is_listed", true)
    .not("city", "is", null);

  const citySet = new Set<string>();
  for (const r of (cityRows ?? []) as { city: string | null }[]) {
    if (r.city) citySet.add(r.city);
  }
  const cities = Array.from(citySet).sort();

  // Merge services into orgs
  const servicesByOrg = new Map<string, { id: string; price: number | null }[]>();
  for (const svc of (services ?? [])) {
    const list = servicesByOrg.get(svc.organization_id) ?? [];
    list.push({ id: svc.id, price: svc.price });
    servicesByOrg.set(svc.organization_id, list);
  }

  const orgList: OrgRow[] = (orgs as OrgDbRow[] ?? []).map((o) => ({
    ...o,
    services: servicesByOrg.get(o.id) ?? [],
  }));

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Explorar negocios</h1>
          <p className="text-muted-foreground mt-2">
            Encontrá profesionales y negocios cerca tuyo y reservá un turno en segundos.
          </p>
          <div className="mt-6">
            <ExplorarFilters cities={cities} />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {orgList.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium">No encontramos resultados</p>
            <p className="text-sm mt-1">Probá con otros filtros o buscá por nombre.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {orgList.length} {orgList.length === 1 ? "negocio encontrado" : "negocios encontrados"}
              {rubro ? ` · ${rubro}` : ""}
              {city  ? ` · ${city}`  : ""}
              {q     ? ` · "${q}"`   : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {orgList.map((org) => (
                <BusinessCard key={org.id} org={org} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
