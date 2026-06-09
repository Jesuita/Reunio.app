import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthOrgId } from "@/lib/auth";

const patchSchema = z.object({
  name:          z.string().min(1).optional(),
  description:   z.string().optional().nullable(),
  phone:         z.string().optional().nullable(),
  address:       z.string().optional().nullable(),
  website:       z.string().url().optional().nullable(),
  timezone:      z.string().optional(),
  // Directory fields
  rubro:         z.string().optional().nullable(),
  city:          z.string().optional().nullable(),
  is_listed:     z.boolean().optional(),
  logo_url:      z.string().url().optional().nullable(),
  avatar_url:    z.string().url().optional().nullable(),
  cover_url:     z.string().url().optional().nullable(),
  settings:      z.record(z.unknown()).optional(),
  // Partial settings merge (for widget settings, etc.)
  settings_patch: z.record(z.unknown()).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthOrgId();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Only allow patching the user's own org
  if (params.id !== auth.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { settings_patch, settings, ...rest } = parsed.data;
  const supabase = createClient();

  // If settings_patch provided, merge with existing settings
  let finalSettings = settings;
  if (settings_patch) {
    const { data: org } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", auth.orgId)
      .single();
    const existing = (org?.settings ?? {}) as Record<string, unknown>;
    finalSettings = { ...existing, ...settings_patch };
  }

  const updatePayload: Record<string, unknown> = { ...rest };
  if (finalSettings !== undefined) updatePayload.settings = finalSettings;

  const { data, error } = await supabase
    .from("organizations")
    .update(updatePayload)
    .eq("id", auth.orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ organization: data });
}
