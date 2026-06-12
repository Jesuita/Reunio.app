"use client";

import { useState } from "react";
import { PLANS, type PlanName } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const PLAN_FEATURES: Record<PlanName, string[]> = {
  free: [
    "1 profesional",
    "1 servicio",
    "30 turnos/mes",
    "Página de reservas pública",
    "Dashboard básico",
    "Gestión de clientes",
  ],
  starter: [
    "Hasta 2 profesionales",
    "Hasta 3 servicios",
    "200 turnos/mes",
    "Reportes básicos",
  ],
  pro: [
    "Hasta 10 profesionales",
    "Servicios ilimitados",
    "500 turnos/mes",
    "Recordatorios WhatsApp",
    "Cobro de señas (Mercado Pago)",
    "Reportes completos + exportar CSV",
    "CRM de clientes",
  ],
  business: [
    "Profesionales ilimitados",
    "Turnos ilimitados",
    "Múltiples sucursales",
    "Widget embebible",
    "API pública",
    "Branding personalizado",
    "Soporte prioritario",
    "Todo lo de Pro",
  ],
};

export default function BillingView({
  currentPlan,
  planLabel,
  hasCustomer,
  expiresAt,
}: {
  currentPlan: PlanName;
  planLabel: string;
  hasCustomer: boolean;
  expiresAt?: string;
}) {
  const [loading, setLoading] = useState<PlanName | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleUpgrade(plan: PlanName) {
    setLoading(plan);
    const res = await fetch("/api/billing/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error al iniciar el pago. Intentá de nuevo.");
      setLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setPortalLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="bg-background border rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan actual</p>
            <p className="text-2xl font-bold mt-0.5">{planLabel}</p>
            {expiresAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Renueva el {new Date(expiresAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          {hasCustomer && currentPlan !== "free" && (
            <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? "Cargando..." : "Gestionar suscripción"}
            </Button>
          )}
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(["free", "starter", "pro", "business"] as PlanName[]).map((plan) => {
          const p = PLANS[plan];
          const isCurrent = plan === currentPlan;
          const features = PLAN_FEATURES[plan];

          return (
            <div
              key={plan}
              className={`bg-background rounded-xl border p-5 flex flex-col relative ${
                p.highlight ? "border-primary shadow-sm" : ""
              } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {p.highlight}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-bold text-lg">{p.label}</h3>
                <div className="mt-2">
                  {p.priceUsd === 0 ? (
                    <span className="text-2xl font-bold">Gratis</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold">USD {p.priceUsd}</span>
                      <span className="text-muted-foreground text-sm">/mes</span>
                    </>
                  )}
                </div>
                {p.priceUsd > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ≈ ${p.priceArs.toLocaleString("es-AR")} ARS
                  </p>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="outline" disabled className="w-full">
                  Plan actual
                </Button>
              ) : plan === "free" ? (
                <Button variant="outline" disabled className="w-full">
                  Degradar a Free
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading !== null}
                >
                  {loading === plan ? "Redirigiendo..." : `Activar ${p.label}`}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
