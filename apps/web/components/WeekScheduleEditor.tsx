"use client";

import { Plus, X } from "lucide-react";

export type ScheduleBlock = { start_time: string; end_time: string };
export type DaySchedule   = ScheduleBlock[];
export type WeekSchedule  = Record<number, DaySchedule>;

export const DAYS = [
  { value: 1, short: "Lun", long: "Lunes" },
  { value: 2, short: "Mar", long: "Martes" },
  { value: 3, short: "Mié", long: "Miércoles" },
  { value: 4, short: "Jue", long: "Jueves" },
  { value: 5, short: "Vie", long: "Viernes" },
  { value: 6, short: "Sáb", long: "Sábado" },
  { value: 0, short: "Dom", long: "Domingo" },
];

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
  error?:   string;
};

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-[5.5rem] border rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring bg-background"
    />
  );
}

export default function WeekScheduleEditor({ value, onChange, error }: Props) {
  function setDay(day: number, blocks: DaySchedule) {
    onChange({ ...value, [day]: blocks });
  }

  function toggleDay(day: number) {
    const current = value[day] ?? [];
    setDay(day, current.length > 0 ? [] : [{ start_time: "09:00", end_time: "18:00" }]);
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
    const startH = Math.min(h + 1, 22);
    const endH   = Math.min(startH + 3, 23);
    setDay(day, [
      ...blocks,
      {
        start_time: `${String(startH).padStart(2, "0")}:00`,
        end_time:   `${String(endH).padStart(2, "0")}:00`,
      },
    ]);
  }

  function removeBlock(day: number, idx: number) {
    setDay(day, (value[day] ?? []).filter((_, i) => i !== idx));
  }

  return (
    <div className="rounded-xl border overflow-hidden divide-y">
      {DAYS.map((day) => {
        const blocks = value[day.value] ?? [];
        const isOn   = blocks.length > 0;

        return (
          <div key={day.value} className={`px-3 py-2.5 ${isOn ? "bg-background" : "bg-muted/20"}`}>
            {/* Row 1: toggle + first block (or "Día libre") */}
            <div className="flex items-center gap-3">
              {/* Checkbox + day name */}
              <button
                type="button"
                onClick={() => toggleDay(day.value)}
                className="flex items-center gap-2 shrink-0"
              >
                <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  isOn ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"
                }`}>
                  {isOn && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                </span>
                <span className={`text-sm font-semibold w-8 ${isOn ? "text-foreground" : "text-muted-foreground"}`}>
                  {day.short}
                </span>
              </button>

              {isOn && blocks[0] ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <TimeInput
                    value={blocks[0].start_time}
                    onChange={(v) => setBlock(day.value, 0, "start_time", v)}
                  />
                  <span className="text-muted-foreground text-xs">→</span>
                  <TimeInput
                    value={blocks[0].end_time}
                    onChange={(v) => setBlock(day.value, 0, "end_time", v)}
                  />
                  {blocks.length === 1 && (
                    <button
                      type="button"
                      onClick={() => addBlock(day.value)}
                      className="ml-1 flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      title="Agregar turno tarde"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tarde</span>
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Día libre</span>
              )}
            </div>

            {/* Row 2: second block (if exists) */}
            {isOn && blocks[1] && (
              <div className="flex items-center gap-1.5 mt-2 ml-9">
                <span className="text-xs text-muted-foreground w-8">Tarde</span>
                <TimeInput
                  value={blocks[1].start_time}
                  onChange={(v) => setBlock(day.value, 1, "start_time", v)}
                />
                <span className="text-muted-foreground text-xs">→</span>
                <TimeInput
                  value={blocks[1].end_time}
                  onChange={(v) => setBlock(day.value, 1, "end_time", v)}
                />
                <button
                  type="button"
                  onClick={() => removeBlock(day.value, 1)}
                  className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  title="Quitar turno tarde"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {error && <p className="text-xs text-destructive px-3 py-2">{error}</p>}
    </div>
  );
}
