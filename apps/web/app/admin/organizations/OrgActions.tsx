"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrgActive, setOrgListed, deleteOrg } from "@/lib/actions/platform-admin";

interface Props {
  orgId: string;
  isActive: boolean;
  isListed: boolean;
}

export default function OrgActions({ orgId, isActive, isListed }: Props) {
  const [pending, startT] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  function toggle(action: "active" | "listed") {
    startT(async () => {
      if (action === "active")  await setOrgActive(orgId, !isActive);
      if (action === "listed")  await setOrgListed(orgId, !isListed);
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startT(async () => {
      const result = await deleteOrg(orgId);
      if (!result.success) {
        setDeleteError(result.error);
        setConfirmDelete(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => toggle("active")}
        disabled={pending}
        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
          isActive
            ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            : "bg-red-50 text-red-600 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
        } disabled:opacity-50`}
        title={isActive ? "Click para suspender" : "Click para activar"}
      >
        {pending ? "..." : isActive ? "Activo" : "Suspendido"}
      </button>

      <button
        onClick={() => toggle("listed")}
        disabled={pending}
        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
          isListed
            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-muted hover:text-muted-foreground hover:border-border"
            : "bg-muted text-muted-foreground border-border hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
        } disabled:opacity-50`}
        title={isListed ? "Click para ocultar del directorio" : "Click para mostrar en directorio"}
      >
        {pending ? "..." : isListed ? "Visible" : "Oculto"}
      </button>

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={pending}
          className="text-xs font-medium px-2.5 py-1 rounded-full border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors disabled:opacity-50"
          title="Eliminar negocio permanentemente"
        >
          Eliminar
        </button>
      ) : (
        <span className="flex items-center gap-1.5 text-xs">
          <span className="text-red-600 font-medium">¿Confirmás?</span>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="font-semibold px-2.5 py-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {pending ? "..." : "Sí, eliminar"}
          </button>
          <button
            onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
            disabled={pending}
            className="px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </span>
      )}

      {deleteError && (
        <span className="text-xs text-red-600 w-full mt-1">{deleteError}</span>
      )}
    </div>
  );
}
