"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { RUBROS } from "@/lib/rubros";

interface Props {
  q: string;
  rubro: string;
  active: string | undefined;
  listed: string | undefined;
}

export default function AdminOrgFilters({ q, rubro, active, listed }: Props) {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();
  const [, startT] = useTransition();

  function update(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startT(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {/* Text search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          onChange={(e) => update("q", e.target.value || undefined)}
          className="pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background w-56"
        />
      </div>

      {/* Rubro filter */}
      <select
        value={rubro}
        onChange={(e) => update("rubro", e.target.value || undefined)}
        className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos los rubros</option>
        {RUBROS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>

      {/* Active filter */}
      <div className="flex items-center border rounded-lg overflow-hidden">
        {([
          { label: "Todos",       value: undefined  },
          { label: "Activos",     value: "true"     },
          { label: "Suspendidos", value: "false"    },
        ] as { label: string; value: string | undefined }[]).map(({ label, value }) => (
          <button
            key={label}
            onClick={() => update("active", value)}
            className={`px-3 py-2 text-sm transition-colors ${
              active === value
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Listed filter */}
      <div className="flex items-center border rounded-lg overflow-hidden">
        {([
          { label: "Directorio: todos", value: undefined },
          { label: "Visibles",          value: "true"   },
          { label: "Ocultos",           value: "false"  },
        ] as { label: string; value: string | undefined }[]).map(({ label, value }) => (
          <button
            key={label}
            onClick={() => update("listed", value)}
            className={`px-3 py-2 text-sm transition-colors ${
              listed === value
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
