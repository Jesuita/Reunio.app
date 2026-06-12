/**
 * Server-only plan limit enforcement.
 * Separated from lib/plans.ts so that client components can safely import
 * PLANS/PlanName without pulling next/headers into the client bundle.
 */
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanName } from "@/lib/plans";

export type LimitAction =
  | "add_staff"
  | "create_booking"
  | "add_service"
  | "use_whatsapp"
  | "process_payment"
  | "use_api"
  | "multi_location";

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; upgradeRequired: PlanName };

export async function checkPlanLimit(
  organizationId: string,
  action: LimitAction,
): Promise<LimitCheckResult> {
  const supabase = createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("plan_id, trial_ends_at, plans(name)")
    .eq("id", organizationId)
    .single();

  const basePlan = ((org?.plans as { name?: string } | null)?.name ?? "free") as PlanName;
  const trialEndsAt = (org as { trial_ends_at?: string | null } | null)?.trial_ends_at;
  const trialActive = !!trialEndsAt && new Date(trialEndsAt) > new Date();
  const planName: PlanName = trialActive && basePlan === "free" ? "pro" : basePlan;
  const plan = PLANS[planName] ?? PLANS.free;
  const limits = plan.limits;

  switch (action) {
    case "add_staff": {
      if (limits.maxStaff === null) return { allowed: true };
      const { count } = await supabase
        .from("staff")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("is_active", true);
      if ((count ?? 0) >= limits.maxStaff) {
        const next = planName === "free" ? "starter" : planName === "starter" ? "pro" : "business";
        return {
          allowed: false,
          reason: `Llegaste al límite de ${limits.maxStaff} profesional${limits.maxStaff !== 1 ? "es" : ""} en el plan ${plan.label}.`,
          upgradeRequired: next,
        };
      }
      return { allowed: true };
    }

    case "add_service": {
      if (limits.maxServices === null) return { allowed: true };
      const { count } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("is_active", true);
      if ((count ?? 0) >= limits.maxServices) {
        const next = planName === "free" ? "starter" : planName === "starter" ? "pro" : "business";
        return {
          allowed: false,
          reason: `Llegaste al límite de ${limits.maxServices} servicio${limits.maxServices !== 1 ? "s" : ""} en el plan ${plan.label}.`,
          upgradeRequired: next,
        };
      }
      return { allowed: true };
    }

    case "create_booking": {
      if (limits.maxBookingsPerMonth === null) return { allowed: true };
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("created_at", monthStart)
        .neq("status", "cancelled");
      if ((count ?? 0) >= limits.maxBookingsPerMonth) {
        const next = planName === "free" ? "starter" : planName === "starter" ? "pro" : "business";
        return {
          allowed: false,
          reason: `Llegaste al límite de ${limits.maxBookingsPerMonth} turnos por mes en el plan ${plan.label}.`,
          upgradeRequired: next,
        };
      }
      return { allowed: true };
    }

    case "use_whatsapp":
      if (!limits.whatsappReminders) {
        return {
          allowed: false,
          reason: "Los recordatorios por WhatsApp requieren el plan Pro o superior.",
          upgradeRequired: "pro",
        };
      }
      return { allowed: true };

    case "process_payment":
      if (!limits.onlinePayments) {
        return {
          allowed: false,
          reason: "El cobro de señas online requiere el plan Pro o superior.",
          upgradeRequired: "pro",
        };
      }
      return { allowed: true };

    case "use_api":
      if (!limits.apiAccess) {
        return {
          allowed: false,
          reason: "El acceso a la API no está disponible en este plan.",
          upgradeRequired: "business",
        };
      }
      return { allowed: true };

    case "multi_location":
      if (!limits.multiLocation) {
        return {
          allowed: false,
          reason: "La gestión de múltiples sucursales no está disponible en este plan.",
          upgradeRequired: "business",
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}
