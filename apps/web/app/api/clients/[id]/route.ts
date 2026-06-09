import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthOrgId } from "@/lib/auth";

const patchSchema = z.object({
  notes:          z.string().optional(),
  is_blacklisted: z.boolean().optional(),
  tags:           z.array(z.string()).optional(),
  name:           z.string().min(1).optional(),
  email:          z.string().email().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthOrgId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("organization_id", auth.orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}
