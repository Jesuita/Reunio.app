"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  X, ChevronRight, Calendar, Clock, User, Scissors,
  CreditCard, Globe, MessageCircle, CheckCircle2, XCircle, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingRow } from "./page";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmado",  color: "bg-green-100 text-green-700" },
  pending:   { label: "Pendiente",   color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completado",  color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelado",   color: "bg-red-100 text-red-700" },
  no_show:   { label: "No asistió",  color: "bg-gray-100 text-gray-600" },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  paid:    { label: "Pagado",    color: "bg-green-100 text-green-700" },
  unpaid:  { label: "Sin pagar", color: "bg-muted text-muted-foreground" },
  partial: { label: "Parcial",   color: "bg-amber-100 text-amber-700" },
  refunded:{ label: "Devuelto",  color: "bg-purple-100 text-purple-700" },
};

const SOURCE_ICON: Record<string, React.ReactNode> = {
  web:       <Globe className="w-3 h-3" />,
  whatsapp:  <MessageCircle className="w-3 h-3" />,
  admin:     <User className="w-3 h-3" />,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

function isPastBooking(b: BookingRow) {
  return new Date(b.ends_at) < new Date();
}

// ── Booking Detail Panel ──────────────────────────────────────────────────────
function BookingPanel({
  booking,
  onClose,
  onStatusChange,
}: {
  booking: BookingRow;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function callAction(action: "cancel" | "complete" | "no_show") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al actualizar");
      }
      const statusMap = { cancel: "cancelled", complete: "completed", no_show: "no_show" };
      onStatusChange(booking.id, statusMap[action]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(null);
    }
  }

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
  const payment = PAYMENT_CONFIG[booking.payment_status] ?? PAYMENT_CONFIG.unpaid;
  const past = isPastBooking(booking);
  const isCancellable = (booking.status === "confirmed" || booking.status === "pending") && !past;
  const needsAttendance = booking.status === "confirmed" && past;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-xl z-40 flex flex-col">
      <div className="flex items-center justify-between p-5 border-b">
        <h2 className="font-semibold">Detalle del turno</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-accent rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Status badges */}
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${payment.color}`}>{payment.label}</span>
          {booking.source && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground flex items-center gap-1">
              {SOURCE_ICON[booking.source]}
              {booking.source}
            </span>
          )}
        </div>

        {/* Attendance prompt for past confirmed bookings */}
        {needsAttendance && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-900">¿El cliente se presentó?</p>
            <p className="text-xs text-amber-700">
              Este turno ya pasó. Marcá si el cliente asistió para mantener el historial al día.
            </p>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                onClick={() => callAction("complete")}
                disabled={loading !== null}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {loading === "complete" ? "Guardando…" : "Sí, vino"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                onClick={() => callAction("no_show")}
                disabled={loading !== null}
              >
                <XCircle className="w-3.5 h-3.5" />
                {loading === "no_show" ? "Guardando…" : "No vino"}
              </Button>
            </div>
          </div>
        )}

        {/* Main info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: booking.services?.color ?? "#3B82F6" }}
            />
            <div>
              <p className="font-semibold">{booking.services?.name}</p>
              <p className="text-sm text-muted-foreground">con {booking.staff?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              {formatDate(booking.starts_at)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              {formatTime(booking.starts_at)} — {formatTime(booking.ends_at)}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 shrink-0" />
              {booking.clients?.name}
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 shrink-0" />
              {booking.services?.price
                ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(booking.services.price)
                : "—"}
            </div>
          </div>

          {booking.clients?.phone && (
            <div className="text-sm text-muted-foreground">
              📞 {booking.clients.phone}
            </div>
          )}

          {booking.notes && (
            <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
              📝 {booking.notes}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Creado {new Date(booking.created_at).toLocaleDateString("es-AR")}
        </div>
      </div>

      {/* Actions footer */}
      {isCancellable && (
        <div className="p-5 border-t space-y-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/5"
            onClick={() => callAction("cancel")}
            disabled={loading !== null}
          >
            {loading === "cancel" ? "Cancelando..." : "Cancelar turno"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Attendance Banner ─────────────────────────────────────────────────────────
function AttendanceBanner({
  count,
  onFilter,
  onDismiss,
}: {
  count: number;
  onFilter: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
      <Bell className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900">
          {count === 1
            ? "Hay 1 turno que necesita que confirmes si el cliente asistió."
            : `Hay ${count} turnos que necesitan que confirmes si los clientes asistieron.`}
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Mantener el historial al día te ayuda a ver métricas reales de no-shows.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onFilter}
          className="text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900 transition-colors"
        >
          Ver ahora
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-amber-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5 text-amber-600" />
        </button>
      </div>
    </div>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────
type Filters = {
  status?: string;
  staffId?: string;
  serviceId?: string;
  from?: string;
  to?: string;
  source?: string;
};

function FiltersBar({
  staffMembers,
  services,
  current,
}: {
  staffMembers: { id: string; name: string }[];
  services: { id: string; name: string }[];
  current: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(current as Record<string, string>);
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function clearAll() {
    startTransition(() => router.push(pathname));
  }

  const hasFilters = Object.values(current).some(Boolean);

  return (
    <div className="flex gap-2 flex-wrap items-center mb-4">
      <select
        value={current.status ?? ""}
        onChange={(e) => applyFilter("status", e.target.value)}
        className="text-sm border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>

      <select
        value={current.staffId ?? ""}
        onChange={(e) => applyFilter("staffId", e.target.value)}
        className="text-sm border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todo el personal</option>
        {staffMembers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <select
        value={current.serviceId ?? ""}
        onChange={(e) => applyFilter("serviceId", e.target.value)}
        className="text-sm border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos los servicios</option>
        {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <select
        value={current.source ?? ""}
        onChange={(e) => applyFilter("source", e.target.value)}
        className="text-sm border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos los canales</option>
        <option value="web">Web</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="admin">Admin</option>
      </select>

      <input
        type="date"
        value={current.from ?? ""}
        onChange={(e) => applyFilter("from", e.target.value)}
        className="text-sm border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        title="Desde"
      />
      <input
        type="date"
        value={current.to ?? ""}
        onChange={(e) => applyFilter("to", e.target.value)}
        className="text-sm border rounded-md px-2.5 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        title="Hasta"
      />

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1.5 rounded hover:bg-accent transition-colors"
        >
          <X className="w-3 h-3" /> Limpiar filtros
        </button>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BookingsList({
  bookings: initialBookings,
  staffMembers,
  services,
  currentFilters,
}: {
  bookings: BookingRow[];
  staffMembers: { id: string; name: string }[];
  services: { id: string; name: string }[];
  currentFilters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [bookings, setBookings] = useState(initialBookings);
  const [selected, setSelected] = useState<BookingRow | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Bookings that have passed but are still "confirmed" — need attendance marking
  const pendingAttendance = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" && isPastBooking(b)),
    [bookings],
  );

  function handleStatusChange(id: string, newStatus: string) {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
    setSelected((prev) => prev?.id === id ? { ...prev, status: newStatus } : prev);
  }

  function filterToPendingAttendance() {
    // Filter list to show only confirmed past bookings
    const params = new URLSearchParams({ status: "confirmed" });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
    setBannerDismissed(true);
  }

  // CSV export
  function exportCsv() {
    const headers = ["Fecha", "Hora", "Cliente", "Teléfono", "Servicio", "Personal", "Estado", "Pago", "Canal"];
    const rows = bookings.map((b) => [
      formatDate(b.starts_at),
      formatTime(b.starts_at),
      b.clients?.name ?? "",
      b.clients?.phone ?? "",
      b.services?.name ?? "",
      b.staff?.name ?? "",
      STATUS_CONFIG[b.status]?.label ?? b.status,
      PAYMENT_CONFIG[b.payment_status]?.label ?? b.payment_status,
      b.source ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `turnos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <>
      {/* Attendance banner */}
      {!bannerDismissed && pendingAttendance.length > 0 && (
        <AttendanceBanner
          count={pendingAttendance.length}
          onFilter={filterToPendingAttendance}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <FiltersBar staffMembers={staffMembers} services={services} current={currentFilters} />
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <div className="bg-background border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Fecha y hora</th>
              <th className="text-left px-4 py-3 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Servicio</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Personal</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Pago</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const status = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.confirmed;
              const needsBadge = b.status === "confirmed" && isPastBooking(b);
              return (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium">{formatDate(b.starts_at)}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(b.starts_at)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.clients?.name}</div>
                    <div className="text-xs text-muted-foreground">{b.clients?.phone}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.services?.color }} />
                      {b.services?.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{b.staff?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {needsBadge && (
                      <span className="ml-1.5 text-xs text-amber-600 font-medium">· pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PAYMENT_CONFIG[b.payment_status]?.color ?? ""}`}>
                      {PAYMENT_CONFIG[b.payment_status]?.label ?? b.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {bookings.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p>No hay turnos que coincidan con los filtros.</p>
          </div>
        )}
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setSelected(null)} />
          <BookingPanel
            booking={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
          />
        </>
      )}
    </>
  );
}
