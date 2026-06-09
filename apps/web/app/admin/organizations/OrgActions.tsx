"use client";

import { useTransition } from "react";
import { setOrgActive, setOrgListed } from "@/lib/actions/platform-admin";

interface Props {
  orgId: string;
  isActive: boolean;
  isListed: boolean;
}

export default function OrgActions({ orgId, isActive, isListed }: Props) {
  const [pending, startT] = useTransition();

  function toggle(action: "active" | "listed") {
    startT(async () => {
      if (action === "active")  await setOrgActive(orgId, !isActive);
      if (action === "listed")  await setOrgListed(orgId, !isListed);
    });
  }

  return (
    <div className="flex items-center gap-2">
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
    </div>
  );
}
