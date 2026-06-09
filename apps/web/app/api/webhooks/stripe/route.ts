import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env["STRIPE_PRICE_PRO"]      ?? "price_pro"]:      "pro",
  [process.env["STRIPE_PRICE_BUSINESS"] ?? "price_business"]: "business",
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

  // Process async
  handleStripeEvent(event).catch((err) =>
    console.error("[Stripe webhook] processing error:", err),
  );

  return new NextResponse("OK", { status: 200 });
}

async function handleStripeEvent(event: { type: string; data: { object: unknown } }) {
  const supabase = createClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as {
        metadata?: { organization_id?: string };
        subscription?: string;
        line_items?: { data?: Array<{ price?: { id?: string } }> };
        customer?: string;
      };
      const orgId = session.metadata?.organization_id;
      if (!orgId) break;

      // Get the plan from the subscription's price
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
        expand: ["items.data.price"],
      });
      const priceId = (subscription.items.data[0]?.price as { id: string }).id;
      const planName = PLAN_BY_PRICE[priceId] ?? "pro";

      // Get the plan record
      const { data: plan } = await supabase
        .from("plans")
        .select("id")
        .eq("name", planName)
        .single();

      if (!plan) break;

      await supabase
        .from("organizations")
        .update({
          plan_id: plan.id,
          settings: supabase.rpc as unknown as undefined, // handled below
        })
        .eq("id", orgId);

      // Update org settings with subscription info
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
          settings: {
            ...settings,
            stripe_subscription_id: subscription.id,
            stripe_customer_id:     session.customer,
            plan_expires_at:        new Date(((subscription as unknown as { current_period_end: number }).current_period_end) * 1000).toISOString(),
          },
        })
        .eq("id", orgId);

      console.log(`[Stripe] activated plan '${planName}' for org ${orgId}`);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as { subscription?: string };
      if (!invoice.subscription) break;

      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const orgId = sub.metadata?.organization_id;
      if (!orgId) break;

      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

      const settings = (org?.settings ?? {}) as Record<string, unknown>;
      await supabase
        .from("organizations")
        .update({
          settings: {
            ...settings,
            plan_expires_at: new Date(((sub as unknown as { current_period_end: number }).current_period_end) * 1000).toISOString(),
          },
        })
        .eq("id", orgId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as { subscription?: string; customer_email?: string };
      console.warn(`[Stripe] payment failed for subscription ${invoice.subscription}`);
      // TODO: send warning email; 3-day grace period
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as { metadata?: { organization_id?: string } };
      const orgId = sub.metadata?.organization_id;
      if (!orgId) break;

      const { data: freePlan } = await supabase
        .from("plans")
        .select("id")
        .eq("name", "free")
        .single();

      if (freePlan) {
        await supabase
          .from("organizations")
          .update({ plan_id: freePlan.id })
          .eq("id", orgId);
        console.log(`[Stripe] downgraded org ${orgId} to Free`);
      }
      break;
    }
  }
}
