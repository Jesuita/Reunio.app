"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import PlanForm from "./PlanForm";
import { togglePlanAction } from "./actions";

type DbPlan = {
  id: string; name: string; label: string; price_ars: number; price_usd: number;
  stripe_price_id: string | null; highlight: string | null; is_active: boolean;
  sort_order: number; max_staff: number | null; max_bookings_per_month: number | null;
  max_services: number | null; whatsapp_reminders: boolean; online_payments: boolean;
  multi_location: boolean; api_access: boolean; custom_branding: boolean; reports: string;
};

export default function PlansList({ initialPlans }: { initialPlans: DbPlan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [editing, setEditing] = useState<DbPlan | null | "new">(null);

  async function handleToggle(plan: DbPlan) {
    await togglePlanAction(plan.id, !plan.is_active);
    setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
  }

  function handleClose() {
    setEditing(null);
    window.location.reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Planes</h1>
          <p className="text-sm text-muted-foreground mt-1">Configurá los planes de suscripción de la plataforma.</p>
        </div>
        <Button onClick={() => setEditing("new")} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo plan
        </Button>
      </div>

      <div className="space-y-4">
        {plans.sort((a, b) => a.sort_order - b.sort_order).map((plan) => (
          <div key={plan.id} className={`bg-background border rounded-2xl p-5 ${!plan.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{plan.label}</h3>
                    {plan.highlight && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                        {plan.highlight}
                      </span>
                    )}
                    {!plan.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactivo</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      ${plan.price_ars.toLocaleString("es-AR")} ARS
                    </span>
                    {" / "}
                    <span className="font-semibold text-foreground">${plan.price_usd} USD</span>
                    {" · "}por mes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleToggle(plan)} className="gap-1.5">
                  {plan.is_active
                    ? <><ToggleRight className="w-4 h-4 text-green-500" /> Desactivar</>
                    : <><ToggleLeft className="w-4 h-4" /> Activar</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(plan)} className="gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
              </div>
            </div>

            {/* Límites y features */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {[
                { label: "Staff", value: plan.max_staff ?? "∞" },
                { label: "Turnos/mes", value: plan.max_bookings_per_month ?? "∞" },
                { label: "Servicios", value: plan.max_services ?? "∞" },
                { label: "Reportes", value: plan.reports === "full" ? "Completos" : "Básicos" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/50 rounded-lg px-3 py-2 text-xs">
                  <p className="text-muted-foreground">{label}</p>
                  <p className="font-semibold text-sm">{value}</p>
                </div>
              ))}
              {[
                { label: "WhatsApp", active: plan.whatsapp_reminders },
                { label: "Pagos online", active: plan.online_payments },
                { label: "Multi-sucursal", active: plan.multi_location },
                { label: "API", active: plan.api_access },
                { label: "Branding", active: plan.custom_branding },
              ].map(({ label, active }) => (
                <div key={label} className={`rounded-lg px-3 py-2 text-xs ${active ? "bg-green-50 text-green-700" : "bg-muted/50 text-muted-foreground"}`}>
                  <p>{active ? "✓" : "✗"} {label}</p>
                </div>
              ))}
            </div>

            {plan.stripe_price_id && (
              <p className="mt-3 text-xs text-muted-foreground font-mono">Stripe: {plan.stripe_price_id}</p>
            )}
          </div>
        ))}
      </div>

      {editing !== null && (
        <PlanForm
          plan={editing === "new" ? null : editing}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
