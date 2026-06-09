/**
 * GET /api/v1/clients — list clients (paginated, searchable)
 */
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const q     = searchParams.get("q")?.trim();

  const supabase = createClient();

  let query = supabase
    .from("clients")
    .select("id, name, email, phone, created_at, tags, notes", { count: "exact" })
    .eq("organization_id", auth.organizationId)
    .eq("is_blacklisted", false)
    .order("name")
    .range((page - 1) * limit, page * limit - 1);

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, limit, pages: Math.ceil((count ?? 0) / limit) },
  });
}
