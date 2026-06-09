"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Argentina/Rosario",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Sao_Paulo",
];

type Org = {
  id: string;
  name: string;
  slug: string;
  category: string;
  timezone: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  settings: Record<string, unknown> | null;
};

export default function SettingsForm({ org }: { org: Org }) {
  const settings = (org.settings ?? {}) as {
    minAdvanceMinutes?: number;
    maxAdvanceDays?: number;
    cancellationPolicyText?: string;
    cancellationHours?: number;
    requireManualConfirmation?: boolean;
  };

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const res = await fetch(`/api/organizations/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setError("Error al guardar. Intentá de nuevo.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-2">{error}</p>
      )}

      {/* Información general */}
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
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-2 text-sm text-muted-foreground">
          <span className="font-medium">URL pública:</span>{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
            {typeof window !== "undefined" ? window.location.origin : "https://tuapp.com"}/{org.slug}
          </code>
        </div>
      </section>

      {/* Configuración de reservas */}
      <section className="bg-background border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-base">Configuración de reservas</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Anticipación mínima (minutos)</label>
            <input name="minAdvanceMinutes" type="number" min={0}
              defaultValue={settings.minAdvanceMinutes ?? 60}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo tiempo antes del turno para poder reservar.
            </p>
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
          <div className="flex items-center gap-3 pt-5">
            <select name="requireManualConfirmation"
              defaultValue={settings.requireManualConfirmation ? "true" : "false"}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="false">Confirmar automáticamente</option>
              <option value="true">Requiere confirmación manual</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1 block">Política de cancelación (texto)</label>
            <textarea name="cancellationPolicyText"
              defaultValue={settings.cancellationPolicyText ?? ""}
              rows={2}
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
  );
}
