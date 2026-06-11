"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePlanAction } from "./actions";

type DbPlan = {
  id: string; name: string; label: string; price_ars: number; price_usd: number;
  stripe_price_id: string | null; highlight: string | null; is_active: boolean;
  sort_order: number; max_staff: number | null; max_bookings_per_month: number | null;
  max_services: number | null; whatsapp_reminders: boolean; online_payments: boolean;
  multi_location: boolean; api_access: boolean; custom_branding: boolean; reports: string;
};

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
      <span className="text-sm">{label}</span>
    </label>
  );
}

export default function PlanForm({ plan, onClose }: { plan: DbPlan | null; onClose: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await savePlanAction(plan?.id ?? null, new FormData(e.currentTarget));
    setLoading(false);
    if (result && "error" in result) { setError(result.error); return; }
    onClose();
  }

  const p = plan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">{p ? `Editar plan: ${p.label}` : "Nuevo plan"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Básico */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre interno *</Label>
              <Input name="name" defaultValue={p?.name ?? ""} placeholder="free, pro, business..." required disabled={!!p} />
              <p className="text-xs text-muted-foreground">Solo letras minúsculas, números y guiones bajos. No se puede cambiar.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre visible *</Label>
              <Input name="label" defaultValue={p?.label ?? ""} placeholder="Free, Pro, Business..." required />
            </div>
            <div className="space-y-1.5">
              <Label>Precio ARS / mes</Label>
              <Input name="price_ars" type="number" min="0" defaultValue={p?.price_ars ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Precio USD / mes</Label>
              <Input name="price_usd" type="number" min="0" defaultValue={p?.price_usd ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Stripe Price ID</Label>
              <Input name="stripe_price_id" defaultValue={p?.stripe_price_id ?? ""} placeholder="price_..." />
            </div>
            <div className="space-y-1.5">
              <Label>Badge destacado</Label>
              <Input name="highlight" defaultValue={p?.highlight ?? ""} placeholder="Más popular" />
            </div>
            <div className="space-y-1.5">
              <Label>Orden</Label>
              <Input name="sort_order" type="number" min="0" defaultValue={p?.sort_order ?? 0} />
            </div>
            <div className="space-y-1.5 flex items-end pb-1">
              <Toggle name="is_active" label="Plan activo" defaultChecked={p?.is_active ?? true} />
            </div>
          </div>

          {/* Límites */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Límites <span className="text-muted-foreground font-normal">(vacío = ilimitado)</span></h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Staff máximo</Label>
                <Input name="max_staff" type="number" min="1" defaultValue={p?.max_staff ?? ""} placeholder="∞" />
              </div>
              <div className="space-y-1.5">
                <Label>Turnos/mes</Label>
                <Input name="max_bookings_per_month" type="number" min="1" defaultValue={p?.max_bookings_per_month ?? ""} placeholder="∞" />
              </div>
              <div className="space-y-1.5">
                <Label>Servicios máx.</Label>
                <Input name="max_services" type="number" min="1" defaultValue={p?.max_services ?? ""} placeholder="∞" />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-3">
              <Toggle name="whatsapp_reminders" label="Recordatorios WhatsApp" defaultChecked={p?.whatsapp_reminders ?? false} />
              <Toggle name="online_payments"    label="Pagos online (Mercado Pago)" defaultChecked={p?.online_payments ?? false} />
              <Toggle name="multi_location"     label="Multi-sucursal" defaultChecked={p?.multi_location ?? false} />
              <Toggle name="api_access"         label="Acceso API" defaultChecked={p?.api_access ?? false} />
              <Toggle name="custom_branding"    label="Branding personalizado" defaultChecked={p?.custom_branding ?? false} />
              <div className="space-y-1.5">
                <Label>Reportes</Label>
                <select name="reports" defaultValue={p?.reports ?? "basic"}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                  <option value="basic">Básicos</option>
                  <option value="full">Completos</option>
                </select>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
