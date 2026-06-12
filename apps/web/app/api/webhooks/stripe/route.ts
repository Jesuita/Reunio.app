import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env["STRIPE_PRICE_STARTER"]  ?? "price_starter"]:  "starter",
  [process.env["STRIPE_PRICE_PRO"]      ?? "price_pro"]:       "pro",
  [process.env["STRIPE_PRICE_BUSINESS"] ?? "price_business"]:  "business",
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig     = req.headers.get("stripe-signature");
  const secret  = process.env["STRIPE_WEBHOOK_SECRET"];

  if (!secret || !sig) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: { type: string; data: { object: unknown } };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret) as any;
  } catch (err) {
    console.error("[Stripe webhook] signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  handleStripeEvent(event).catch((err) =>
    console.error("[Stripe webhook] processing error:", err),
  );

  return new NextResponse("OK", { status: 200 });
}

async function getOrgIdByCustomer(customerId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .filter("settings->stripe_customer_id", "eq", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function setPlanForOrg(orgId: string, planName: string, extraSettings?: Record<string, unknown>) {
  const supabase = createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("name", planName)
    .single();

  if (!plan) {
    console.error(`[Stripe] plan '${planName}' not found in DB`);
    return;
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  const settings = (org?.settings ?? {}) as Record<string, unknown>;

  await supabase
    .from("organizations")
    .update({
      plan_id:  plan.id,
      settings: { ...settings, ...extraSettings },
    })
    .eq("id", orgId);
}

async function handleStripeEvent(event: { type: string; data: { object: unknown } }) {
  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object as {
        metadata?: { organization_id?: string };
        subscription?: string;
        customer?: string;
      };

      const orgId = session.metadata?.organization_id;
      if (!orgId || !session.subscription) break;

      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(session.subscription, {
        expand: ["items.data.price"],
      });

      // Tag the subscription with org id for future webhook lookups
      if (!sub.metadata?.organization_id) {
        await stripe.subscriptions.update(session.subscription, {
          metadata: { organization_id: orgId },
        });
      }

      const priceId = (sub.items.data[0]?.price as { id: string }).id;
      const planName = PLAN_BY_PRICE[priceId] ?? "pro";
      const periodEnd = new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString();

      await setPlanForOrg(orgId, planName, {
        stripe_customer_id:     session.customer,
        stripe_subscription_id: sub.id,
        plan_expires_at:        periodEnd,
      });

      console.log(`[Stripe] activated '${planName}' for org ${orgId}`);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as {
        id: string;
        metadata?: { organization_id?: string };
        customer: string;
        status: string;
        items: { data: Array<{ price: { id: string } }> };
        current_period_end: number;
      };

      const orgId = sub.metadata?.organization_id
        ?? await getOrgIdByCustomer(sub.customer);
      if (!orgId) break;

      const priceId = sub.items.data[0]?.price?.id;
      const planName = priceId ? (PLAN_BY_PRICE[priceId] ?? "pro") : null;

      if (planName) {
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        await setPlanForOrg(orgId, planName, { plan_expires_at: periodEnd });
        console.log(`[Stripe] updated plan to '${planName}' for org ${orgId}`);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as {
        subscription?: string;
        customer?: string;
      };
      if (!invoice.subscription) break;

      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);

      const orgId = sub.metadata?.organization_id
        ?? await getOrgIdByCustomer(invoice.customer ?? "");
      if (!orgId) break;

      const periodEnd = new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString();
      const supabase = createClient();
      const { data: org } = await supabase.from("organizations").select("settings").eq("id", orgId).single();
      const settings = (org?.settings ?? {}) as Record<string, unknown>;

      await supabase
        .from("organizations")
        .update({ settings: { ...settings, plan_expires_at: periodEnd } })
        .eq("id", orgId);

      console.log(`[Stripe] renewed subscription for org ${orgId} until ${periodEnd}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as { subscription?: string };
      console.warn(`[Stripe] payment failed for subscription ${invoice.subscription}`);
      // TODO: grace period + email warning
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as {
        metadata?: { organization_id?: string };
        customer: string;
      };

      const orgId = sub.metadata?.organization_id
        ?? await getOrgIdByCustomer(sub.customer);
      if (!orgId) break;

      await setPlanForOrg(orgId, "free", {
        stripe_subscription_id: null,
        plan_expires_at:         null,
      });
      console.log(`[Stripe] downgraded org ${orgId} to Free (subscription cancelled)`);
      break;
    }
  }
}
