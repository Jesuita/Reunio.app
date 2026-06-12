import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthOrgId } from "@/lib/auth";
import { PLANS, type PlanName } from "@/lib/plans";
import { getOrCreateStripeCustomer, createCheckoutSession } from "@/lib/stripe";

const bodySchema = z.object({
  plan: z.enum(["starter", "pro", "business"]),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthOrgId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { orgId } = auth;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planConfig = PLANS[parsed.data.plan as PlanName];
  if (!planConfig.stripePriceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
  }

  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, settings")
    .eq("id", orgId)
    .single();

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const settings = (org.settings ?? {}) as Record<string, unknown>;
  const existingCustomerId = settings["stripe_customer_id"] as string | undefined;

  // Get the current user's email for Stripe
  const { data: { user } } = await supabase.auth.getUser();

  const customerId = await getOrCreateStripeCustomer({
    organizationId: orgId,
    orgName:        org.name,
    email:          user?.email ?? `billing+${orgId}@reunio.app`,
    existingId:     existingCustomerId,
  });

  if (!existingCustomerId) {
    await supabase
      .from("organizations")
      .update({ settings: { ...settings, stripe_customer_id: customerId } })
      .eq("id", orgId);
  }

  const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";
  const url = await createCheckoutSession({
    customerId,
    stripePriceId:  planConfig.stripePriceId,
    organizationId: orgId,
    successUrl:     `${BASE_URL}/dashboard/billing?success=true`,
    cancelUrl:      `${BASE_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url });
}
