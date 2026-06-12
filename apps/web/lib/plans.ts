/**
 * Reunio SaaS plan definitions and limit enforcement.
 */

export type PlanName = "free" | "starter" | "pro" | "business";

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
      maxServices:         1,
      whatsappReminders:   false,
      onlinePayments:      false,
      multiLocation:       false,
      apiAccess:           false,
      customBranding:      false,
      reports:             "basic",
    },
  },
  starter: {
    name:          "starter",
    label:         "Starter",
    priceArs:      6000,
    priceUsd:      6,
    stripePriceId: process.env["STRIPE_PRICE_STARTER"] ?? null,
    limits: {
      maxStaff:            2,
      maxBookingsPerMonth: 200,
      maxServices:         3,
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
      maxStaff:            10,
      maxBookingsPerMonth: 500,
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

// checkPlanLimit lives in lib/plans.server.ts to keep this file client-safe
