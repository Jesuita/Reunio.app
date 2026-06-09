import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthOrgId } from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/stripe";

export async function POST(_req: NextRequest) {
  const auth = await getAuthOrgId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { orgId } = auth;

  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  const customerId = (org?.settings as Record<string, unknown> | null)?.["stripe_customer_id"] as string | undefined;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
  }

  const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:8000";
  const url = await createBillingPortalSession({
    customerId,
    returnUrl: `${BASE_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url });
}
