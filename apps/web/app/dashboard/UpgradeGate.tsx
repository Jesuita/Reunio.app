"use client";

import Link from "next/link";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanName } from "@/lib/plans";

const PLAN_LABELS: Record<PlanName, string> = {
  free: "Free", starter: "Starter", pro: "Pro", business: "Business",
};

const PLAN_FEATURES: Partial<Record<PlanName, string[]>> = {
  starter: ["Reportes de turnos y clientes", "Historial mensual", "Exportar datos"],
  pro: ["Widget embebible en tu sitio web", "Recordatorios automáticos por WhatsApp", "Cobro de señas online", "Reportes completos"],
  business: ["Múltiples sucursales", "API pública", "Branding personalizado"],
};

export default function UpgradeGate({
  requiredPlan,
  featureName,
}: {
  requiredPlan: PlanName;
  featureName: string;
}) {
  const features = PLAN_FEATURES[requiredPlan] ?? [];

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>

        <h2 className="text-2xl font-bold mb-2">{featureName}</h2>
        <p className="text-muted-foreground mb-6">
          Esta función está disponible a partir del plan{" "}
          <span className="font-semibold text-foreground">{PLAN_LABELS[requiredPlan]}</span>.
        </p>

        {features.length > 0 && (
          <ul className="text-left space-y-2 mb-8 bg-muted/50 rounded-xl p-4">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/dashboard/billing"
          className="inline-flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 text-sm font-medium transition-colors"
        >
          <Zap className="w-4 h-4" />
          Ver planes y precios
        </Link>

        <p className="text-xs text-muted-foreground mt-3">
          Cambiá de plan en cualquier momento desde Facturación.
        </p>
      </div>
    </div>
  );
}
