"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (GMT-3)" },
  { value: "America/Argentina/Cordoba",      label: "Córdoba / Rosario (GMT-3)" },
  { value: "America/Mexico_City",            label: "México Ciudad (GMT-6)" },
  { value: "America/Bogota",                 label: "Colombia (GMT-5)" },
  { value: "America/Lima",                   label: "Perú (GMT-5)" },
  { value: "America/Santiago",               label: "Chile (GMT-4/-3)" },
  { value: "America/Sao_Paulo",              label: "Brasil São Paulo (GMT-3)" },
];

type Org = { id: string; name: string; slug: string; timezone: string; phone: string | null; address: string | null; website: string | null; description: string | null };

export default function GeneralForm({ org }: { org: Org | null }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  if (!org) return <p className="text-muted-foreground text-sm">No se pudo cargar la información.</p>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/organizations/${org!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:        fd.get("name"),
        phone:       fd.get("phone") || null,
        address:     fd.get("address") || null,
        website:     fd.get("website") || null,
        description: fd.get("description") || null,
        timezone:    fd.get("timezone"),
      }),
    });
    if (!res.ok) setError("Error al guardar. Intentá de nuevo.");
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-0.5">Información general</h2>
        <p className="text-sm text-muted-foreground">Datos básicos que aparecen en tu página pública.</p>
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Nombre del negocio *</label>
          <input name="name" defaultValue={org.name} required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Descripción</label>
          <textarea name="description" defaultValue={org.description ?? ""} rows={3}
            placeholder="Contale a tus clientes quiénes son y qué ofrecen…"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Teléfono</label>
          <input name="phone" defaultValue={org.phone ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Sitio web</label>
          <input name="website" defaultValue={org.website ?? ""} type="url"
            placeholder="https://..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Dirección</label>
          <input name="address" defaultValue={org.address ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Zona horaria</label>
          <select name="timezone" defaultValue={org.timezone}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
          </select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-2.5">
        <span className="font-medium">URL pública:</span>{" "}
        <code className="text-xs bg-background border rounded px-1.5 py-0.5">reunio.app/{org.slug}</code>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
      </div>
    </form>
  );
}
