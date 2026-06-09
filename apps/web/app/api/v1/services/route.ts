/**
 * GET /api/v1/services — list active services for the organization
 */
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, currency, description, category, color")
    .eq("organization_id", auth.organizationId)
    .eq("is_active", true)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
