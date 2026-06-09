"use client";

/**
 * WeekScheduleEditor
 *
 * Inline day-by-day schedule editor. Each day can have:
 *   - 0 blocks  → day off
 *   - 1 block   → continuous hours (e.g. 9:00–18:00)
 *   - 2 blocks  → split shift (e.g. 9:00–13:00 + 16:00–20:00)
 *
 * Used in both the registration wizard (step 4) and the Settings page.
 */

import { X, Plus } from "lucide-react";

export type ScheduleBlock = { start_time: string; end_time: string };
export type DaySchedule   = ScheduleBlock[];           // empty = day off
export type WeekSchedule  = Record<number, DaySchedule>; // key = day_of_week (0=Sun…6=Sat)

export const DAYS = [
  { value: 1, short: "Lun", long: "Lunes" },
  { value: 2, short: "Mar", long: "Martes" },
  { value: 3, short: "Mié", long: "Miércoles" },
  { value: 4, short: "Jue", long: "Jueves" },
  { value: 5, short: "Vie", long: "Viernes" },
  { value: 6, short: "Sáb", long: "Sábado" },
  { value: 0, short: "Dom", long: "Domingo" },
];

/** Default schedule: Mon–Fri 9:00–18:00, weekends off */
export function defaultWeekSchedule(): WeekSchedule {
  return {
    0: [],
    1: [{ start_time: "09:00", end_time: "18:00" }],
    2: [{ start_time: "09:00", end_time: "18:00" }],
    3: [{ start_time: "09:00", end_time: "18:00" }],
    4: [{ start_time: "09:00", end_time: "18:00" }],
    5: [{ start_time: "09:00", end_time: "18:00" }],
    6: [],
  };
}

type Props = {
  value:    WeekSchedule;
  onChange: (next: WeekSchedule) => void;
  /** Error string to show below the grid */
  error?:   string;
};

export default function WeekScheduleEditor({ value, onChange, error }: Props) {
  function setDay(day: number, blocks: DaySchedule) {
    onChange({ ...value, [day]: blocks });
  }

  function toggleDay(day: number) {
    const current = value[day] ?? [];
    if (current.length > 0) {
      setDay(day, []);
    } else {
      setDay(day, [{ start_time: "09:00", end_time: "18:00" }]);
    }
  }

  function setBlock(day: number, idx: number, field: keyof ScheduleBlock, val: string) {
    const blocks = [...(value[day] ?? [])];
    blocks[idx] = { ...blocks[idx]!, [field]: val };
    setDay(day, blocks);
  }

  function addBlock(day: number) {
    const blocks = value[day] ?? [];
    const lastEnd = blocks[blocks.length - 1]?.end_time ?? "13:00";
    const [h = 13] = lastEnd.split(":").map(Number);
    const startH = Math.min(h + 2, 22);
    const endH   = Math.min(startH + 4, 23);
    setDay(day, [
      ...blocks,
      {
        start_time: `${String(startH).padStart(2, "0")}:00`,
        end_time:   `${String(endH).padStart(2, "0")}:00`,
      },
    ]);
  }

  function removeBlock(day: number, idx: number) {
    const blocks = (value[day] ?? []).filter((_, i) => i !== idx);
    setDay(day, blocks);
  }

  return (
    <div className="space-y-1">
      {DAYS.map((day) => {
        const blocks  = value[day.value] ?? [];
        const isOn    = blocks.length > 0;

        return (
          <div
            key={day.value}
            className={`rounded-lg border transition-colors ${
              isOn ? "bg-background border-border" : "bg-muted/20 border-dashed border-muted-foreground/20"
            }`}
          >
            <div className="flex items-start gap-3 px-3 py-2.5">
              {/* Day toggle */}
              <button
                type="button"
                onClick={() => toggleDay(day.value)}
                className="flex items-center gap-2 shrink-0 mt-0.5"
                title={isOn ? "Marcar como día libre" : "Activar este día"}
              >
                <span
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isOn
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/40 bg-background"
                  }`}
                >
                  {isOn && <span className="text-primary-foreground text-[9px] font-bold leading-none">✓</span>}
                </span>
                <span className={`text-sm font-medium w-8 ${isOn ? "text-foreground" : "text-muted-foreground"}`}>
                  {day.short}
                </span>
              </button>

              {/* Time blocks */}
              {isOn ? (
                <div className="flex-1 space-y-2">
                  {blocks.map((block, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-wrap">
                      {blocks.length > 1 && (
                        <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">
                          {idx === 0 ? "Mañana" : "Tarde"}
                        </span>
                      )}
                      <input
                        type="time"
                        value={block.start_time}
                        onChange={(e) => setBlock(day.value, idx, "start_time", e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-[6.5rem] focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-muted-foreground text-sm">—</span>
                      <input
                        type="time"
                        value={block.end_time}
                        onChange={(e) => setBlock(day.value, idx, "end_time", e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-[6.5rem] focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      {blocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBlock(day.value, idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                          title="Quitar este bloque"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {blocks.length < 2 && (
                    <button
                      type="button"
                      onClick={() => addBlock(day.value)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar turno tarde
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground mt-0.5 italic">Día libre</span>
              )}
            </div>
          </div>
        );
      })}

      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}

      <p className="text-xs text-muted-foreground pt-1">
        Hacé clic en el nombre del día para activarlo o desactivarlo.
      </p>
    </div>
  );
}
