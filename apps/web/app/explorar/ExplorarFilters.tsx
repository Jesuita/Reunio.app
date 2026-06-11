"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useRef, useEffect } from "react";
import { Search, X, MapPin, ChevronDown, SlidersHorizontal, ArrowUpDown } from "lucide-react";

interface Props {
  cities: string[];
  rubros: string[];
  rubroCounts: Map<string, number>;
  maxServicePrice: number;
}

const RUBRO_EMOJI: Record<string, string> = {
  "Barbería": "💈", "Peluquería": "✂️", "Salón de belleza": "💅",
  "Spa / Masajes": "🧖", "Tatuajes / Piercings": "🪡", "Medicina / Salud": "🩺",
  "Odontología": "🦷", "Nutrición": "🥗", "Psicología": "🧠",
  "Entrenamiento personal": "🏋️", "Yoga / Pilates": "🧘", "Veterinaria": "🐾",
  "Fotografía": "📷", "Consultoría": "💼", "Educación / Clases": "📚",
  "Estética / Salón de belleza": "💅", "Otros servicios": "🔧",
};

const SORT_OPTIONS = [
  { value: "relevance",  label: "Más relevantes" },
  { value: "price_asc",  label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "name",       label: "Nombre A–Z" },
] as const;

function Dropdown({ trigger, children, open, onToggle }: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      {trigger}
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-border rounded-2xl shadow-xl z-30 min-w-[200px] py-1">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ExplorarFilters({ cities, rubros, rubroCounts, maxServicePrice }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [, startT] = useTransition();

  const [cityOpen,   setCityOpen]   = useState(false);
  const [sortOpen,   setSortOpen]   = useState(false);
  const [priceOpen,  setPriceOpen]  = useState(false);
  const [searchVal,  setSearchVal]  = useState(params.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q        = params.get("q") ?? "";
  const rubro    = params.get("rubro") ?? "";
  const city     = params.get("city") ?? "";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const sort     = params.get("sort") ?? "relevance";

  function update(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    next.delete("page");
    startT(() => router.push(`${pathname}?${next.toString()}`));
  }

  function handleSearchChange(val: string) {
    setSearchVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: val }), 350);
  }

  const activeRubros = rubros.filter((r) => (rubroCounts.get(r) ?? 0) > 0);
  const hasFilters   = q || rubro || city || minPrice || maxPrice || (sort && sort !== "relevance");
  const sortLabel    = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Ordenar";
  const priceLabel   = minPrice || maxPrice
    ? `$${(+minPrice || 0).toLocaleString("es-AR")}–$${(+maxPrice || maxServicePrice).toLocaleString("es-AR")}`
    : "Precio";
  const hasPriceFilter = !!(minPrice || maxPrice);

  return (
    <div className="space-y-4">

      {/* ── Row 1: search + city + sort ──────────────────────── */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Negocio, servicio, profesional, rubro…"
            value={searchVal}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white shadow-sm"
          />
          {searchVal && (
            <button onClick={() => { setSearchVal(""); update({ q: "" }); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* City */}
        {cities.length > 0 && (
          <Dropdown
            open={cityOpen}
            onToggle={() => setCityOpen((v) => !v)}
            trigger={
              <button
                onClick={() => { setCityOpen((v) => !v); setSortOpen(false); setPriceOpen(false); }}
                className={`flex items-center gap-2 px-4 py-3 border rounded-2xl text-sm bg-white shadow-sm hover:border-foreground/30 transition-colors whitespace-nowrap ${city ? "border-primary text-primary font-medium" : "text-muted-foreground"}`}
              >
                <MapPin className="w-3.5 h-3.5" />
                {city || "Ciudad"}
                <ChevronDown className={`w-3 h-3 transition-transform ${cityOpen ? "rotate-180" : ""}`} />
              </button>
            }
          >
            <button onClick={() => { update({ city: "" }); setCityOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors ${!city ? "font-medium" : "text-muted-foreground"}`}>
              Todas las ciudades
            </button>
            {cities.map((c) => (
              <button key={c} onClick={() => { update({ city: c }); setCityOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors ${city === c ? "font-medium text-primary" : "text-muted-foreground"}`}>
                {c}
              </button>
            ))}
          </Dropdown>
        )}

        {/* Price range */}
        <Dropdown
          open={priceOpen}
          onToggle={() => setPriceOpen((v) => !v)}
          trigger={
            <button
              onClick={() => { setPriceOpen((v) => !v); setCityOpen(false); setSortOpen(false); }}
              className={`flex items-center gap-2 px-4 py-3 border rounded-2xl text-sm bg-white shadow-sm hover:border-foreground/30 transition-colors whitespace-nowrap ${hasPriceFilter ? "border-primary text-primary font-medium" : "text-muted-foreground"}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {priceLabel}
              <ChevronDown className={`w-3 h-3 transition-transform ${priceOpen ? "rotate-180" : ""}`} />
            </button>
          }
        >
          <div className="px-4 py-3 w-64 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rango de precios</p>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Mínimo</label>
                <input type="number" placeholder="0" defaultValue={minPrice}
                  min={0} max={maxServicePrice} step={500}
                  onBlur={(e) => update({ minPrice: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && update({ minPrice: (e.target as HTMLInputElement).value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <span className="text-muted-foreground mt-4">—</span>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Máximo</label>
                <input type="number" placeholder={String(maxServicePrice)} defaultValue={maxPrice}
                  min={0} max={maxServicePrice * 2} step={500}
                  onBlur={(e) => update({ maxPrice: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && update({ maxPrice: (e.target as HTMLInputElement).value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            {hasPriceFilter && (
              <button onClick={() => { update({ minPrice: "", maxPrice: "" }); setPriceOpen(false); }}
                className="text-xs text-muted-foreground hover:text-foreground underline">
                Quitar filtro de precio
              </button>
            )}
          </div>
        </Dropdown>

        {/* Sort */}
        <Dropdown
          open={sortOpen}
          onToggle={() => setSortOpen((v) => !v)}
          trigger={
            <button
              onClick={() => { setSortOpen((v) => !v); setCityOpen(false); setPriceOpen(false); }}
              className={`flex items-center gap-2 px-4 py-3 border rounded-2xl text-sm bg-white shadow-sm hover:border-foreground/30 transition-colors whitespace-nowrap ${sort !== "relevance" ? "border-primary text-primary font-medium" : "text-muted-foreground"}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sort !== "relevance" ? sortLabel : "Ordenar"}
              <ChevronDown className={`w-3 h-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
          }
        >
          {SORT_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => { update({ sort: o.value }); setSortOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors ${sort === o.value ? "font-medium text-primary" : "text-muted-foreground"}`}>
              {o.label}
            </button>
          ))}
        </Dropdown>

        {/* Clear all */}
        {hasFilters && (
          <button onClick={() => { setSearchVal(""); startT(() => router.push(pathname)); }}
            className="flex items-center gap-1.5 px-4 py-3 border rounded-2xl text-sm text-muted-foreground hover:text-foreground bg-white shadow-sm transition-colors whitespace-nowrap">
            <X className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* ── Row 2: rubro pills ────────────────────────────────── */}
      {activeRubros.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => update({ rubro: "" })}
            className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              !rubro ? "bg-foreground text-background border-foreground" : "bg-white text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {activeRubros.map((r) => {
            const count  = rubroCounts.get(r) ?? 0;
            const active = rubro === r;
            return (
              <button key={r} onClick={() => update({ rubro: active ? "" : r })}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  active ? "bg-foreground text-background border-foreground" : "bg-white text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                <span>{RUBRO_EMOJI[r] ?? "🔧"}</span>
                {r}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-normal ${active ? "bg-white/20 text-background" : "bg-muted text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
