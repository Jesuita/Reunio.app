"use client";

import { useState, useActionState } from "react";
import { createService, updateService, deleteService, type ServiceFormState } from "@/lib/actions/services";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, EyeOff, Eye } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  deposit_amount: number | null;
  color: string;
  category: string;
  is_active: boolean;
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(price);
}

const COLORS = [
  "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899",
  "#10B981", "#EF4444", "#F97316", "#06B6D4",
];

type ServiceFormProps = {
  service?: Service;
  onClose: () => void;
};

function ServiceForm({ service, onClose }: ServiceFormProps) {
  const action = service
    ? updateService.bind(null, service.id)
    : createService;

  const [state, formAction, pending] = useActionState<ServiceFormState, FormData>(
    action,
    { success: false, error: "" } as ServiceFormState,
  );

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {service ? "Editar servicio" : "Nuevo servicio"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          {"error" in state && state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Nombre *</label>
              <input
                name="name"
                defaultValue={service?.name}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Descripción</label>
              <textarea
                name="description"
                defaultValue={service?.description ?? ""}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Categoría *</label>
              <input
                name="category"
                defaultValue={service?.category}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Duración (minutos) *</label>
              <input
                name="duration_minutes"
                type="number"
                min={5}
                max={480}
                defaultValue={service?.duration_minutes ?? 30}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Precio (ARS) *</label>
              <input
                name="price"
                type="number"
                min={0}
                step={100}
                defaultValue={service?.price ?? 0}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Seña (ARS)</label>
              <input
                name="deposit_amount"
                type="number"
                min={0}
                step={100}
                defaultValue={service?.deposit_amount ?? ""}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <label key={c} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={c}
                      defaultChecked={(service?.color ?? "#3B82F6") === c}
                      className="sr-only peer"
                    />
                    <span
                      className="block w-7 h-7 rounded-full ring-2 ring-transparent peer-checked:ring-offset-2 peer-checked:ring-ring transition-all"
                      style={{ backgroundColor: c }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <input type="hidden" name="is_active" value="true" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesList({ services }: { services: Service[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditService(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo servicio
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-background border rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-muted/50 border-b">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left px-5 py-3 font-medium">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium">Duración</th>
                  <th className="text-left px-5 py-3 font-medium">Precio</th>
                  <th className="text-left px-5 py-3 font-medium">Seña</th>
                  <th className="text-left px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDuration(s.duration_minutes)}</td>
                    <td className="px-5 py-4">{formatPrice(s.price)}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {s.deposit_amount ? formatPrice(s.deposit_amount) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {s.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setEditService(s); setShowForm(true); }}
                          className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteService(s.id)}
                          className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title={s.is_active ? "Desactivar" : "Activar"}
                        >
                          {s.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No hay servicios configurados.</p>
            <p className="text-sm mt-1">Creá el primero con el botón de arriba.</p>
          </div>
        )}
      </div>

      {showForm && (
        <ServiceForm
          service={editService ?? undefined}
          onClose={() => { setShowForm(false); setEditService(null); }}
        />
      )}
    </>
  );
}
