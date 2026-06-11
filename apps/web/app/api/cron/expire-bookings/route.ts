import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyWaitlist } from "@/lib/waitlist";

/**
 * GET /api/cron/expire-bookings
 *
 * Called every 5 minutes. Handles two cases:
 *   1. Cancels "pending" (unpaid deposit) bookings older than 30 minutes.
 *   2. Marks "confirmed" bookings whose end time has passed as "no_show".
 *
 * vercel.json: schedule "* /5 * * * *" (every 5 min)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const now = new Date().toISOString();

  // ── 1. Expire unpaid pending bookings (deposit not paid within 30 min) ──────
  const depositCutoff = new Date(Date.now() - 30 * 60_000).toISOString();

  const { data: unpaidBookings } = await supabase
    .from("bookings")
    .select("id, organization_id, service_id, starts_at")
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .lt("created_at", depositCutoff);

  if (unpaidBookings?.length) {
    const ids = unpaidBookings.map((b) => b.id);
    await supabase.from("bookings").update({ status: "cancelled" }).in("id", ids);
    await supabase
      .from("reminders")
      .update({ status: "failed", error: "booking_expired" })
      .in("booking_id", ids)
      .eq("status", "pending");

    for (const booking of unpaidBookings) {
      notifyWaitlist({
        organizationId: booking.organization_id,
        serviceId:      booking.service_id,
        date:           booking.starts_at.slice(0, 10),
      }).catch(console.error);
    }
    console.log(`[cron/expire-bookings] cancelled ${unpaidBookings.length} unpaid bookings`);
  }

  // ── 2. Auto no-show: confirmed bookings whose end time already passed ────────
  const { data: pastBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "confirmed")
    .lt("ends_at", now);

  if (pastBookings?.length) {
    const ids = pastBookings.map((b) => b.id);
    await supabase.from("bookings").update({ status: "no_show" }).in("id", ids);
    await supabase
      .from("reminders")
      .update({ status: "failed", error: "booking_no_show" })
      .in("booking_id", ids)
      .eq("status", "pending");
    console.log(`[cron/expire-bookings] marked ${pastBookings.length} bookings as no_show`);
  }

  return NextResponse.json({
    ok: true,
    expired: unpaidBookings?.length ?? 0,
    noShow:  pastBookings?.length ?? 0,
  });
}
