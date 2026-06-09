"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { RUBROS } from "@/lib/rubros";

interface Props {
  cities: string[];
}

export default function ExplorarFilters({ cities }: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const params      = useSearchParams();
  const [, startT]  = useTransition();

  const q      = params.get("q") ?? "";
  const rubro  = params.get("rubro") ?? "";
  const city   = params.get("city") ?? "";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // reset pagination
    startT(() => router.push(`${pathname}?${next.toString()}`));
  }

  const hasFilters = q || rubro || city;

  function clearAll() {
    startT(() => router.push(pathname));
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Text search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar negocio..."
          defaultValue={q}
          onChange={(e) => update("q", e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        />
      </div>

      {/* Rubro filter */}
      <select
        value={rubro}
        onChange={(e) => update("rubro", e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
      >
        <option value="">Todos los rubros</option>
        {RUBROS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {/* City filter */}
      {cities.length > 0 && (
        <select
          value={city}
          onChange={(e) => update("city", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Limpiar
        </button>
      )}
    </div>
  );
}
