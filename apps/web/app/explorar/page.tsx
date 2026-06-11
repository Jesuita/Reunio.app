export const dynamic = "force-dynamic";
export const metadata = { title: "Explorar negocios — Reunio" };

import Link from "next/link";
import Image from "next/image";
import { getRubroConfig, getOrgCover, RUBROS } from "@/lib/rubros";
import ExplorarFilters from "./ExplorarFilters";
import DbDown from "@/components/DbDown";
import { searchOrganizations, type OrgResult } from "./search";
import { MapPin, Clock, ArrowLeft, Sparkles, Star } from "lucide-react";

function priceRange(services: OrgResult["services"]) {
  const prices = services.map((s) => s.price ?? 0).filter(Boolean);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `$${min.toLocaleString("es-AR")}`;
  return `$${min.toLocaleString("es-AR")} – $${max.toLocaleString("es-AR")}`;
}

function avgDuration(services: OrgResult["services"]) {
  if (!services.length) return null;
  const avg = Math.round(services.reduce((s, x) => s + x.duration_minutes, 0) / services.length);
  if (avg < 60) return `~${avg} min`;
  const h = Math.floor(avg / 60), m = avg % 60;
  return m ? `~${h}h ${m}min` : `~${h}h`;
}

function MatchBadge({ reasons }: { reasons: string[] }) {
  if (!reasons.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reasons.map((r) => (
        <span key={r} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          {r}
        </span>
      ))}
    </div>
  );
}

