import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    _stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
  }
  return _stripe;
}

export async function getOrCreateStripeCustomer(params: {
  organizationId: string;
  orgName:        string;
  email:          string;
  existingId?:    string;
}): Promise<string> {
  const stripe = getStripe();

  if (params.existingId) return params.existingId;

  const customer = await stripe.customers.create({
    name:     params.orgName,
    email:    params.email,
    metadata: { organization_id: params.organizationId },
  });

  return customer.id;
}

export async function createCheckoutSession(params: {
  customerId:      string;
  stripePriceId:   string;
  organizationId:  string;
  successUrl:      string;
  cancelUrl:       string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    customer:   params.customerId,
    line_items: [{ price: params.stripePriceId, quantity: 1 }],
    mode:       "subscription",
    success_url: params.successUrl,
    cancel_url:  params.cancelUrl,
    metadata:    { organization_id: params.organizationId },
    allow_promotion_codes: true,
  });

  return session.url!;
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl:  string;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer:   params.customerId,
    return_url: params.returnUrl,
  });
  return session.url;
}
