import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPayment, verifyMercadoPagoSignature } from "@/lib/mercadopago";
import { scheduleReminders } from "@/lib/reminders";

/**
 * POST /api/webhooks/mercadopago
 *
 * Receives payment status notifications from Mercado Pago.
 * Security: HMAC-SHA256 signature verification.
 * Idempotency: check payments.external_id before processing.
 */
export async function POST(req: NextRequest) {
  // ── 1. Verify signature ──────────────────────────────────────────────────
  const xSignature  = req.headers.get("x-signature");
  const xRequestId  = req.headers.get("x-request-id");
  const url         = new URL(req.url);
  const dataId      = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (!verifyMercadoPagoSignature(xSignature, xRequestId, dataId)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 2. Parse body — return 200 fast for non-payment events ───────────────
  let body: { type?: string; data?: { id?: string } };
  try {
    body = await req.json();
  } catch {
    return new NextResponse("OK", { status: 200 });
  }

  if (body.type !== "payment" || !body.data?.id) {
    return new NextResponse("OK", { status: 200 });
  }

  const paymentId = String(body.data.id);

  // Process async — return 200 immediately so MP doesn't retry
  processPayment(paymentId).catch((err) =>
    console.error("[MP webhook] processing error", err),
  );

  return new NextResponse("OK", { status: 200 });
}

async function processPayment(paymentId: string) {
  const supabase = createClient();

  // ── 3. Idempotency: skip if already processed ────────────────────────────
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("external_id", paymentId)
    .maybeSingle();

  if (existingPayment?.status === "paid") {
    console.log("[MP webhook] already processed:", paymentId);
    return;
  }

  // ── 4. Fetch real payment data from MP API ───────────────────────────────
  let payment;
  try {
    payment = await getPayment(paymentId);
  } catch (err) {
    console.error("[MP webhook] failed to fetch payment:", err);
    return;
  }

  const bookingId = payment.external_reference;
  if (!bookingId) return;

  // ── 5. Fetch booking ─────────────────────────────────────────────────────
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, organization_id, status, payment_status, starts_at, ends_at, service_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    console.error("[MP webhook] booking not found:", bookingId);
    return;
  }

  // ── 6. Handle payment status ─────────────────────────────────────────────
  if (payment.status === "approved") {
    // Upsert payment record
    await supabase.from("payments").upsert(
      {
        organization_id:    booking.organization_id,
        booking_id:         bookingId,
        provider:           "mercadopago",
        type:               "deposit",
        external_id:        paymentId,
        amount:             payment.transaction_amount ?? 0,
        currency:           "ARS",
        status:             "paid",
        paid_at:            new Date().toISOString(),
      },
      { onConflict: "external_id" },
    );

    // Confirm the booking
    await supabase
      .from("bookings")
      .update({ status: "confirmed", payment_status: "deposit_paid" })
      .eq("id", bookingId);

    // Schedule reminders (replace pending ones with properly scheduled ones)
    await scheduleReminders({
      bookingId,
      startsAt: new Date(booking.starts_at),
      endsAt:   new Date(booking.ends_at),
    });

    console.log("[MP webhook] booking confirmed:", bookingId);
  } else if (payment.status === "rejected" || payment.status === "cancelled") {
    // Cancel the booking and free the slot
    await supabase
      .from("bookings")
      .update({ status: "cancelled", payment_status: "failed" })
      .eq("id", bookingId);

    // Cancel pending reminders
    await supabase
      .from("reminders")
      .update({ status: "failed", error: `payment_${payment.status}` })
      .eq("booking_id", bookingId)
      .eq("status", "pending");

    console.log("[MP webhook] booking cancelled (payment rejected):", bookingId);
  }
  // status 'pending' | 'in_process' → wait for another webhook
}

// ── GET for webhook verification by MP ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (challenge) return new NextResponse(challenge, { status: 200 });
  return new NextResponse("OK", { status: 200 });
}
