"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  adoptPlatformCategory,
  type CategoryFormState,
} from "@/lib/actions/categories";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2, HelpCircle, Download } from "lucide-react";

type Category = {
  id: string;
  name: string;
  color: string;
  service_count?: number;
};

const COLORS = [
  "#6366F1", "#3B82F6", "#8B5CF6", "#EC4899",
  "#10B981", "#F59E0B", "#EF4444", "#F97316",
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

type FormProps = { category?: Category; onClose: () => void };

function CategoryForm({ category, onClose }: FormProps) {
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory;

  const [state, formAction, pending] = useFormState<CategoryFormState, FormData>(
    action,
    { success: false, error: "" } as CategoryFormState,
  );

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {category ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          {"error" in state && state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
          )}

          <div>
            <label className="text-sm font-medium mb-1 flex items-center">
              Nombre *
              <FieldTooltip text="El nombre que verás al crear servicios y en la página pública de turnos. Ej: 'Cortes', 'Coloración', 'Tratamientos'." />
            </label>
            <input
              name="name"
              defaultValue={category?.name}
              required
              placeholder="Ej: Cortes de cabello"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center">
              Color
              <FieldTooltip text="Color de identificación visual en el calendario y en la página de reservas." />
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    defaultChecked={(category?.color ?? "#6366F1") === c}
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

type Suggestion = { id: string; name: string; color: string };

export default function CategoriesList({
  categories,
  suggestions = [],
}: {
  categories: Category[];
  suggestions?: Suggestion[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [adoptError, setAdoptError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleteError(null);
    const result = await deleteCategory(id);
    if (!result.success) setDeleteError(result.error);
  }

  async function handleAdopt(id: string) {
    setAdopting(id);
    setAdoptError(null);
    const result = await adoptPlatformCategory(id);
    if (!result.success) setAdoptError(result.error);
    setAdopting(null);
  }

  return (
    <TooltipProvider>
      {/* Suggested platform categories */}
      {suggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Sugeridas por la plataforma
          </h2>
          {adoptError && (
            <p className="mb-3 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{adoptError}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleAdopt(s.id)}
                disabled={adopting === s.id}
                className="flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm bg-background hover:bg-muted transition-colors disabled:opacity-50"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.name}
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Org categories */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Mis categorías
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva categoría
        </Button>
      </div>

      {deleteError && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {deleteError}
        </div>
      )}

      <div className="bg-background border rounded-xl overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No hay categorías todavía.</p>
            <p className="text-sm mt-1">Agregá una sugerida o creá la tuya propia.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-5 py-3 font-medium">Categoría</th>
                <th className="text-left px-5 py-3 font-medium">Servicios</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {cat.service_count ?? 0} servicio(s)
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditItem(cat); setShowForm(true); }}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Editar categoría"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-red-500"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <CategoryForm
          category={editItem ?? undefined}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}
    </TooltipProvider>
  );
}
