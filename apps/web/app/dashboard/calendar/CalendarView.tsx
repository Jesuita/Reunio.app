"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { BookingRow } from "./page";

type Staff = { id: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 border-blue-300 text-blue-900",
  pending:   "bg-amber-100 border-amber-300 text-amber-900",
  completed: "bg-green-100 border-green-300 text-green-900",
  no_show:   "bg-red-100 border-red-300 text-red-900",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  pending:   "Pendiente",
  completed: "Completado",
  no_show:   "No asistió",
};

const HOUR_START = 8;
const HOUR_END   = 21;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 80;

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function dateOffset(dateStr: string, delta: number) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function isoToMinutes(isoStr: string) {
  const d = new Date(isoStr);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const startMin = isoToMinutes(booking.starts_at);
  const endMin   = isoToMinutes(booking.ends_at);
  const topPx    = ((startMin - HOUR_START * 60) / 60) * PX_PER_HOUR;
  const heightPx = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 28);

  const colorClass = STATUS_COLORS[booking.status] ?? STATUS_COLORS.confirmed;

  return (
    <div
      className={`absolute left-1 right-1 rounded border px-2 py-1 overflow-hidden text-xs cursor-default ${colorClass}`}
      style={{ top: topPx, height: heightPx }}
      title={`${booking.clients?.name} — ${booking.services?.name}`}
    >
      <div className="font-semibold truncate">{booking.clients?.name}</div>
      <div className="truncate opacity-75">{booking.services?.name}</div>
    </div>
  );
}

export default function CalendarView({
  date,
  bookings: initialBookings,
  staffMembers,
  orgId,
}: {
  date: string;
  bookings: BookingRow[];
  staffMembers: Staff[];
  orgId: string;
}) {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "error">("connecting");

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`calendar-${orgId}-${date}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          // Re-fetch when any booking changes
          refresh();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("live");
        else if (status === "CHANNEL_ERROR") setRealtimeStatus("error");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, date, refresh]);

  // Keep local state in sync when server data updates
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  const prevDate = dateOffset(date, -1);
  const nextDate = dateOffset(date, +1);

  const displayDate = new Date(date + "T12:00:00Z").toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group bookings by staff_id
  const bookingsByStaff: Record<string, BookingRow[]> = {};
  for (const b of bookings) {
    // For simplicity we match by staff name; production would use staff_id
    const staffName = b.staff?.name ?? "Sin asignar";
    (bookingsByStaff[staffName] ??= []).push(b);
  }

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

  return (
    <div>
      {/* Header / date nav */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push(`/dashboard/calendar?date=${prevDate}`)}
          className="p-2 rounded-lg border hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 text-center">
          <span className="font-semibold capitalize">{displayDate}</span>
        </div>

        <button
          onClick={() => router.push(`/dashboard/calendar?date=${nextDate}`)}
          className="p-2 rounded-lg border hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={refresh}
            className="p-2 rounded-lg border hover:bg-accent transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
            realtimeStatus === "live"
              ? "bg-green-100 text-green-700"
              : realtimeStatus === "error"
              ? "bg-red-100 text-red-700"
              : "bg-muted text-muted-foreground"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              realtimeStatus === "live" ? "bg-green-500" :
              realtimeStatus === "error" ? "bg-red-500" : "bg-muted-foreground"
            }`} />
            {realtimeStatus === "live" ? "En vivo" : realtimeStatus === "error" ? "Error" : "Conectando..."}
          </span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const count = bookings.filter((b) => b.status === status).length;
          return count > 0 ? (
            <span
              key={status}
              className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[status]}`}
            >
              {count} {label}{count !== 1 ? "s" : ""}
            </span>
          ) : null;
        })}
        {bookings.length === 0 && (
          <span className="text-sm text-muted-foreground">Sin turnos para este día</span>
        )}
      </div>

      {/* Grid */}
      <div className="bg-background border rounded-xl overflow-auto">
        <div className="flex" style={{ minWidth: `${staffMembers.length * 180 + 60}px` }}>
          {/* Time column */}
          <div className="w-14 shrink-0 border-r">
            <div className="h-10 border-b" /> {/* header spacer */}
            <div style={{ height: TOTAL_HOURS * PX_PER_HOUR }} className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute w-full pr-2 text-right"
                  style={{ top: ((h - HOUR_START) * PX_PER_HOUR) - 8 }}
                >
                  <span className="text-xs text-muted-foreground">
                    {h < 10 ? `0${h}` : h}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff columns */}
          {staffMembers.map((staff) => (
            <div key={staff.id} className="flex-1 border-r last:border-r-0 min-w-[160px]">
              <div className="h-10 border-b flex items-center justify-center px-2">
                <span className="text-xs font-semibold truncate">{staff.name}</span>
              </div>
              <div
                className="relative"
                style={{ height: TOTAL_HOURS * PX_PER_HOUR }}
              >
                {/* Hour lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-muted/50"
                    style={{ top: (h - HOUR_START) * PX_PER_HOUR }}
                  />
                ))}

                {/* Bookings for this staff member */}
                {(bookingsByStaff[staff.name] ?? []).map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
