"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import WeekScheduleEditor, {
  type WeekSchedule,
  type DaySchedule,
} from "@/components/WeekScheduleEditor";
import { saveScheduleDay } from "@/lib/actions/staff";

// ─── Types ───────────────────────────────────────────────────────────────────

type StaffMember = { id: string; name: string };

type ScheduleRow = {
  staff_id:    string;
  day_of_week: number;
  start_time:  string;
  end_time:    string;
};

type Org = {
  id: string;
  name: string;
  slug: string;
  category?: string;
  timezone: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  settings: Record<string, unknown> | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (GMT-3)" },
  { value: "America/Argentina/Cordoba",      label: "Córdoba / Rosario (GMT-3)" },
  { value: "America/Mexico_City",            label: "México Ciudad (GMT-6)" },
  { value: "America/Bogota",                 label: "Colombia (GMT-5)" },
  { value: "America/Lima",                   label: "Perú (GMT-5)" },
  { value: "America/Santiago",               label: "Chile (GMT-4/-3)" },
  { value: "America/Sao_Paulo",              label: "Brasil São Paulo (GMT-3)" },
];

// ─── Build WeekSchedule from DB rows ─────────────────────────────────────────

function buildWeekSchedule(rows: ScheduleRow[]): WeekSchedule {
  const ws: WeekSchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const row of rows) {
    const day = row.day_of_week;
    ws[day] = [
      ...(ws[day] ?? []),
      {
        start_time: row.start_time.slice(0, 5),
        end_time:   row.end_time.slice(0, 5),
      },
    ];
  }
  // Sort blocks within each day by start_time
  for (const day of Object.keys(ws) as unknown as number[]) {
    ws[day]?.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
  return ws;
}

// ─── Schedule section ─────────────────────────────────────────────────────────

function ScheduleSection({
  staffList,
  schedulesByStaff,
}: {
  staffList:        StaffMember[];
  schedulesByStaff: Record<string, ScheduleRow[]>;
}) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id ?? "");
  const [weekSchedule, setWeekSchedule]       = useState<WeekSchedule>(() =>
    buildWeekSchedule(schedulesByStaff[staffList[0]?.id ?? ""] ?? [])
  );
  const [isPending, startTransition] = useTransition();
  const [saveError,  setSaveError]   = useState<string | null>(null);
  const [saved,      setSaved]       = useState(false);

  function handleStaffChange(id: string) {
    setSelectedStaffId(id);
    setWeekSchedule(buildWeekSchedule(schedulesByStaff[id] ?? []));
    setSaved(false);
    setSaveError(null);
  }

  function saveAll() {
    setSaveError(null);
    setSaved(false);
    startTransition(async () => {
      // Save all 7 days concurrently
      const results = await Promise.all(
        (Object.entries(weekSchedule) as [string, DaySchedule][]).map(([dayStr, blocks]) =>
          saveScheduleDay(selectedStaffId, Number(dayStr), blocks)
        )
      );
      const failed = results.find((r) => !r.success);
      if (failed && !failed.success) {
        setSaveError(failed.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <section className="bg-background border rounded-xl p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-base">Horario de atención</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configurá los días y bloques horarios para cada profesional. Cada día puede tener un horario corrido o dos bloques (mañana y tarde).
        </p>
      </div>

      {staffList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay personal activo. Agregá un miembro desde <strong>Panel → Personal</strong>.</p>
      ) : (
        <>
          {/* Staff selector */}
          {staffList.length > 1 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Profesional</label>
              <select
                value={selectedStaffId}
                onChange={(e) => handleStaffChange(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <WeekScheduleEditor
            value={weekSchedule}
            onChange={setWeekSchedule}
          />

          {saveError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{saveError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={saveAll} disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar horario"}
            </Button>
            {saved && <span className="text-sm text-green-600">✓ Guardado</span>}
          </div>

          {staffList.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Estás editando el horario de <strong>{staffList.find((s) => s.id === selectedStaffId)?.name}</strong>. Cada profesional tiene su propio horario independiente.
            </p>
          )}
        </>
      )}
    </section>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function SettingsForm({
  org,
  staffList,
  schedulesByStaff,
}: {
  org:              Org | null;
  staffList:        StaffMember[];
  schedulesByStaff: Record<string, ScheduleRow[]>;
}) {
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const settings = (org?.settings ?? {}) as {
    minAdvanceMinutes?:      number;
    maxAdvanceDays?:         number;
    cancellationPolicyText?: string;
    cancellationHours?:      number;
    requireManualConfirmation?: boolean;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const body = {
      name:        fd.get("name"),
      phone:       fd.get("phone"),
      address:     fd.get("address"),
      website:     fd.get("website"),
      description: fd.get("description"),
      timezone:    fd.get("timezone"),
      settings: {
        minAdvanceMinutes:         Number(fd.get("minAdvanceMinutes")),
        maxAdvanceDays:            Number(fd.get("maxAdvanceDays")),
        cancellationPolicyText:    fd.get("cancellationPolicyText"),
        cancellationHours:         Number(fd.get("cancellationHours")),
        requireManualConfirmation: fd.get("requireManualConfirmation") === "true",
      },
    };

    const res = await fetch(`/api/organizations/${org?.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      setError("Error al guardar. Intentá de nuevo.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (!org) return <p className="text-muted-foreground">No se pudo cargar la configuración.</p>;

  return (
    <div className="space-y-8">
      {/* ── Business info ─────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-2">{error}</p>
        )}

        <section className="bg-background border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Información general</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Nombre del negocio *</label>
              <input name="name" defaultValue={org.name} required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Descripción</label>
              <textarea name="description" defaultValue={org.description ?? ""} rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Teléfono</label>
              <input name="phone" defaultValue={org.phone ?? ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Sitio web</label>
              <input name="website" defaultValue={org.website ?? ""} type="url"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Dirección</label>
              <input name="address" defaultValue={org.address ?? ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Zona horaria</label>
              <select name="timezone" defaultValue={org.timezone}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-1 text-sm text-muted-foreground">
            <span className="font-medium">URL pública:</span>{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              reunio.app/{org.slug}
            </code>
          </div>
        </section>

        {/* ── Booking preferences ───────────────────────────────────────── */}
        <section className="bg-background border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-base">Preferencias de reserva</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Anticipación mínima (minutos)</label>
              <input name="minAdvanceMinutes" type="number" min={0}
                defaultValue={settings.minAdvanceMinutes ?? 60}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-xs text-muted-foreground mt-1">Mínimo tiempo antes del turno para poder reservar.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Anticipación máxima (días)</label>
              <input name="maxAdvanceDays" type="number" min={1}
                defaultValue={settings.maxAdvanceDays ?? 60}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Horas mínimas para cancelar sin cargo</label>
              <input name="cancellationHours" type="number" min={0}
                defaultValue={settings.cancellationHours ?? 24}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex items-center pt-5">
              <select name="requireManualConfirmation"
                defaultValue={settings.requireManualConfirmation ? "true" : "false"}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="false">Confirmar automáticamente</option>
                <option value="true">Requiere confirmación manual</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Política de cancelación (texto)</label>
              <textarea name="cancellationPolicyText"
                defaultValue={settings.cancellationPolicyText ?? ""} rows={2}
                placeholder="Ej: Cancelaciones con menos de 24hs tienen cargo del 50% del servicio."
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          {saved && <span className="text-sm text-green-600">✓ Guardado</span>}
        </div>
      </form>

      {/* ── Schedule section (separate save) ─────────────────────────── */}
      <ScheduleSection staffList={staffList} schedulesByStaff={schedulesByStaff} />
    </div>
  );
}
