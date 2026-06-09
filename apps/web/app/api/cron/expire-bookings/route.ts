import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyWaitlist } from "@/lib/waitlist";

/**
 * GET /api/cron/expire-bookings
 *
 * Called every 5 minutes. Cancels pending bookings with unpaid deposits
 * that have been waiting more than 30 minutes (configurable per org).
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
  const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();

  const { data: expired } = await supabase
    .from("bookings")
    .select("id, organization_id, service_id, starts_at")
    .eq("status", "pending")
    .eq("payment_status", "unpaid")
    .lt("created_at", cutoff);

  if (!expired?.length) {
    return NextResponse.json({ ok: true, expired: 0 });
  }

  const ids = expired.map((b) => b.id);

  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .in("id", ids);

  // Cancel pending reminders for expired bookings
  await supabase
    .from("reminders")
    .update({ status: "failed", error: "booking_expired" })
    .in("booking_id", ids)
    .eq("status", "pending");

  // Notify waitlist for each expired booking
  for (const booking of expired) {
    notifyWaitlist({
      organizationId: booking.organization_id,
      serviceId:      booking.service_id,
      date:           booking.starts_at.slice(0, 10),
    }).catch(console.error);
  }

  console.log(`[cron/expire-bookings] cancelled ${expired.length} bookings`);
  return NextResponse.json({ ok: true, expired: expired.length });
}
