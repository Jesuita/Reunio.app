"use client";

import { useState } from "react";
import { PLANS, type PlanName } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Check, Zap, ArrowUp, ArrowDown, Settings } from "lucide-react";

const PLAN_ORDER: PlanName[] = ["free", "starter", "pro", "business"];

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
    "Turnos ilimitados",
    "Reportes básicos",
  ],
  pro: [
    "Hasta 5 profesionales",
    "Servicios ilimitados",
    "Turnos ilimitados",
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

  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const isPaid = currentPlan !== "free";

  async function handleCheckout(plan: PlanName) {
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
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Error al abrir el portal. Intentá de nuevo.");
    }
    setPortalLoading(false);
  }

  function renderCTA(plan: PlanName) {
    const targetIdx = PLAN_ORDER.indexOf(plan);
    const isCurrent = plan === currentPlan;

    if (isCurrent) {
      return (
        <Button variant="outline" disabled className="w-full">
          Plan actual
        </Button>
      );
    }

    // Downgrade to free: go to portal to cancel subscription
    if (plan === "free") {
      if (!isPaid) return null;
      return (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground text-sm"
          onClick={handlePortal}
          disabled={portalLoading}
        >
          {portalLoading ? "Cargando..." : "Cancelar suscripción"}
        </Button>
      );
    }

    // Change between paid plans: go to portal (handles proration)
    if (isPaid && targetIdx !== currentIdx) {
      const isUpgrade = targetIdx > currentIdx;
      return (
        <Button
          variant={isUpgrade ? "default" : "outline"}
          className="w-full gap-1.5"
          onClick={handlePortal}
          disabled={portalLoading}
        >
          {portalLoading ? (
            "Cargando..."
          ) : isUpgrade ? (
            <><ArrowUp className="w-3.5 h-3.5" /> Cambiar a {PLANS[plan].label}</>
          ) : (
            <><ArrowDown className="w-3.5 h-3.5" /> Cambiar a {PLANS[plan].label}</>
          )}
        </Button>
      );
    }

    // New subscription (currently on free): open Stripe Checkout
    return (
      <Button
        className="w-full gap-1.5"
        onClick={() => handleCheckout(plan)}
        disabled={loading !== null}
      >
        {loading === plan ? (
          "Redirigiendo..."
        ) : (
          <><Zap className="w-3.5 h-3.5" /> Activar {PLANS[plan].label}</>
        )}
      </Button>
    );
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
                Renueva el{" "}
                {new Date(expiresAt).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {!isPaid && (
              <p className="text-sm text-muted-foreground mt-1">
                Actualizá tu plan para desbloquear más funcionalidades.
              </p>
            )}
          </div>
          {isPaid && hasCustomer && (
            <Button variant="outline" onClick={handlePortal} disabled={portalLoading} className="gap-2">
              <Settings className="w-4 h-4" />
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
          const targetIdx = PLAN_ORDER.indexOf(plan);
          const isUpgrade = targetIdx > currentIdx;

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
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{p.label}</h3>
                  {!isCurrent && plan !== "free" && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      isUpgrade
                        ? "bg-green-50 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isUpgrade ? "↑ upgrade" : "↓ downgrade"}
                    </span>
                  )}
                </div>
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
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {PLAN_FEATURES[plan].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {renderCTA(plan)}
            </div>
          );
        })}
      </div>

      {isPaid && (
        <p className="text-xs text-muted-foreground text-center">
          Los cambios de plan se aplican inmediatamente con prorrateo automático.
          Para cancelar o cambiar método de pago, usá{" "}
          <button onClick={handlePortal} className="underline hover:text-foreground">
            Gestionar suscripción
          </button>
          .
        </p>
      )}
    </div>
  );
}
