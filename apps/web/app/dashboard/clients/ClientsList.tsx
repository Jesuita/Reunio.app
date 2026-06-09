"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, ChevronRight, AlertTriangle } from "lucide-react";
import type { ClientRow } from "./page";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n);
}

export default function ClientsList({
  clients,
  searchQuery,
}: {
  clients: ClientRow[];
  searchQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchQuery);

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // CSV export
  function exportCsv() {
    const headers = ["Nombre", "Teléfono", "Email", "Total turnos", "No-shows", "Gasto total", "Último turno"];
    const rows = clients.map((c) => [
      c.name, c.phone, c.email ?? "",
      c.total, c.noShows,
      formatPrice(c.totalSpent),
      c.lastBooking ? formatDate(c.lastBooking) : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
          />
        </div>
        <button
          onClick={exportCsv}
          className="text-sm border rounded-md px-3 py-2 hover:bg-accent transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      <div className="bg-background border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Teléfono</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Turnos</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">No-shows</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Gasto total</th>
              <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Último turno</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        {c.name}
                        {c.is_blacklisted && (
                          <span title="Bloqueado"><AlertTriangle className="w-3.5 h-3.5 text-destructive" /></span>
                        )}
                      </div>
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {c.tags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.phone}</td>
                <td className="px-4 py-3 hidden lg:table-cell font-medium">{c.total}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {c.noShows > 0 ? (
                    <span className="text-destructive font-medium">{c.noShows}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell font-medium">
                  {c.totalSpent > 0 ? formatPrice(c.totalSpent) : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                  {c.lastBooking ? formatDate(c.lastBooking) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/clients/${c.id}`}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>{searchQuery ? "No se encontraron clientes con esa búsqueda." : "No hay clientes aún."}</p>
          </div>
        )}
      </div>
    </>
  );
}
