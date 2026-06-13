"use client";
import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Calendar, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "../store";

function buildGoogleCalendarUrl(startsAt: string, endsAt: string, title: string, description: string) {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(".000", "");
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(s)}/${fmt(e)}`,
    details: description,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export type StoredBooking = {
  token: string;
  manageUrl: string;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  staffName: string;
};

function saveBookingToLocalStorage(slug: string, entry: StoredBooking) {
  try {
    const key = `reunio:bookings:${slug}`;
    const existing: StoredBooking[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    // Avoid duplicates by token
    const deduped = existing.filter((b) => b.token !== entry.token);
    localStorage.setItem(key, JSON.stringify([entry, ...deduped].slice(0, 10)));
  } catch { /* localStorage not available */ }
}

export default function Step6Success({ slug }: { slug: string }) {
  const { service, selectedSlot, manageUrl, reset } = useBookingStore();

  // Persist booking to localStorage so the public page can show it
  useEffect(() => {
    if (manageUrl && service && selectedSlot) {
      const token = manageUrl.split("/booking/manage/")[1] ?? "";
      saveBookingToLocalStorage(slug, {
        token,
        manageUrl,
        startsAt:    selectedSlot.startsAt,
        endsAt:      selectedSlot.endsAt,
        serviceName: service.name,
        staffName:   selectedSlot.staffName ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calendarUrl =
    service && selectedSlot
      ? buildGoogleCalendarUrl(
          selectedSlot.startsAt,
          selectedSlot.endsAt,
          service.name,
          `Turno con ${selectedSlot.staffName}`
        )
      : null;

  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold mb-2">¡Turno confirmado!</h2>
      <p className="text-muted-foreground mb-2">
        Tu turno fue registrado correctamente.
      </p>

      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2 mb-8">
        <MessageCircle className="w-4 h-4" />
        <span>Vas a recibir la confirmación por WhatsApp en breve.</span>
      </div>

      <div className="w-full space-y-3">
        {calendarUrl && (
          <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button variant="outline" className="w-full gap-2">
              <Calendar className="w-4 h-4" />
              Agregar a Google Calendar
            </Button>
          </a>
        )}

        {manageUrl && (
          <a href={manageUrl} className="block">
            <Button variant="outline" className="w-full gap-2 text-muted-foreground">
              <XCircle className="w-4 h-4" />
              Ver o cancelar mi turno
            </Button>
          </a>
        )}

        <Link href={`/${slug}`} onClick={reset}>
          <Button variant="ghost" className="w-full">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
