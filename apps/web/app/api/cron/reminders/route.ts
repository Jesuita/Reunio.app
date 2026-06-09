import { NextRequest, NextResponse } from "next/server";
import { processReminders } from "@/lib/reminders";

/**
 * GET /api/cron/reminders
 *
 * Called by Vercel Cron every 15 minutes.
 * Secured with CRON_SECRET header.
 *
 * vercel.json configuration:
 * vercel.json: schedule "* /15 * * * *" (every 15 min)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
