import { z } from "zod";

// ─── Server-side env vars ────────────────────────────────────────────────────
// Required in production; optional locally while services aren't configured.
const server = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Payments — optional until Mercado Pago is configured
  MERCADOPAGO_ACCESS_TOKEN:  z.string().min(1).optional(),
  MERCADOPAGO_WEBHOOK_SECRET:z.string().min(1).optional(),

  // Stripe — optional until billing is configured
  STRIPE_SECRET_KEY:     z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // WhatsApp — optional until 360dialog is configured
  WHATSAPP_API_TOKEN: z.string().min(1).optional(),
  WHATSAPP_API_URL:   z.string().url().optional(),

  // Email — optional until Resend is configured
  RESEND_API_KEY: z.string().min(1).optional(),

  // Jobs — optional until Inngest is configured
  INNGEST_EVENT_KEY:   z.string().min(1).optional(),
  INNGEST_SIGNING_KEY: z.string().min(1).optional(),

  // Monitoring — always optional
  SENTRY_DSN: z.string().url().optional(),

  // Auth / misc
  JWT_SECRET: z.string().min(32).optional(),
});

// ─── Client-side env vars ────────────────────────────────────────────────────
const client = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Stripe public key — optional until billing is configured
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // Analytics — optional
  NEXT_PUBLIC_SENTRY_DSN:   z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY:  z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Mercado Pago public key — optional until configured
  MERCADOPAGO_PUBLIC_KEY: z.string().min(1).optional(),
});

const processEnv = {
  SUPABASE_SERVICE_ROLE_KEY:         process.env["SUPABASE_SERVICE_ROLE_KEY"],
  MERCADOPAGO_ACCESS_TOKEN:          process.env["MERCADOPAGO_ACCESS_TOKEN"],
  MERCADOPAGO_WEBHOOK_SECRET:        process.env["MERCADOPAGO_WEBHOOK_SECRET"],
  STRIPE_SECRET_KEY:                 process.env["STRIPE_SECRET_KEY"],
  STRIPE_WEBHOOK_SECRET:             process.env["STRIPE_WEBHOOK_SECRET"],
  WHATSAPP_API_TOKEN:                process.env["WHATSAPP_API_TOKEN"],
  WHATSAPP_API_URL:                  process.env["WHATSAPP_API_URL"],
  RESEND_API_KEY:                    process.env["RESEND_API_KEY"],
  INNGEST_EVENT_KEY:                 process.env["INNGEST_EVENT_KEY"],
  INNGEST_SIGNING_KEY:               process.env["INNGEST_SIGNING_KEY"],
  SENTRY_DSN:                        process.env["SENTRY_DSN"],
  JWT_SECRET:                        process.env["JWT_SECRET"],
  NEXT_PUBLIC_SUPABASE_URL:          process.env["NEXT_PUBLIC_SUPABASE_URL"],
  NEXT_PUBLIC_SUPABASE_ANON_KEY:     process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  NEXT_PUBLIC_SENTRY_DSN:            process.env["NEXT_PUBLIC_SENTRY_DSN"],
  NEXT_PUBLIC_POSTHOG_KEY:           process.env["NEXT_PUBLIC_POSTHOG_KEY"],
  NEXT_PUBLIC_POSTHOG_HOST:          process.env["NEXT_PUBLIC_POSTHOG_HOST"],
  NEXT_PUBLIC_APP_URL:               process.env["NEXT_PUBLIC_APP_URL"],
  MERCADOPAGO_PUBLIC_KEY:            process.env["MERCADOPAGO_PUBLIC_KEY"],
};

// Validate on import — fails fast at startup if core env is misconfigured.
// Set SKIP_ENV_VALIDATION=1 to bypass (e.g. during CI builds).
const skip = process.env["SKIP_ENV_VALIDATION"] === "1";

export const env = skip
  ? (processEnv as z.infer<typeof server> & z.infer<typeof client>)
  : { ...server.parse(processEnv), ...client.parse(processEnv) };
