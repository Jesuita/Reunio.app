/**
 * Reunio SaaS plan definitions and limit enforcement.
 */

export type PlanName = "free" | "pro" | "business";

export type PlanLimits = {
  maxStaff:            number | null;
  maxBookingsPerMonth: number | null;
  maxServices:         number | null;
  whatsappReminders:   boolean;
  onlinePayments:      boolean;
  multiLocation:       boolean;
  apiAccess:           boolean;
  customBranding:      boolean;
  reports:             "basic" | "full";
};

export type Plan = {
  name:          PlanName;
  label:         string;
  priceArs:      number;
  priceUsd:      number;
  stripePriceId: string | null;
  limits:        PlanLimits;
  highlight?:    string;
};

export const PLANS: Record<PlanName, Plan> = {
  free: {
    name:          "free",
    label:         "Free",
    priceArs:      0,
    priceUsd:      0,
    stripePriceId: null,
    limits: {
      maxStaff:            1,
      maxBookingsPerMonth: 30,
      maxServices:         5,
      whatsappReminders:   false,
      onlinePayments:      false,
      multiLocation:       false,
      apiAccess:           false,
      customBranding:      false,
      reports:             "basic",
    },
  },
  pro: {
    name:          "pro",
    label:         "Pro",
    priceArs:      19000,
    priceUsd:      19,
    stripePriceId: process.env["STRIPE_PRICE_PRO"] ?? null,
    highlight:     "Más popular",
    limits: {
      maxStaff:            5,
      maxBookingsPerMonth: null,
      maxServices:         null,
      whatsappReminders:   true,
      onlinePayments:      true,
      multiLocation:       false,
      apiAccess:           false,
      customBranding:      false,
      reports:             "full",
    },
  },
  business: {
    name:          "business",
    label:         "Business",
    priceArs:      49000,
    priceUsd:      49,
    stripePriceId: process.env["STRIPE_PRICE_BUSINESS"] ?? null,
    limits: {
      maxStaff:            null,
      maxBookingsPerMonth: null,
      maxServices:         null,
      whatsappReminders:   true,
      onlinePayments:      true,
      multiLocation:       true,
      apiAccess:           true,
      customBranding:      true,
      reports:             "full",
    },
  },
};

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
  // Dynamic import keeps next/headers out of the client bundle
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("plan_id, plans(name)")
    .eq("id", organizationId)
    .single();

  const planName = ((org?.plans as { name?: string } | null)?.name ?? "free") as PlanName;
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
        return {
          allowed: false,
          reason: `Llegaste al límite de ${limits.maxStaff} profesional${limits.maxStaff !== 1 ? "es" : ""} en el plan ${plan.label}.`,
          upgradeRequired: planName === "free" ? "pro" : "business",
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
        return {
          allowed: false,
          reason: `Llegaste al límite de ${limits.maxServices} servicios en el plan ${plan.label}.`,
          upgradeRequired: "pro",
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
        return {
          allowed: false,
          reason: `Llegaste al límite de ${limits.maxBookingsPerMonth} turnos por mes en el plan ${plan.label}.`,
          upgradeRequired: "pro",
        };
      }
      return { allowed: true };
    }

    case "use_whatsapp":
      if (!limits.whatsappReminders) {
        return {
          allowed: false,
          reason: "Los recordatorios por WhatsApp no están disponibles en el plan Free.",
          upgradeRequired: "pro",
        };
      }
      return { allowed: true };

    case "process_payment":
      if (!limits.onlinePayments) {
        return {
          allowed: false,
          reason: "El cobro de señas online no está disponible en el plan Free.",
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
