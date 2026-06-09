/**
 * Mercado Pago integration — deposit (seña) payment flow.
 *
 * Uses MP Checkout Pro (preference-based) so we don't handle card data directly.
 * Each org connects their own MP account via OAuth (implemented in Fase 5 settings).
 * For now uses the platform-level access token from env.
 *
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro
 */

import { MercadoPagoConfig, Preference, Payment, Refund } from "mercadopago";
import crypto from "crypto";

function getMPClient() {
  const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN not set");
  return new MercadoPagoConfig({ accessToken: token });
}

export type CreatePreferenceParams = {
  bookingId: string;
  serviceTitle: string;
  depositAmount: number;      // ARS
  clientEmail?: string;
  backUrlBase: string;        // e.g. https://reunio.app
  expiresInMinutes?: number;  // default 30
};

export type PreferenceResult = {
  preferenceId: string;
  initPoint: string;          // full MP checkout URL
};

/**
 * Create a Mercado Pago checkout preference for a deposit.
 * Returns the init_point URL to redirect the client to.
 */
export async function createDepositPreference(
  params: CreatePreferenceParams,
): Promise<PreferenceResult> {
  const client = getMPClient();
  const preference = new Preference(client);

  const expDate = new Date(
    Date.now() + (params.expiresInMinutes ?? 30) * 60_000,
  ).toISOString();

  const result = await preference.create({
    body: {
      items: [
        {
          id:         params.bookingId,
          title:      `Seña — ${params.serviceTitle}`,
          quantity:   1,
          unit_price: params.depositAmount,
          currency_id: "ARS",
        },
      ],
      payer: params.clientEmail ? { email: params.clientEmail } : undefined,
      back_urls: {
        success: `${params.backUrlBase}/booking/payment-result?status=success&bookingId=${params.bookingId}`,
        failure: `${params.backUrlBase}/booking/payment-result?status=failure&bookingId=${params.bookingId}`,
        pending: `${params.backUrlBase}/booking/payment-result?status=pending&bookingId=${params.bookingId}`,
      },
      auto_return:          "approved",
      notification_url:     `${params.backUrlBase}/api/webhooks/mercadopago`,
      external_reference:   params.bookingId,
      expires:              true,
      expiration_date_to:   expDate,
    },
  });

  return {
    preferenceId: result.id!,
    initPoint:    result.init_point!,
  };
}

/**
 * Fetch full payment data from MP API (for webhook processing).
 * Never trust webhook body alone — always re-fetch.
 */
export async function getPayment(paymentId: string) {
  const client = getMPClient();
  const payment = new Payment(client);
  return payment.get({ id: Number(paymentId) });
}

/**
 * Issue a full or partial refund.
 */
export async function refundPayment(
  paymentId: string,
  amount?: number,
) {
  const client = getMPClient();
  const refund = new Refund(client);
  return refund.create({
    payment_id: Number(paymentId),
    body: amount ? { amount } : undefined,
  });
}

/**
 * Verify the x-signature header from a MP webhook request.
 * Format: "ts=<timestamp>,v1=<hmac>"
 */
export function verifyMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  queryDataId: string | null,
): boolean {
  const secret = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
  if (!secret) return true; // skip in dev if not configured

  if (!xSignature) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=")),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Build the manifest string as per MP docs
  const manifest = `id:${queryDataId ?? ""};request-id:${xRequestId ?? ""};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  if (v1.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}
