import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const supabase = createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );

  let query = supabase
    .from("cities")
    .select("id, name, province")
    .order("name")
    .limit(20);

  if (q.length >= 2) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ cities: [] });

  return NextResponse.json({ cities: data ?? [] });
}
