"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, X } from "lucide-react";
import type { StoredBooking } from "./booking/components/Step6Success";

interface Props {
  slug: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}

export default function MyBookingsBar({ slug }: Props) {
  const [bookings, setBookings] = useState<StoredBooking[]>([]);

  useEffect(() => {
    try {
      const key = `reunio:bookings:${slug}`;
      const stored: StoredBooking[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      // Only show future bookings
      const now = Date.now();
      const upcoming = stored.filter((b) => new Date(b.startsAt).getTime() > now);
      setBookings(upcoming);
    } catch { /* localStorage not available */ }
  }, [slug]);

  function dismiss(token: string) {
    try {
      const key = `reunio:bookings:${slug}`;
      const stored: StoredBooking[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      const updated = stored.filter((b) => b.token !== token);
      localStorage.setItem(key, JSON.stringify(updated));
      setBookings((prev) => prev.filter((b) => b.token !== token));
    } catch { /* ignore */ }
  }

  if (bookings.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 mt-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
        Tus turnos en este negocio
      </p>
      {bookings.map((b) => (
        <div
          key={b.token}
          className="flex items-center gap-3 bg-white border rounded-2xl px-4 py-3 shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{b.serviceName}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {formatDate(b.startsAt)} · {formatTime(b.startsAt)} hs
              {b.staffName && ` · ${b.staffName}`}
            </p>
          </div>
          <Link
            href={b.manageUrl}
            className="flex items-center gap-0.5 text-xs text-primary font-medium shrink-0 hover:underline"
          >
            Ver <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => dismiss(b.token)}
            className="p-1 rounded-full hover:bg-muted transition-colors shrink-0 text-muted-foreground"
            aria-label="Ocultar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
