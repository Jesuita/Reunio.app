"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import {
  createService,
  updateService,
  deleteService,
  type ServiceFormState,
} from "@/lib/actions/services";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Pencil, EyeOff, Eye, HelpCircle } from "lucide-react";

type Category = { id: string; name: string; color: string };

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  deposit_amount: number | null;
  color: string;
  category: string;
  category_id: string | null;
  is_active: boolean;
  service_categories?: { id: string; name: string; color: string } | null;
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}

const COLORS = [
  "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899",
  "#10B981", "#EF4444", "#F97316", "#06B6D4",
];

function FieldTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground inline ml-1 cursor-help" />
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

type ServiceFormProps = {
  service?: Service;
  categories: Category[];
  onClose: () => void;
};

function ServiceForm({ service, categories, onClose }: ServiceFormProps) {
  const action = service ? updateService.bind(null, service.id) : createService;

  const [state, formAction, pending] = useFormState<ServiceFormState, FormData>(
    action,
    { success: false, error: "" } as ServiceFormState,
  );

  if (state.success) {
    onClose();
    return null;
  }

  const defaultCategoryId = service?.category_id ?? categories[0]?.id ?? "";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-1 flex items-center">
              Nombre *
              <FieldTooltip text="El nombre del servicio que verán los clientes al reservar. Sé descriptivo: 'Corte + Barba' en vez de 'Servicio 1'." />
            </label>
            <input
              name="name"
              defaultValue={service?.name}
              required
              placeholder="Ej: Corte + Barba"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1 flex items-center">
              Descripción
              <FieldTooltip text="Descripción opcional que aparece debajo del nombre en la página de reservas. Útil para aclarar qué incluye el servicio." />
            </label>
            <textarea
              name="description"
              defaultValue={service?.description ?? ""}
              rows={2}
              placeholder="Ej: Incluye lavado y secado. Duración aproximada 45 min."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-1 flex items-center">
              Categoría *
              <FieldTooltip text="Las categorías agrupan los servicios en tu página de reservas. Ej: 'Cortes', 'Coloración', 'Tratamientos'. Podés crear y editar categorías en el menú Categorías del panel." />
            </label>
            {categories.length === 0 ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                No tenés categorías.{" "}
                <Link href="/dashboard/categories" className="underline font-medium">
                  Creá una categoría primero →
                </Link>
              </div>
            ) : (
              <select
                name="category_id"
                defaultValue={defaultCategoryId}
                required
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            {/* Keep the legacy text field populated for backwards compat */}
            <input
              type="hidden"
              name="category"
              value={categories.find((c) => c.id === defaultCategoryId)?.name ?? "General"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                Duración (min) *
                <FieldTooltip text="Tiempo que dura el servicio en minutos. Esto determina los slots disponibles en la agenda. Mínimo 5 min, máximo 8h (480 min)." />
              </label>
              <input
                name="duration_minutes"
                type="number"
                min={5}
                max={480}
                step={5}
                defaultValue={service?.duration_minutes ?? 30}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                Precio (ARS) *
                <FieldTooltip text="Precio total del servicio en pesos. Se muestra en la página de reservas como referencia para el cliente." />
              </label>
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

            {/* Deposit */}
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 flex items-center">
                Seña (ARS)
                <FieldTooltip text="Monto que el cliente paga al momento de reservar para garantizar el turno. Se cobra via Mercado Pago. Dejá vacío si no requerís seña para este servicio. Requiere plan Pro o superior." />
              </label>
              <input
                name="deposit_amount"
                type="number"
                min={0}
                step={100}
                defaultValue={service?.deposit_amount ?? ""}
                placeholder="Dejar vacío si no se cobra seña"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center">
              Color en agenda
              <FieldTooltip text="Color con el que aparecerán los turnos de este servicio en el calendario del panel. No afecta la página pública." />
            </label>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={pending || categories.length === 0}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesList({
  services,
  categories,
}: {
  services: Service[];
  categories: Category[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);

  // Group by category name
  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const catName = s.service_categories?.name ?? s.category ?? "Sin categoría";
    (acc[catName] ??= []).push(s);
    return acc;
  }, {});

  return (
    <TooltipProvider>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => { setEditService(null); setShowForm(true); }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo servicio
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-background border rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-muted/50 border-b flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    categories.find((c) => c.name === category)?.color ?? "#6366F1",
                }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {items.length} servicio(s)
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
                  <tr
                    key={s.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <div>
                          <span className="font-medium">{s.name}</span>
                          {s.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                              {s.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDuration(s.duration_minutes)}
                    </td>
                    <td className="px-5 py-4">{formatPrice(s.price)}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {s.deposit_amount ? formatPrice(s.deposit_amount) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setEditService(s); setShowForm(true); }}
                          className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title="Editar servicio"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteService(s.id)}
                          className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                          title={s.is_active ? "Desactivar servicio" : "Activar servicio"}
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
          categories={categories}
          onClose={() => { setShowForm(false); setEditService(null); }}
        />
      )}
    </TooltipProvider>
  );
}
