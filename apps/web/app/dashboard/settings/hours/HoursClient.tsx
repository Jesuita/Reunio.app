"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import WeekScheduleEditor, { type WeekSchedule, type DaySchedule } from "@/components/WeekScheduleEditor";
import { saveAllBusinessHours } from "@/lib/actions/business-hours";

type BHRow = { day_of_week: number; start_time: string; end_time: string };

function buildWeekSchedule(rows: BHRow[]): WeekSchedule {
  const ws: WeekSchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const row of rows) {
    ws[row.day_of_week] = [...(ws[row.day_of_week] ?? []), { start_time: row.start_time.slice(0, 5), end_time: row.end_time.slice(0, 5) }];
  }
  for (const day of Object.keys(ws) as unknown as number[]) {
    ws[day]?.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
  return ws;
}

export default function HoursClient({ initialRows }: { initialRows: BHRow[] }) {
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(() => buildWeekSchedule(initialRows));
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaveError(null); setSaved(false);
    startTransition(async () => {
      const result = await saveAllBusinessHours(weekSchedule as Record<number, DaySchedule>);
      if (!result.success) setSaveError(result.error);
      else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    });
  }

  return (
    <div className="space-y-4">
      <WeekScheduleEditor value={weekSchedule} onChange={setWeekSchedule} />
      {saveError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{saveError}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={isPending}>{isPending ? "Guardando…" : "Guardar horario"}</Button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
      </div>
    </div>
  );
}