function BusinessCard({ org, showMatch }: { org: OrgResult; showMatch: boolean }) {
  const config   = getRubroConfig(org.rubro);
  const cover    = getOrgCover(org.cover_url, org.rubro);
  const price    = priceRange(org.services);
  const duration = avgDuration(org.services);

  return (
    <Link
      href={`/${org.slug}`}
      className="group flex flex-col bg-white border border-border/60 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Cover */}
      <div className="relative h-44 overflow-hidden bg-muted shrink-0">
        <Image
          src={cover} alt={org.name} fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Rubro badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-semibold backdrop-blur-sm shadow-sm"
          style={{ backgroundColor: config.color + "d9" }}>
          {config.emoji} {org.rubro ?? "Servicios"}
        </div>

        {/* Featured star */}
        {org.is_featured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500 text-white text-[11px] font-semibold px-2 py-1 rounded-full shadow-sm">
            <Star className="w-3 h-3 fill-white" /> Destacado
          </div>
        )}
        {!org.is_featured && org.services.length > 0 && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
            {org.services.length} {org.services.length === 1 ? "servicio" : "servicios"}
          </div>
        )}

        {/* Logo */}
        <div className="absolute -bottom-5 left-4">
          <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-white font-bold text-base"
            style={{ backgroundColor: config.color }}>
            {org.logo_url
              ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
              : org.name[0]}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-4 pt-8 pb-4 gap-2">
        <div>
          <h3 className="font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {org.name}
          </h3>
          {org.city && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" /> {org.city}
            </p>
          )}
          {showMatch && <MatchBadge reasons={org.matchReasons} />}
        </div>

        {org.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{org.description}</p>
        )}

        {/* Staff avatars */}
        {org.staff.length > 0 && (
          <div className="flex -space-x-2">
            {org.staff.slice(0, 4).map((s) => (
              <div key={s.id} className="w-6 h-6 rounded-full border-2 border-white bg-muted overflow-hidden"
                style={{ backgroundColor: config.color + "66" }}>
                {s.avatar_url
                  ? <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white">{s.name[0]}</span>
                }
              </div>
            ))}
            {org.staff.length > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                +{org.staff.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {duration && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {duration}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {price && <span className="text-xs font-semibold">{price}</span>}
            <span className="text-xs font-semibold text-white bg-primary px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 shrink-0">
              Reservar
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface PageProps {
  searchParams: {
    q?: string; rubro?: string; city?: string;
    minPrice?: string; maxPrice?: string;
    sort?: string;
  };
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const filters = {
    q:        searchParams.q ?? "",
    rubro:    searchParams.rubro ?? "",
    city:     searchParams.city ?? "",
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : null,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : null,
    sort:     (searchParams.sort ?? "relevance") as "relevance" | "price_asc" | "price_desc" | "name",
  };

  let orgs: OrgResult[]         = [];
  let cities: string[]          = [];
  let rubroCounts               = new Map<string, number>();
  let maxServicePrice           = 50000;

  try {
    const result = await searchOrganizations(filters);
    orgs        = result.orgs;
    cities      = result.cities;
    rubroCounts = result.rubroCounts;

    // For price slider hint
    const allPrices = orgs.flatMap((o) => o.services.map((s) => s.price ?? 0)).filter(Boolean);
    if (allPrices.length) maxServicePrice = Math.max(...allPrices);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 pt-8 pb-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Inicio
            </Link>
          </div>
        </div>
        <DbDown context="directory" errorMessage={msg} />
      </div>
    );
  }

  const hasFilters    = filters.q || filters.rubro || filters.city || filters.minPrice || filters.maxPrice;
  const featuredOrgs  = orgs.filter((o) => o.is_featured);
  const regularOrgs   = orgs.filter((o) => !o.is_featured);
  const showMatch     = !!filters.q;
  const totalListed   = Array.from(rubroCounts.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Inicio
          </Link>
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Explorá negocios</h1>
            <p className="text-muted-foreground mt-2 text-base">
              {totalListed > 0
                ? `${totalListed} negocio${totalListed !== 1 ? "s" : ""} en ${cities.length} ciudad${cities.length !== 1 ? "es" : ""} — reservá en segundos.`
                : "Encontrá profesionales cerca tuyo y reservá en segundos."}
            </p>
          </div>
          <ExplorarFilters
            cities={cities}
            rubros={[...RUBROS]}
            rubroCounts={rubroCounts}
            maxServicePrice={maxServicePrice}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ── Active filter chips ─────────────────────────────── */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">
              {orgs.length === 0 ? "Sin resultados" : `${orgs.length} resultado${orgs.length !== 1 ? "s" : ""}`}
            </span>
            {filters.q     && <span className="text-xs bg-foreground text-background px-3 py-1 rounded-full font-medium">"{filters.q}"</span>}
            {filters.rubro && <span className="text-xs bg-foreground text-background px-3 py-1 rounded-full font-medium">{filters.rubro}</span>}
            {filters.city  && <span className="text-xs bg-foreground text-background px-3 py-1 rounded-full font-medium">{filters.city}</span>}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="text-xs bg-foreground text-background px-3 py-1 rounded-full font-medium">
                ${(filters.minPrice ?? 0).toLocaleString("es-AR")}–${(filters.maxPrice ?? maxServicePrice).toLocaleString("es-AR")}
              </span>
            )}
          </div>
        )}

        {orgs.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-6xl mb-5">🔍</div>
            <p className="text-xl font-semibold mb-2">Sin resultados</p>
            <p className="text-sm text-muted-foreground mb-6">Probá con otros términos o quitá algunos filtros.</p>
            <Link href="/explorar" className="inline-flex items-center gap-1.5 text-sm font-medium bg-foreground text-background px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              Ver todos los negocios
            </Link>
          </div>
        ) : (
          <>
            {/* Destacados (Pro) */}
            {featuredOrgs.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Destacados</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featuredOrgs.map((org) => <BusinessCard key={org.id} org={org} showMatch={showMatch} />)}
                </div>
              </section>
            )}

            {/* Regular results */}
            <section>
              {!hasFilters && featuredOrgs.length > 0 && (
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
                  Todos los negocios
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {(hasFilters ? orgs : regularOrgs).map((org) => (
                  <BusinessCard key={org.id} org={org} showMatch={showMatch} />
                ))}
              </div>
            </section>

            {/* Rubro quick-links (sin filtros activos) */}
            {!hasFilters && rubroCounts.size > 1 && (
              <section className="border-t pt-10">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
                  Explorar por rubro
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from(rubroCounts.entries()).sort((a, b) => b[1] - a[1]).map(([r, count]) => {
                    const cfg = getRubroConfig(r);
                    return (
                      <Link key={r} href={`/explorar?rubro=${encodeURIComponent(r)}`}
                        className="flex items-center gap-3 bg-white border border-border/60 rounded-2xl px-4 py-3 hover:shadow-md hover:border-primary/30 transition-all group">
                        <span className="text-xl">{cfg.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{r}</p>
                          <p className="text-xs text-muted-foreground">{count} {count === 1 ? "negocio" : "negocios"}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
