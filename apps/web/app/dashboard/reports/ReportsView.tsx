"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { ReportBooking } from "./page";

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n);
}

type Staff = { id: string; name: string };
type Service = { id: string; name: string; color: string };

export default function ReportsView({
  bookings,
  staffMembers,
  services,
  period,
}: {
  bookings: ReportBooking[];
  staffMembers: Staff[];
  services: Service[];
  period: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const nonCancelled = bookings.filter((b) => b.status !== "cancelled");
  const completed    = bookings.filter((b) => b.status === "completed");
  const noShows      = bookings.filter((b) => b.status === "no_show");
  const confirmed    = bookings.filter((b) => b.status === "confirmed");

  const totalRevenue = completed.reduce((sum, b) => sum + (b.services?.price ?? 0), 0);
  const projectedRevenue = [...completed, ...confirmed].reduce((sum, b) => sum + (b.services?.price ?? 0), 0);
  const noShowRate = nonCancelled.length > 0 ? Math.round((noShows.length / nonCancelled.length) * 100) : 0;

  // Revenue by service
  const byService = services.map((s) => {
    const sBookings = completed.filter((b) => b.services?.id === s.id);
    return { ...s, count: sBookings.length, revenue: sBookings.reduce((sum, b) => sum + (b.services?.price ?? 0), 0) };
  }).sort((a, b) => b.revenue - a.revenue);

  // Revenue by staff
  const byStaff = staffMembers.map((s) => {
    const sBookings = completed.filter((b) => b.staff?.id === s.id);
    return { ...s, count: sBookings.length, revenue: sBookings.reduce((sum, b) => sum + (b.services?.price ?? 0), 0) };
  }).sort((a, b) => b.revenue - a.revenue);

  // No-show by day of week
  const noShowByDow: Record<number, number> = {};
  for (const b of noShows) {
    const dow = new Date(b.starts_at).getUTCDay();
    noShowByDow[dow] = (noShowByDow[dow] ?? 0) + 1;
  }

  // Daily bookings for the period (bar chart)
  const dailyMap: Record<string, number> = {};
  for (const b of nonCancelled) {
    const day = b.starts_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + 1;
  }
  const dailyEntries = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v), 1);

  const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  function exportCsv() {
    const headers = ["Servicio", "Turnos completados", "Ingresos"];
    const rows = byService.map((s) => [s.name, s.count, formatPrice(s.revenue)]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `reporte-ingresos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {[
          { value: "week", label: "Esta semana" },
          { value: "month", label: "Este mes" },
          { value: "year", label: "Este año" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => startTransition(() => router.push(`${pathname}?period=${value}`))}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === value
                ? "bg-primary text-primary-foreground"
                : "bg-background border hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Turnos totales", value: nonCancelled.length },
          { label: "Ingresos realizados", value: formatPrice(totalRevenue) },
          { label: "Ingresos proyectados", value: formatPrice(projectedRevenue) },
          { label: "Tasa de no-shows", value: `${noShowRate}%`, danger: noShowRate > 10 },
        ].map(({ label, value, danger }) => (
          <div key={label} className="bg-background border rounded-xl p-4">
            <div className={`text-2xl font-bold ${danger ? "text-destructive" : ""}`}>{value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily chart */}
        <div className="bg-background border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Turnos por día</h2>
          {dailyEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos para el período.</p>
          ) : (
            <div className="flex items-end gap-1 h-32 overflow-x-auto">
              {dailyEntries.map(([day, count]) => (
                <div key={day} className="flex flex-col items-center gap-1 min-w-[20px]" title={`${day}: ${count}`}>
                  <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                    <div
                      className="w-full bg-primary/70 rounded-sm"
                      style={{ height: `${(count / maxDaily) * 96}px`, minHeight: "4px" }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground rotate-45 origin-left">
                    {day.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* No-show by day of week */}
        <div className="bg-background border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">No-shows por día de semana</h2>
          <div className="space-y-2">
            {DAYS.map((day, dow) => {
              const count = noShowByDow[dow] ?? 0;
              const maxNs = Math.max(...Object.values(noShowByDow), 1);
              return (
                <div key={day} className="flex items-center gap-3 text-sm">
                  <span className="w-8 text-muted-foreground text-xs">{day}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-destructive/60 h-2 rounded-full"
                      style={{ width: `${(count / maxNs) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By service */}
        <div className="bg-background border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Ingresos por servicio</h2>
            <button onClick={exportCsv} className="text-xs text-primary hover:underline">CSV</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30 text-muted-foreground">
              <th className="text-left px-5 py-2.5 font-medium">Servicio</th>
              <th className="text-right px-5 py-2.5 font-medium">Turnos</th>
              <th className="text-right px-5 py-2.5 font-medium">Ingresos</th>
            </tr></thead>
            <tbody>
              {byService.filter((s) => s.count > 0).map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{s.count}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatPrice(s.revenue)}</td>
                </tr>
              ))}
              {byService.every((s) => s.count === 0) && (
                <tr><td colSpan={3} className="text-center py-8 text-muted-foreground text-sm">Sin datos.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* By staff */}
        <div className="bg-background border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-sm">Ingresos por profesional</h2>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30 text-muted-foreground">
              <th className="text-left px-5 py-2.5 font-medium">Profesional</th>
              <th className="text-right px-5 py-2.5 font-medium">Turnos</th>
              <th className="text-right px-5 py-2.5 font-medium">Ingresos</th>
            </tr></thead>
            <tbody>
              {byStaff.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {s.name.charAt(0)}
                      </div>
                      {s.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{s.count}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatPrice(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
