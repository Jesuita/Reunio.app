"use client";
import { useState, useEffect, useTransition } from "react";
import { format, addDays, startOfToday, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingStore, type SlotOption } from "../store";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatHour(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
}

export default function Step3DateTime({ organizationId }: { organizationId: string }) {
  const { service, staff, selectedDate, setSelectedDate, setSelectedSlot, setStep } = useBookingStore();

  const today = startOfToday();
  const [weekStart, setWeekStart] = useState(today);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loading, startTransition] = useTransition();

  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate || !service) return;
    startTransition(async () => {
      const params = new URLSearchParams({
        organizationId,
        serviceId: service.id,
        date: selectedDate,
      });
      if (staff) params.set("staffId", staff.id);
      const res = await fetch(`/api/availability?${params}`);
      if (!res.ok) { setSlots([]); return; }
      const data = await res.json() as { slots: { staffId: string; staffName: string; startsAt: string; endsAt: string; available: boolean }[] };
      setSlots(data.slots.filter((s) => s.available));
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
          {slots.map((slot) => (
            <Button
              key={slot.startsAt}
              variant="outline"
              className="h-10"
              onClick={() => handleSlotSelect(slot)}
            >
              {formatHour(slot.startsAt)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
