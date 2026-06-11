"use client";
import { useState, useEffect, useRef } from "react";
import { format, addDays, startOfToday, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingStore, type SlotOption } from "../store";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Tailwind bg classes for the staff color dot — must be complete strings for Tailwind to include them
const STAFF_COLORS = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-cyan-500",
];

function buildStaffColorMap(slots: SlotOption[]): Map<string, string> {
  const map = new Map<string, string>();
  slots.forEach((s) => {
    if (!map.has(s.staffId)) {
      map.set(s.staffId, STAFF_COLORS[map.size % STAFF_COLORS.length]);
    }
  });
  return map;
}

function formatHour(isoStr: string, timezone: string) {
  return new Date(isoStr).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: timezone,
  });
}

export default function Step3DateTime({ organizationId, timezone }: { organizationId: string; timezone: string }) {
  const { service, staff, selectedDate, setSelectedDate, setSelectedSlot, setStep } = useBookingStore();

  const today = startOfToday();
  const [weekStart, setWeekStart] = useState(today);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchIdRef = useRef(0);

  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch slots when date changes.
  // Use a generation counter to discard results from stale fetches — even if a previous
  // request completed just before cleanup ran, its .then() will see a stale fetchId and bail.
  useEffect(() => {
    if (!selectedDate || !service) return;

    fetchIdRef.current += 1;
    const myFetchId = fetchIdRef.current;

    setSlots([]);
    setLoading(true);

    const params = new URLSearchParams({
      organizationId,
      serviceId: service.id,
      date: selectedDate,
    });
    if (staff) params.set("staffId", staff.id);

    fetch(`/api/availability?${params}`)
      .then((res) => res.ok ? res.json() : { slots: [] })
      .then((data: { slots: { staffId: string; staffName: string; startsAt: string; endsAt: string; available: boolean }[] }) => {
        if (fetchIdRef.current !== myFetchId) return;
        setSlots(data.slots.filter((s) => s.available));
      })
      .catch(() => {
        if (fetchIdRef.current !== myFetchId) return;
        setSlots([]);
      })
      .finally(() => {
        if (fetchIdRef.current !== myFetchId) return;
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  function handleSlotSelect(slot: SlotOption) {
    setSelectedSlot(slot);
    setStep(4);
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => setStep(2)}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
      </Button>

      <h2 className="text-xl font-bold mb-1">Elegí fecha y hora</h2>
      <p className="text-sm text-muted-foreground mb-5">Seleccioná un día y luego el horario que más te convenga.</p>

      {/* Week navigator */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          disabled={weekStart <= today}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium capitalize">
          {format(weekStart, "MMMM yyyy", { locale: es })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart((d) => addDays(d, 7))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {week.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isPast  = day < today;
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              disabled={isPast}
              onClick={() => setSelectedDate(dateStr)}
              className={[
                "flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-colors",
                isPast ? "opacity-30 cursor-not-allowed" : "hover:bg-muted",
                isSelected ? "bg-primary text-primary-foreground hover:bg-primary" : "",
              ].join(" ")}
            >
              <span className="uppercase text-[10px]">{DAY_NAMES[getDay(day)]}</span>
              <span className="text-base mt-0.5">{format(day, "d")}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {!selectedDate ? (
        <p className="text-center text-sm text-muted-foreground py-8">Seleccioná un día para ver los horarios disponibles.</p>
      ) : loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      ) : slots.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No hay horarios disponibles para este día.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(() => {
            const colorMap = buildStaffColorMap(slots);
            const multiStaff = colorMap.size > 1;
            return slots.map((slot) => (
              <Button
                key={`${slot.staffId}-${slot.startsAt}`}
                variant="outline"
                className={`h-auto py-1.5 flex flex-col items-center gap-0 border-l-2 ${multiStaff ? colorMap.get(slot.staffId) : ""}`}
                onClick={() => handleSlotSelect(slot)}
              >
                <span className="text-sm font-medium">{formatHour(slot.startsAt, timezone)}</span>
                {multiStaff && (
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {slot.staffName.split(" ")[0]}
                  </span>
                )}
              </Button>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
