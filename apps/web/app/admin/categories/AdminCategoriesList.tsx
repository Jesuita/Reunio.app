"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  createPlatformCategory,
  updatePlatformCategory,
  deletePlatformCategory,
  type PlatformCategoryFormState,
} from "@/lib/actions/platform-admin";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";

type PlatformCategory = { id: string; name: string; color: string; sort_order: number };

const COLORS = [
  "#6366F1", "#3B82F6", "#8B5CF6", "#EC4899",
  "#10B981", "#F59E0B", "#EF4444", "#F97316",
  "#14B8A6", "#64748B",
];

function CategoryForm({ category, onClose }: { category?: PlatformCategory; onClose: () => void }) {
  const action = category
    ? updatePlatformCategory.bind(null, category.id)
    : createPlatformCategory;

  const [state, formAction, pending] = useFormState<PlatformCategoryFormState, FormData>(
    action,
    { success: false, error: "" } as PlatformCategoryFormState,
  );

  if (state.success) { onClose(); return null; }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {category ? "Editar categoría" : "Nueva categoría de plataforma"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form action={formAction} className="p-6 space-y-4">
          {"error" in state && state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre *</label>
            <input
              name="name"
              defaultValue={category?.name}
              required
              placeholder="Ej: Cortes de cabello"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <label key={c} className="cursor-pointer">
                  <input
                    type="radio" name="color" value={c}
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
            <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCategoriesList({ categories }: { categories: PlatformCategory[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PlatformCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleteError(null);
    const result = await deletePlatformCategory(id);
    if (!result.success) setDeleteError(result.error);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva categoría
        </Button>
      </div>

      {deleteError && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{deleteError}</p>
      )}

      <div className="bg-background border rounded-xl overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">No hay categorías de plataforma todavía.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-5 py-3 font-medium">Categoría</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditItem(cat); setShowForm(true); }}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-red-500"
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
    </div>
  );
}
