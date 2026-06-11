"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RUBROS, getRubroConfig, getInitials } from "@/lib/rubros";
import { Eye, EyeOff } from "lucide-react";

type Org = {
  id: string; name: string; rubro: string | null; city: string | null;
  is_listed: boolean; logo_url: string | null; avatar_url: string | null; cover_url: string | null;
};

export default function DirectoryForm({ org }: { org: Org | null }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [isListed, setIsListed] = useState(org?.is_listed ?? true);

  if (!org) return <p className="text-muted-foreground text-sm">No se pudo cargar la información.</p>;

  const config = getRubroConfig(org.rubro);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/organizations/${org!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rubro:      fd.get("rubro") || null,
        city:       fd.get("city") || null,
        cover_url:  fd.get("cover_url") || null,
        logo_url:   fd.get("logo_url") || null,
        avatar_url: fd.get("avatar_url") || null,
        is_listed:  isListed,
      }),
    });
    if (!res.ok) setError("Error al guardar. Intentá de nuevo.");
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-0.5">Directorio público</h2>
        <p className="text-sm text-muted-foreground">
          Tu negocio aparece en <strong>/explorar</strong> para que nuevos clientes te encuentren.
        </p>
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2">{error}</p>}

      {/* Preview card */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 border rounded-xl">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: config.color }}
        >
          {getInitials(org.name)}
        </div>
        <div>
          <p className="font-semibold text-sm">{org.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {config.emoji} {org.rubro ?? "Sin rubro"}{org.city ? ` · ${org.city}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Rubro</label>
          <select name="rubro" defaultValue={org.rubro ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Sin rubro —</option>
            {RUBROS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ciudad</label>
          <input name="city" defaultValue={org.city ?? ""} placeholder="Ej: Buenos Aires"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">URL de portada</label>
          <input name="cover_url" defaultValue={org.cover_url ?? ""} type="url"
            placeholder="https://... (imagen 16:9, mínimo 1200px de ancho)"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <p className="text-xs text-muted-foreground">Dejá vacío para usar la imagen predeterminada del rubro.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">URL de logo</label>
          <input name="logo_url" defaultValue={org.logo_url ?? ""} type="url" placeholder="https://..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">URL de avatar</label>
          <input name="avatar_url" defaultValue={org.avatar_url ?? ""} type="url" placeholder="https://..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      {/* Visibility toggle */}
      <div className="flex items-start justify-between gap-4 p-4 border rounded-xl">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isListed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
            {isListed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm font-medium">{isListed ? "Visible en el directorio" : "Oculto del directorio"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isListed ? "Los nuevos clientes pueden encontrarte en /explorar." : "Tu negocio no aparece en el directorio público."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsListed((v) => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${isListed ? "bg-green-500" : "bg-muted-foreground/30"}`}
          role="switch"
          aria-checked={isListed}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${isListed ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
      </div>
    </form>
  );
}
