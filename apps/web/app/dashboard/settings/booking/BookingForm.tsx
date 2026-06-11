"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Settings = {
  minAdvanceMinutes?: number; maxAdvanceDays?: number;
  cancellationHours?: number; requireManualConfirmation?: boolean;
  cancellationPolicyText?: string;
  requirePreConfirmation?: boolean; preConfirmationHours?: number;
};
type Org = { id: string; settings: Record<string, unknown> | null };

export default function BookingForm({ org }: { org: Org | null }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  if (!org) return <p className="text-muted-foreground text-sm">No se pudo cargar la información.</p>;

  const s = (org.settings ?? {}) as Settings;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/organizations/${org!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          minAdvanceMinutes:         Number(fd.get("minAdvanceMinutes")),
          maxAdvanceDays:            Number(fd.get("maxAdvanceDays")),
          cancellationHours:         Number(fd.get("cancellationHours")),
          requireManualConfirmation: fd.get("requireManualConfirmation") === "true",
          cancellationPolicyText:    fd.get("cancellationPolicyText") || "",
          requirePreConfirmation:    fd.get("requirePreConfirmation") === "true",
          preConfirmationHours:      Number(fd.get("preConfirmationHours")),
        },
      }),
    });
    if (!res.ok) setError("Error al guardar. Intentá de nuevo.");
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-0.5">Preferencias de reserva</h2>
        <p className="text-sm text-muted-foreground">Controlá cuándo y cómo tus clientes pueden reservar.</p>
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}

      <div className="space-y-5">
        {/* Advance time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Anticipación mínima</label>
            <div className="flex items-center gap-2">
              <input name="minAdvanceMinutes" type="number" min={0} defaultValue={s.minAdvanceMinutes ?? 60}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">minutos</span>
            </div>
            <p className="text-xs text-muted-foreground">Mínimo tiempo de anticipación para reservar.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Anticipación máxima</label>
            <div className="flex items-center gap-2">
              <input name="maxAdvanceDays" type="number" min={1} defaultValue={s.maxAdvanceDays ?? 60}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">días</span>
            </div>
            <p className="text-xs text-muted-foreground">Hasta cuántos días en el futuro se puede reservar.</p>
          </div>
        </div>

        {/* Confirmation mode */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Confirmación de turnos</label>
          <select name="requireManualConfirmation"
            defaultValue={s.requireManualConfirmation ? "true" : "false"}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="false">Automática — el turno queda confirmado al instante</option>
            <option value="true">Manual — necesitás confirmar cada turno vos mismo</option>
          </select>
        </div>

        {/* Cancellation */}
        <div className="p-4 border rounded-xl space-y-4">
          <p className="text-sm font-semibold">Política de cancelación</p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Horas mínimas para cancelar sin cargo</label>
            <div className="flex items-center gap-2">
              <input name="cancellationHours" type="number" min={0} defaultValue={s.cancellationHours ?? 24}
                className="w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <span className="text-sm text-muted-foreground">horas antes del turno</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Texto de política (se muestra al cliente)</label>
            <textarea name="cancellationPolicyText" rows={3}
              defaultValue={s.cancellationPolicyText ?? ""}
              placeholder="Ej: Las cancelaciones con menos de 24hs de anticipación tienen un cargo del 50% del valor del servicio."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>
      </div>

        {/* Pre-confirmation */}
        <div className="p-4 border rounded-xl space-y-4">
          <div>
            <p className="text-sm font-semibold">Reconfirmación previa al turno</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Si activás esto, el cliente recibirá un WhatsApp antes del turno para confirmar que va a ir.
              Si no confirma a tiempo, el turno se cancela automáticamente y el slot queda libre.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Activar reconfirmación</label>
            <select name="requirePreConfirmation"
              defaultValue={s.requirePreConfirmation ? "true" : "false"}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="false">Desactivado — no se pide reconfirmación</option>
              <option value="true">Activado — el cliente debe confirmar por WhatsApp</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Enviar reconfirmación con cuántas horas de anticipación</label>
            <div className="flex items-center gap-2">
              <input name="preConfirmationHours" type="number" min={1} max={72}
                defaultValue={s.preConfirmationHours ?? 24}
                className="w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <span className="text-sm text-muted-foreground">horas antes del turno</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Si el cliente no abre el link o no cancela dentro de ese plazo, el turno se mantiene confirmado.
            </p>
          </div>
        </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
      </div>
    </form>
  );
}
